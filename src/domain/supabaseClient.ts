import type { Role } from "../types";

const URL = (import.meta.env.VITE_SUPABASE_URL || (import.meta.env.PROD ? "https://atnwxxyaxlsnlfulhums.supabase.co" : "")).replace(/\/$/, "");
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || (import.meta.env.PROD ? "sb_publishable_1ACnPoa_atPzF4GEIBsmog_2r_WNzFM" : "");
const SESSION_KEY = "feirae:supabase-auth:v1";
const RECOVERY_KEY = "feirae:password-recovery:v1";

type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> };
};

export type AuthProfile = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

type SupabaseRole = "customer" | "vendor" | "delivery" | "admin" | "fair_manager";

export function isSupabaseConfigured() {
  return Boolean(URL && KEY);
}

function readSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(window.localStorage.getItem(SESSION_KEY) ?? "null") as AuthSession | null;
    return value?.access_token && value?.refresh_token && value?.user?.id ? value : null;
  } catch {
    return null;
  }
}

function storeSession(session: AuthSession) {
  const normalized = {
    ...session,
    expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600),
  };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
  return normalized;
}

function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

function authError(value: unknown, fallback: string) {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const message = record.msg ?? record.message ?? record.error_description ?? record.error;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

async function request(path: string, init: RequestInit = {}, token?: string) {
  const response = await fetch(`${URL}${path}`, {
    ...init,
    headers: {
      apikey: KEY,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) throw new Error(authError(data, `Supabase respondeu HTTP ${response.status}.`));
  return data as Record<string, unknown> | null;
}

async function currentAccessToken() {
  let session = readSession();
  if (!session) return null;
  if ((session.expires_at ?? 0) > Math.floor(Date.now() / 1000) + 60) return session.access_token;
  try {
    const refreshed = await request("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    }) as unknown as AuthSession;
    session = storeSession(refreshed);
    return session.access_token;
  } catch {
    clearSession();
    return null;
  }
}

function appRole(role: SupabaseRole | undefined): Role | null {
  if (role === "customer") return "customer";
  if (role === "vendor") return "feirante";
  if (role === "delivery") return "delivery";
  return null;
}

async function loadProfile(session: AuthSession): Promise<AuthProfile> {
  const rows = await request(
    `/rest/v1/profiles?id=eq.${encodeURIComponent(session.user.id)}&select=id,full_name,role`,
    { method: "GET", headers: { Accept: "application/json" } },
    session.access_token,
  ) as unknown as Array<{ id: string; full_name: string | null; role: SupabaseRole }>;
  const profile = Array.isArray(rows) ? rows[0] : undefined;
  if (!profile) throw new Error("Sua conta foi autenticada, mas o perfil Feiraê ainda não foi criado. Tente entrar novamente.");
  const role = appRole(profile.role);
  if (!role) throw new Error("Este perfil não pode entrar pelo aplicativo. Procure o suporte do Feiraê.");
  return {
    id: profile.id,
    email: session.user.email ?? "",
    name: profile.full_name?.trim() || String(session.user.user_metadata?.full_name ?? session.user.email ?? "Conta Feiraê"),
    role,
  };
}

export async function getCurrentAuthProfile(): Promise<AuthProfile | null> {
  if (!isSupabaseConfigured()) return null;
  const token = await currentAccessToken();
  const session = readSession();
  if (!token || !session) return null;
  try {
    return await loadProfile({ ...session, access_token: token });
  } catch {
    clearSession();
    return null;
  }
}

export async function signInSupabase(email: string, password: string, selectedRole: Role) {
  const result = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLocaleLowerCase("pt-BR"), password }),
  }) as unknown as AuthSession;
  if (!result?.access_token || !result?.user?.id) throw new Error("O Supabase não retornou uma sessão válida.");
  const session = storeSession(result);
  try {
    const profile = await loadProfile(session);
    if (profile.role !== selectedRole) {
      await signOutSupabase();
      const label = profile.role === "customer" ? "Cliente" : profile.role === "feirante" ? "Feirante" : "Entregador";
      throw new Error(`Este e-mail está vinculado ao acesso ${label}. Selecione ${label} para entrar.`);
    }
    return profile;
  } catch (error) {
    if (!(error instanceof Error && error.message.startsWith("Este e-mail está vinculado"))) clearSession();
    throw error;
  }
}

