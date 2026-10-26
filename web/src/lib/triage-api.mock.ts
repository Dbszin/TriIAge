import "server-only";

import type {
  HealthStatus,
  RiskClassification,
  Symptom,
  TriageInput,
  TriageResult,
} from "./triage-types";

// Respostas simuladas para desenvolver o front sem o microsserviço
// (TRIAGE_API_MOCK=true). A regra abaixo é só um stub, não é Manchester.

const CLASSIFICATIONS: RiskClassification[] = [
  { code: "VERMELHO", name: "Emergência", priority: 1, max_wait_minutes: 0, description: "Atendimento imediato." },
  { code: "LARANJA", name: "Muito urgente", priority: 2, max_wait_minutes: 10, description: "Atendimento em até 10 minutos." },
  { code: "AMARELO", name: "Urgente", priority: 3, max_wait_minutes: 60, description: "Atendimento em até 60 minutos." },
  { code: "VERDE", name: "Pouco urgente", priority: 4, max_wait_minutes: 120, description: "Atendimento em até 120 minutos." },
  { code: "AZUL", name: "Não urgente", priority: 5, max_wait_minutes: 240, description: "Atendimento em até 240 minutos." },
];

const SYMPTOMS: Symptom[] = [
  { code: "DOR_TORACICA", name: "Dor torácica", is_red_flag: true },
  { code: "DISPNEIA", name: "Falta de ar (dispneia)", is_red_flag: true },
  { code: "CEFALEIA", name: "Dor de cabeça (cefaleia)", is_red_flag: false },
  { code: "FEBRE", name: "Febre", is_red_flag: false },
  { code: "TOSSE", name: "Tosse", is_red_flag: false },
  { code: "DOR_ABDOMINAL", name: "Dor abdominal", is_red_flag: false },
  { code: "VOMITO", name: "Vômito", is_red_flag: false },
  { code: "CONFUSAO_MENTAL", name: "Confusão mental", is_red_flag: true },
];

let nextId = 1;

function mockPriority({ symptoms, vital_signs: v }: TriageInput) {
  if ((v.spo2 ?? 100) < 90 || (v.systolic_bp ?? 120) < 90) return 1;
  if (symptoms.some((s) => SYMPTOMS.find((x) => x.code === s)?.is_red_flag)) return 2;
  if ((v.temperature ?? 36.5) >= 39) return 3;
  return symptoms.length > 1 ? 4 : 5;
}

export const mockTriageApi = {
  health: async (): Promise<HealthStatus> => ({ status: "ok", database: "mock" }),
  riskClassifications: async () => CLASSIFICATIONS,
  symptoms: async () => SYMPTOMS,
  createTriage: async (input: TriageInput): Promise<TriageResult> => {
    const classification = CLASSIFICATIONS[mockPriority(input) - 1];
    const confidence = input.symptoms.length === 0 ? 0.55 : 0.82;
    const rest = (1 - confidence) / (CLASSIFICATIONS.length - 1);
    return {
      id: nextId++,
      classification,
      confidence,
      probabilities: Object.fromEntries(
        CLASSIFICATIONS.map((c) => [c.code, c === classification ? confidence : rest]),
      ),
      needs_human_review: confidence < 0.7,
      model: "mock",
      created_at: new Date().toISOString(),
    };
  },
};
