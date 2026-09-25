import type { Fair } from "../types";

export function isFairActive(fair: Fair) {
  return fair.active !== false;
}

export function visibleCustomerFairs(items: Fair[]) {
  return items.filter((fair) => isFairActive(fair) && fair.source !== "demo");
}
