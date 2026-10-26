// Contrato da API de triagem (FastAPI). Espelha os esquemas Pydantic do
// microsserviço; ao mudar um campo lá, ajuste aqui.

export type Sex = "M" | "F";

export type RiskClassification = {
  code: string;
  name: string;
  /** 1 = vermelho (mais urgente) ... 5 = azul */
  priority: number;
  max_wait_minutes: number;
  description: string;
};

export type Symptom = {
  code: string;
  name: string;
  is_red_flag: boolean;
};

export type VitalSigns = {
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  temperature?: number;
  spo2?: number;
};

export type TriageInput = {
  age: number;
  sex: Sex;
  chief_complaint: string;
  symptoms: string[];
  vital_signs: VitalSigns;
};

export type TriageResult = {
  id: number;
  classification: RiskClassification;
  confidence: number;
  /** probabilidade por código de classificação */
  probabilities: Record<string, number>;
  needs_human_review: boolean;
  model: string;
  created_at: string;
};

export type HealthStatus = {
  status: string;
  database: string;
};