export async function signUpSupabase(input: { role: Role; email: string; name: string; password: string }) {
  const result = await request("/auth/v1/signup", {
    method: "POST",
    body: JSON.stringify({
      email: input.email.trim().toLocaleLowerCase("pt-BR"),
      password: input.password,
      data: { full_name: input.name.trim(), role: input.role },
    }),
  }) as unknown as AuthSession & { session?: AuthSession | null; user?: AuthSession["user"] };
  const session = result?.access_token ? result : result?.session ?? null;
  if (!session?.access_token) {
    return {
      profile: null,
      message: "Conta criada. Confirme seu e-mail pelo link enviado e depois entre no Feiraê.",
    };
  }
  const saved = storeSession(session);
  const profile = await loadProfile(saved);
  if (profile.role !== input.role) {
    await signOutSupabase();
    throw new Error("O perfil foi criado, mas o papel retornado não corresponde à seleção. Procure o suporte.");
  }
  return { profile, message: null };
}

export async function requestPasswordReset(email: string) {
  await request("/auth/v1/recover", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLocaleLowerCase("pt-BR"), redirect_to: window.location.origin }),
  });
}

export function isPasswordRecoveryPending() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(RECOVERY_KEY) === "true";
}

export async function setRecoveredPassword(password: string) {
  const token = await currentAccessToken();
  if (!token || !isPasswordRecoveryPending()) {
    throw new Error("Abra o link de redefinição enviado ao seu e-mail antes de escolher a nova senha.");
  }
  await request("/auth/v1/user", { method: "PUT", body: JSON.stringify({ password }) }, token);
  window.localStorage.removeItem(RECOVERY_KEY);
}

export async function signOutSupabase() {
  const token = await currentAccessToken();
  if (token) {
    try {
      await request("/auth/v1/logout", { method: "POST" }, token);
    } finally {
      clearSession();
    }
  } else {
    clearSession();
  }
}

function consumeRecoveryRedirect() {
  if (typeof window === "undefined" || !window.location.hash) return;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const type = params.get("type");
  if (accessToken && refreshToken && type === "recovery") {
    try {
      const payload = accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const decoded = JSON.parse(window.atob(payload)) as { sub?: string; email?: string };
      if (!decoded.sub) return;
      storeSession({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: Number(params.get("expires_in") ?? 3600),
        user: { id: decoded.sub, email: decoded.email },
      });
      window.localStorage.setItem(RECOVERY_KEY, "true");
      window.localStorage.removeItem("feirae:session");
      window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
    } catch {
      clearSession();
    }
  }
}

consumeRecoveryRedirect();


export async function uploadOnboardingDocument(file: File, documentType: string) {
  if (!isSupabaseConfigured()) throw new Error("O armazenamento seguro ainda não está configurado.");
  if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
    throw new Error("Envie um arquivo JPG, PNG ou PDF.");
  }
  if (file.size > 10 * 1024 * 1024) throw new Error("O arquivo deve ter no máximo 10 MB.");
  const token = await currentAccessToken();
  const session = readSession();
  if (!token || !session) throw new Error("Entre novamente para enviar documentos.");
  const safeName = file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "documento";
  const path = `${session.user.id}/${crypto.randomUUID()}-${safeName}`;
  const response = await fetch(`${URL}/storage/v1/object/onboarding-documents/${path.split("/").map(encodeURIComponent).join("/")}`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": file.type,
      "x-upsert": "false",
    },
    body: file,
  });
  if (!response.ok) {
    let message = "Não foi possível enviar o documento ao armazenamento seguro.";
    try {
      const payload = await response.json() as Record<string, unknown>;
      message = authError(payload, message);
    } catch {
      // Keep the generic message; storage errors may include internal details.
    }
    throw new Error(message);
  }

  try {
    await request("/rest/v1/onboarding_documents", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        profile_id: session.user.id,
        document_type: documentType,
        file_path: path,
        status: "pending",
      }),
    }, token);
  } catch {
    await fetch(`${URL}/storage/v1/object/onboarding-documents/${path.split("/").map(encodeURIComponent).join("/")}`, {
      method: "DELETE",
      headers: { apikey: KEY, Authorization: `Bearer ${token}` },
    }).catch(() => undefined);
    throw new Error("O arquivo foi enviado, mas não conseguimos registrar o documento. Tente novamente.");
  }
  return { path, fileName: file.name };
}
