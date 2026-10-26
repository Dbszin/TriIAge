import type { Metadata } from "next";
import { PlannedModule } from "@/components/planned-module";

export const metadata: Metadata = { title: "Orientações de alta" };

export default function DischargePage() {
  return (
    <PlannedModule
      title="Orientações de alta"
      summary="Registro da conduta médica e geração da versão acessível das orientações para o paciente."
      items={[
        "Conduta organizada em medicação, cuidados e retorno.",
        "Versão em linguagem simples gerada a partir do texto técnico.",
        "Sinais de alerta de retorno extraídos e destacados.",
        "Revisão e aprovação do médico antes da entrega, em tela ou impressa.",
      ]}
      references="RF10, RF12 · UC11, UC12 · RNF09"
      blocker="Depende de endpoints na API para conduta e orientações (tabela de orientações de alta)."
    />
  );
}
