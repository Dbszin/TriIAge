import type { Metadata } from "next";
import { Suspense } from "react";
import { triageApi } from "@/lib/triage-api";
import type { Symptom } from "@/lib/triage-types";
import { TriageForm } from "./triage-form";

export const metadata: Metadata = { title: "Nova triagem" };

export default function NewTriagePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Nova triagem</h1>
      <p className="mt-1 text-muted-foreground">
        Registre o relato, os sintomas e os sinais vitais. A sugestão de nível
        precisa ser validada pela enfermagem.
      </p>
      <Suspense fallback={<p className="mt-8 text-sm text-muted-foreground">Carregando catálogo…</p>}>
        <FormWithCatalog />
      </Suspense>
    </div>
  );
}

async function FormWithCatalog() {
  let symptoms: Symptom[] = [];
  let catalogError = false;
  try {
    symptoms = await triageApi.symptoms();
  } catch {
    // A triagem não pode ser bloqueada: segue só com o relato livre.
    catalogError = true;
  }
  return <TriageForm symptoms={symptoms} catalogError={catalogError} />;
}
