import type { DemoSession, Role } from "../types";

export function isRole(value: unknown): value is Role {
  return value === "customer" || value === "feirante" || value === "delivery";
}

export function readSession(value: unknown): DemoSession | null {
  if (isRole(value)) return { role: value, email: "demo@feirae.app", name: "Conta de teste" };
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<DemoSession>;
  if (!isRole(candidate.role) || typeof candidate.email !== "string" || typeof candidate.name !== "string") {
    return null;
  }
  return {
    role: candidate.role,
    email: candidate.email,
    name: candidate.name,
    isNewAccount: Boolean(candidate.isNewAccount),
  };
}

export function nameFromEmail(email: string) {
  const rawName = email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim();
  if (!rawName) return "Conta de teste";
  return rawName.replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase("pt-BR"));
}

export function routeForRole(role: Role) {
  return role === "customer" ? "/cliente/inicio" : role === "feirante" ? "/feirante" : "/entregador";
}
