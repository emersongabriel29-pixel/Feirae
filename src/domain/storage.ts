export function currentAccountKey() {
  if (typeof window === "undefined") return "guest";
  try {
    const raw = window.localStorage.getItem("feirae:session");
    if (!raw) return "guest";
    const parsed = JSON.parse(raw) as { email?: unknown };
    return typeof parsed.email === "string" && parsed.email.trim()
      ? parsed.email.trim().toLocaleLowerCase("pt-BR")
      : "guest";
  } catch {
    return "guest";
  }
}

export function scopedStorageKey(base: string, accountKey = currentAccountKey()) {
  return `${base}:${accountKey}`;
}
