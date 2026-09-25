import { describe, expect, it } from "vitest";
import { formatDateTime, localPeriodKey, localPeriodKeys, sortOrdersNewestFirst } from "./timeline";

describe("timeline", () => {
  it("orders same-day customer orders by their real creation time", () => {
    const ordered = sortOrdersNewestFirst([
      {
        id: "FE-2001",
        date: "25/09/2026",
        createdAt: "2026-09-25T08:10:00-03:00",
        status: "Recebido" as const,
        value: 10,
      },
      {
        id: "FE-2002",
        date: "25/09/2026",
        createdAt: "2026-09-25T11:45:00-03:00",
        status: "Recebido" as const,
        value: 20,
      },
    ]);

    expect(ordered.map((order) => order.id)).toEqual(["FE-2002", "FE-2001"]);
  });

  it("keeps legacy orders sortable without inventing a missing time", () => {
    const ordered = sortOrdersNewestFirst([
      { id: "FE-1027", date: "21/09/2026" },
      { id: "FE-1029", date: "21/09/2026" },
      { id: "FE-1030", date: "25/09/2026" },
    ]);

    expect(ordered.map((order) => order.id)).toEqual(["FE-1030", "FE-1029", "FE-1027"]);
    expect(formatDateTime(undefined, "21/09/2026")).toBe("21/09/2026 · horário não registrado");
  });

  it("derives day month and year from actual timestamps", () => {
    const date = new Date(2026, 8, 25, 10, 30);
    const periods = localPeriodKeys(date);

    expect(periods.day).toBe("2026-09-25");
    expect(periods.month).toBe("2026-09");
    expect(periods.previousMonth).toBe("2026-08");
    expect(periods.year).toBe("2026");
    expect(localPeriodKey("2026-09-25T09:30:00-03:00", "month")).toBe("2026-09");
  });
});
