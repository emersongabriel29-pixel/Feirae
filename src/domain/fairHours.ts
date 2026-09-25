export type FairHoursInfo = {
  label: string;
  verification: string;
  status: "confirmed" | "revalidate" | "pending";
};

export const fairHoursByName: Record<string, FairHoursInfo> = {
  "Feira do Produtor Rural": {
    label: "Segunda e quinta · 19h–2h",
    verification: "Confirmado em OS 58/2026",
    status: "confirmed",
  },
  "Feira de Planaltina - Confecções e Utilidades": {
    label: "Ter–Sex 7h–18h30 · Sáb 7h–19h · Dom 7h–18h",
    verification: "Confirmado em OS 58/2026",
    status: "confirmed",
  },
  "Feira de Hortifrutigranjeiros": {
    label: "Ter–Sex 7h–18h30 · Sáb 7h–19h · Dom 7h–18h",
    verification: "Confirmado em OS 58/2026",
    status: "confirmed",
  },
  "Feira Permanente do Gama": {
    label: "Ter–Dom 7h–18h",
    verification: "Confirmado em OS 115/2024",
    status: "confirmed",
  },
  "Shopping Popular do Gama": {
    label: "Ter–Sáb 9h–18h · Dom 9h–15h",
    verification: "Confirmado em OS 115/2024",
    status: "confirmed",
  },
  "Feira Central de Brazlândia": {
    label: "Ter–Dom 7h–18h",
    verification: "Confirmado em regimento de 20/05/2026",
    status: "confirmed",
  },
  "Feira Permanente do Guará": {
    label: "Qua–Dom 7h–18h",
    verification: "Confirmado em OS 165/2025",
    status: "confirmed",
  },
  "Feira Permanente do Cruzeiro": {
    label: "Ter–Dom 8h–18h",
    verification: "Fonte oficial de 2022 · revalidar",
    status: "revalidate",
  },
  "Feira Permanente de São Sebastião": {
    label: "Regra geral Ter–Dom 8h–17h",
    verification: "Fonte oficial de 2021 · revalidar",
    status: "revalidate",
  },
  "Feira Permanente de Santa Maria": {
    label: "Ter–Dom 8h–18h",
    verification: "Fonte oficial de 2021 · revalidar",
    status: "revalidate",
  },
  "Feira do Riacho Fundo I": {
    label: "Qua–Dom 7h–17h",
    verification: "Fonte oficial de 2019 · revalidar",
    status: "revalidate",
  },
  "Feira Permanente da QN 210": {
    label: "Ter–Dom 8h–18h",
    verification: "Fonte oficial de 2011 · revalidar",
    status: "revalidate",
  },
  "Feira Permanente do Paranoá": {
    label: "Ter–Dom 8h–18h",
    verification: "Fonte oficial de 2000 · revalidar",
    status: "revalidate",
  },
};

export function fairHoursForName(name: string): FairHoursInfo {
  return (
    fairHoursByName[name] ?? {
      label: "Horário a confirmar",
      verification: "Sem fonte específica validada para uso no aplicativo",
      status: "pending",
    }
  );
}
