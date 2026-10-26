"use client";

import { useState } from "react";
import { LevelBadge } from "@/components/level-badge";
import { formatWait } from "@/lib/levels";
import type { Sex, Symptom, TriageInput, TriageResult, VitalSigns } from "@/lib/triage-types";
import { VITAL_FIELDS, criticalAlerts } from "@/lib/vital-signs";

type Props = {
  symptoms: Symptom[];
  catalogError: boolean;
};

const inputClass =
  "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm";
const sectionClass = "rounded-lg border border-border bg-surface p-5";

function readVitals(form: FormData): VitalSigns {
  const vitals: VitalSigns = {};
  for (const field of VITAL_FIELDS) {
    const raw = form.get(field.key);
    if (typeof raw === "string" && raw.trim() !== "") vitals[field.key] = Number(raw);
  }
  return vitals;
}

export function TriageForm({ symptoms, catalogError }: Props) {
  const [vitals, setVitals] = useState<VitalSigns>({});
  const [result, setResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const alerts = criticalAlerts(vitals);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: TriageInput = {
      age: Number(form.get("age")),
      sex: form.get("sex") as Sex,
      chief_complaint: String(form.get("chief_complaint")).trim(),
      symptoms: form.getAll("symptoms").map(String),
      vital_signs: readVitals(form),
    };

    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/triages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Não foi possível classificar.");
        return;
      }
      setResult(body);
    } catch {
      setError("Falha de conexão com o servidor.");
    } finally {
      setPending(false);
    }
  }

  function reset() {
    setResult(null);
    setVitals({});
  }

  if (result) {
    return (
      <TriageResultPanel
        result={result}
        alerts={alerts.map((a) => a.message)}
        onReset={reset}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      onChange={(e) => setVitals(readVitals(new FormData(e.currentTarget)))}
      className="mt-8 space-y-6"
    >
      <fieldset className={sectionClass}>
        <legend className="px-1 font-semibold">Paciente</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Idade (anos)
            <input name="age" type="number" min={0} max={130} required className={inputClass} />
          </label>
          <label className="block text-sm font-medium">
            Sexo
            <select name="sex" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Selecione
              </option>
              <option value="F">Feminino</option>
              <option value="M">Masculino</option>
            </select>
          </label>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Paciente sem documento: informe a idade estimada. O cadastro provisório
          (RF11) entra quando a API tiver a tabela de pacientes.
        </p>
      </fieldset>

      <fieldset className={sectionClass}>
        <legend className="px-1 font-semibold">Relato e sintomas</legend>
        <label className="block text-sm font-medium">
          Queixa principal, nas palavras do paciente
          <textarea
            name="chief_complaint"
            required
            rows={3}
            placeholder="Ex.: aperto forte no peito desde cedo"
            className={inputClass}
          />
        </label>

        <div className="mt-4">
          <p className="text-sm font-medium">Sintomas identificados</p>
          {catalogError ? (
            <p className="mt-2 text-sm text-danger">
              Catálogo de sintomas indisponível. A triagem segue apenas com o relato.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {symptoms.map((s) => (
                <label
                  key={s.code}
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm has-checked:border-accent has-checked:bg-accent/10"
                >
                  <input type="checkbox" name="symptoms" value={s.code} className="accent-accent" />
                  {s.name}
                  {s.is_red_flag && (
                    <span className="text-xs font-semibold text-danger" title="Sinal de alerta">
                      alerta
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
      </fieldset>

      <fieldset className={sectionClass}>
        <legend className="px-1 font-semibold">Sinais vitais</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          {VITAL_FIELDS.map((field) => {
            const critical = alerts.some((a) => a.key === field.key);
            return (
              <label key={field.key} className="block text-sm font-medium">
                {field.label} <span className="font-normal text-muted-foreground">({field.unit})</span>
                <input
                  name={field.key}
                  type="number"
                  inputMode="decimal"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  aria-invalid={critical || undefined}
                  className={`${inputClass} ${critical ? "border-danger ring-1 ring-danger" : ""}`}
                />
              </label>
            );
          })}
        </div>
        {alerts.length > 0 && (
          <ul role="alert" className="mt-4 space-y-1 rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
            {alerts.map((a) => (
              <li key={a.key}>⚠ {a.message}</li>
            ))}
          </ul>
        )}
      </fieldset>

      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-60"
      >
        {pending ? "Classificando…" : "Classificar risco"}
      </button>
    </form>
  );
}

function TriageResultPanel({
  result,
  alerts,
  onReset,
}: {
  result: TriageResult;
  alerts: string[];
  onReset: () => void;
}) {
  const { classification } = result;
  const probabilities = Object.entries(result.probabilities).sort(([, a], [, b]) => b - a);

  return (
    <section className="mt-8 max-w-2xl space-y-6" aria-live="polite">
      <div className={sectionClass}>
        <p className="text-sm text-muted-foreground">Nível sugerido</p>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <LevelBadge priority={classification.priority} size="lg" />
          <span className="text-sm text-muted-foreground">
            Tempo-alvo: {formatWait(classification.max_wait_minutes)}
          </span>
        </div>

        {result.needs_human_review && (
          <p className="mt-4 rounded-md bg-warning-bg px-4 py-3 text-sm font-medium text-warning-fg">
            Revisão humana necessária: confiança abaixo do limiar. A enfermagem
            deve decidir o nível explicitamente.
          </p>
        )}

        {alerts.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm text-danger">
            {alerts.map((a) => (
              <li key={a}>⚠ {a}</li>
            ))}
          </ul>
        )}

        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Confiança</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {(result.confidence * 100).toFixed(0)}%
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Modelo</dt>
            <dd className="font-medium">{result.model}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Triagem nº</dt>
            <dd className="font-medium tabular-nums">{result.id}</dd>
          </div>
        </dl>
      </div>

      <div className={sectionClass}>
        <h2 className="text-sm font-semibold">Probabilidade por nível</h2>
        <ul className="mt-3 space-y-2">
          {probabilities.map(([code, p]) => (
            <li key={code} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3 text-sm">
              <span>{code}</span>
              <span className="h-2 overflow-hidden rounded-full bg-muted">
                <span className="block h-full bg-accent" style={{ width: `${p * 100}%` }} />
              </span>
              <span className="text-right tabular-nums">{(p * 100).toFixed(0)}%</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="rounded-md border border-border px-5 py-2 text-sm font-medium hover:bg-muted"
      >
        Nova triagem
      </button>
    </section>
  );
}
