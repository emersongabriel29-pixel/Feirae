import type { Role } from "../types";
import { nameFromEmail } from "./session";

type LocalAccount = {
  email: string;
  role: Role;
  name: string;
  passwordDigest: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "feirae:local-auth:v1";

function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

// Verificador local do protótipo. Produção deve usar o provedor de autenticação.
function digestPassword(value: string) {
  let hash = 2166136261;
  const input = "feirae-local-auth:" + value;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function readAccounts(): LocalAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: LocalAccount[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function authenticateLocalAccount(input: {
  role: Role;
  email: string;
  name: string;
  password: string;
  signup: boolean;
}) {
  const email = normalizeEmail(input.email);
  const password = input.password;
  if (!email || !email.includes("@")) return { ok: false as const, message: "Informe um e-mail válido." };
  if (password.length < 6)
    return { ok: false as const, message: "A senha precisa ter pelo menos 6 caracteres." };

  const accounts = readAccounts();
  const existing = accounts.find((account) => normalizeEmail(account.email) === email);

  if (input.signup) {
    if (!input.name.trim()) return { ok: false as const, message: "Informe seu nome completo." };
    if (existing) return { ok: false as const, message: "Já existe uma conta local com este e-mail." };
    const now = new Date().toISOString();
    const account: LocalAccount = {
      email,
      role: input.role,
      name: input.name.trim(),
      passwordDigest: digestPassword(password),
      createdAt: now,
      updatedAt: now,
    };
    writeAccounts([account, ...accounts]);
    return { ok: true as const, account, isNewAccount: true };
  }

  if (existing) {
    if (existing.role !== input.role) {
      return { ok: false as const, message: "Esta conta está cadastrada em outro tipo de acesso." };
    }
    if (existing.passwordDigest !== digestPassword(password)) {
      return { ok: false as const, message: "E-mail ou senha incorretos." };
    }
    return { ok: true as const, account: existing, isNewAccount: false };
  }

  if (email.endsWith("@feirae.test")) {
    if (password !== "123456") {
      return { ok: false as const, message: "E-mail ou senha incorretos." };
    }
    const account: LocalAccount = {
      email,
      role: input.role,
      name: nameFromEmail(email),
      passwordDigest: digestPassword(password),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { ok: true as const, account, isNewAccount: false };
  }

  return { ok: false as const, message: "Conta não encontrada. Use Criar conta primeiro." };
}

function migrateScopedStorage(oldEmail: string, newEmail: string) {
  if (typeof window === "undefined" || oldEmail === newEmail) return;
  const suffix = ":" + oldEmail;
  const replacements: Array<[string, string]> = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.endsWith(suffix)) continue;
    const value = window.localStorage.getItem(key);
    if (value === null) continue;
    replacements.push([key, key.slice(0, -suffix.length) + ":" + newEmail]);
  }
  for (const [oldKey, newKey] of replacements) {
    const value = window.localStorage.getItem(oldKey);
    if (value !== null && window.localStorage.getItem(newKey) === null) {
      window.localStorage.setItem(newKey, value);
    }
    window.localStorage.removeItem(oldKey);
  }
}

export function updateLocalAccount(input: {
  oldEmail: string;
  role: Role;
  name: string;
  email: string;
  newPassword?: string;
}) {
  const oldEmail = normalizeEmail(input.oldEmail);
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  if (!name) return { ok: false as const, message: "Informe seu nome." };
  if (!email || !email.includes("@")) return { ok: false as const, message: "Informe um e-mail válido." };
  if (input.newPassword && input.newPassword.length < 6) {
    return { ok: false as const, message: "A nova senha precisa ter pelo menos 6 caracteres." };
  }

  const accounts = readAccounts();
  const conflict = accounts.find(
    (account) => normalizeEmail(account.email) === email && normalizeEmail(account.email) !== oldEmail,
  );
  if (conflict) return { ok: false as const, message: "Este e-mail já está em uso." };

  const previous = accounts.find((account) => normalizeEmail(account.email) === oldEmail);
  const now = new Date().toISOString();
  const next: LocalAccount = {
    email,
    role: input.role,
    name,
    passwordDigest: input.newPassword
      ? digestPassword(input.newPassword)
      : (previous?.passwordDigest ?? digestPassword(oldEmail.endsWith("@feirae.test") ? "123456" : "123456")),
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };
  writeAccounts([next, ...accounts.filter((account) => normalizeEmail(account.email) !== oldEmail)]);
  migrateScopedStorage(oldEmail, email);
  return { ok: true as const, account: next, oldEmail };
}

export function scrubLegacyPlaintextPasswords() {
  if (typeof window === "undefined") return;
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith("feirae:account:")) continue;
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) ?? "{}") as Record<string, unknown>;
      if (!Object.prototype.hasOwnProperty.call(parsed, "password")) continue;
      delete parsed.password;
      window.localStorage.setItem(key, JSON.stringify(parsed));
    } catch {
      // Mantém dados legados inválidos isolados sem bloquear a aplicação.
    }
  }
}
