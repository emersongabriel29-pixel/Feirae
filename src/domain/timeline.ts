import type { DemoOrder } from "../types";

function parseLegacyBrazilianDate(value: string) {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return Number.NaN;
  const [, day, month, year] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0).getTime();
}

export function timestampFromIso(value?: string | null) {
  if (!value) return Number.NaN;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : Number.NaN;
}

export function orderTimestamp(order: Pick<DemoOrder, "createdAt" | "date">) {
  const createdAt = timestampFromIso(order.createdAt);
  if (Number.isFinite(createdAt)) return createdAt;
  return parseLegacyBrazilianDate(order.date);
}

function numericId(value: string) {
  const match = value.match(/(\d+)(?!.*\d)/);
  return match ? Number(match[1]) : 0;
}

export function sortOrdersNewestFirst<T extends Pick<DemoOrder, "id" | "createdAt" | "date">>(
  orders: T[],
) {
  return [...orders].sort((a, b) => {
    const timeA = orderTimestamp(a);
    const timeB = orderTimestamp(b);

    if (Number.isFinite(timeA) && Number.isFinite(timeB) && timeA !== timeB) return timeB - timeA;
    if (Number.isFinite(timeB) && !Number.isFinite(timeA)) return 1;
    if (Number.isFinite(timeA) && !Number.isFinite(timeB)) return -1;

    return numericId(b.id) - numericId(a.id);
  });
}

export function sortByCreatedAtNewestFirst<T extends { createdAt?: string | null }>(items: T[]) {
  return [...items].sort((a, b) => {
    const timeA = timestampFromIso(a.createdAt);
    const timeB = timestampFromIso(b.createdAt);
    if (Number.isFinite(timeA) && Number.isFinite(timeB)) return timeB - timeA;
    if (Number.isFinite(timeB)) return 1;
    if (Number.isFinite(timeA)) return -1;
    return 0;
  });
}

export function sortByIsoDateNewestFirst<T>(items: T[], getDate: (item: T) => string) {
  return [...items].sort((a, b) => {
    const timeA = timestampFromIso(getDate(a));
    const timeB = timestampFromIso(getDate(b));
    if (Number.isFinite(timeA) && Number.isFinite(timeB)) return timeB - timeA;
    if (Number.isFinite(timeB)) return 1;
    if (Number.isFinite(timeA)) return -1;
    return 0;
  });
}

export function formatDateTime(value?: string | null, fallbackDate?: string) {
  const timestamp = timestampFromIso(value);
  if (!Number.isFinite(timestamp)) {
    return fallbackDate ? `${fallbackDate} · horário não registrado` : "Horário não registrado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function dateLabelFromIso(value: string) {
  const timestamp = timestampFromIso(value);
  if (!Number.isFinite(timestamp)) return "";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(timestamp));
}
