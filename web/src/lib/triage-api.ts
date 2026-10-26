import "server-only";

import { connection } from "next/server";
import { mockTriageApi } from "./triage-api.mock";
import type {
  HealthStatus,
  RiskClassification,
  Symptom,
  TriageInput,
  TriageResult,
} from "./triage-types";

// Cliente do microsserviço de triagem. Só roda no servidor: o navegador
// fala com as rotas /api do Next (BFF), nunca direto com a FastAPI.

export class TriageApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly detail?: unknown,
  ) {
    super(message);
  }
}

const TIMEOUT_MS = 15_000;

function baseUrl() {
  const url = process.env.TRIAGE_API_URL;
  if (!url) {
    throw new TriageApiError(503, "TRIAGE_API_URL não configurada.");
  }
  return url.replace(/\/$/, "");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof TriageApiError) throw err;
    throw new TriageApiError(503, "API de triagem indisponível.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new TriageApiError(res.status, messageFor(res.status), body?.detail);
  }
  return res.json() as Promise<T>;
}

function messageFor(status: number) {
  switch (status) {
    case 422:
      return "Dados da triagem inválidos ou sintoma inexistente.";
    case 502:
      return "O modelo recusou a classificação.";
    case 503:
      return "Modelo sem resposta ou catálogo de classificações vazio.";
    default:
      return `Erro inesperado da API de triagem (${status}).`;
  }
}

/**
 * Lido a cada requisição: sem o connection(), o build pré-renderizaria o
 * modo (e os dados simulados) que estivesse no .env da máquina de build.
 */
export async function isMockMode() {
  await connection();
  return process.env.TRIAGE_API_MOCK === "true";
}

const realTriageApi = {
  health: () => request<HealthStatus>("/health"),
  riskClassifications: () =>
    request<RiskClassification[]>("/risk-classifications"),
  symptoms: () => request<Symptom[]>("/symptoms"),
  createTriage: (input: TriageInput) =>
    request<TriageResult>("/triages", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};

type TriageApi = typeof realTriageApi;

async function api(): Promise<TriageApi> {
  return (await isMockMode()) ? mockTriageApi : realTriageApi;
}

export const triageApi: TriageApi = {
  health: async () => (await api()).health(),
  riskClassifications: async () => (await api()).riskClassifications(),
  symptoms: async () => (await api()).symptoms(),
  createTriage: async (input) => (await api()).createTriage(input),
};
