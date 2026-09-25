import { readUnifiedOrders } from "./orderBridge";
import { scopedStorageKey } from "./storage";

type WalletDebit = {
  id: string;
  orderId: string;
  amount: number;
  createdAt: string;
};

function readDebits(accountKey: string): WalletDebit[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(scopedStorageKey("feirae:wallet-debits", accountKey)) ?? "[]",
    );
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function walletBalance(accountKey: string) {
  const credits = readUnifiedOrders(accountKey)
    .filter((order) => order.paymentStatus === "refunded")
    .reduce((sum, order) => sum + (order.refundAmount ?? 0), 0);
  const debits = readDebits(accountKey).reduce((sum, entry) => sum + entry.amount, 0);
  return Math.max(0, Math.round((credits - debits) * 100) / 100);
}

export function walletHistory(accountKey: string) {
  const credits = readUnifiedOrders(accountKey)
    .filter((order) => order.paymentStatus === "refunded" && (order.refundAmount ?? 0) > 0)
    .map((order) => ({
      id: `refund-${order.id}`,
      orderId: order.id,
      amount: order.refundAmount ?? 0,
      type: "credit" as const,
      label: "Reembolso de pedido cancelado",
      createdAt: order.updatedAt,
    }));
  const debits = readDebits(accountKey).map((entry) => ({
    ...entry,
    type: "debit" as const,
    label: "Crédito usado em compra",
  }));
  return [...credits, ...debits].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function consumeWallet(accountKey: string, orderId: string, amount: number) {
  const available = walletBalance(accountKey);
  const debit = Math.max(0, Math.min(available, amount));
  if (!debit || typeof window === "undefined") return 0;
  const current = readDebits(accountKey);
  if (current.some((entry) => entry.orderId === orderId)) return 0;
  const next = [
    {
      id: `wallet-${orderId}`,
      orderId,
      amount: debit,
      createdAt: new Date().toISOString(),
    },
    ...current,
  ];
  window.localStorage.setItem(scopedStorageKey("feirae:wallet-debits", accountKey), JSON.stringify(next));
  return debit;
}
