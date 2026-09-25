import { describe, expect, it } from "vitest";
import {
  defaultWeeklyAvailability,
  driverAvailabilityStatus,
  isWithinWeeklyAvailability,
} from "./driverAvailability";

describe("driver availability", () => {
  it("supports manual online and offline states", () => {
    const online = driverAvailabilityStatus({
      approved: true,
      mode: "manual",
      manualOnline: true,
      schedulePaused: false,
      schedule: defaultWeeklyAvailability,
      now: new Date(2026, 8, 24, 10, 0),
    });
    const offline = driverAvailabilityStatus({
      approved: true,
      mode: "manual",
      manualOnline: false,
      schedulePaused: false,
      schedule: defaultWeeklyAvailability,
      now: new Date(2026, 8, 24, 10, 0),
    });

    expect(online.online).toBe(true);
    expect(offline.online).toBe(false);
  });

  it("turns availability on only inside the configured schedule", () => {
    const inside = driverAvailabilityStatus({
      approved: true,
      mode: "schedule",
      manualOnline: false,
      schedulePaused: false,
      schedule: defaultWeeklyAvailability,
      now: new Date(2026, 8, 24, 10, 0),
    });
    const outside = driverAvailabilityStatus({
      approved: true,
      mode: "schedule",
      manualOnline: false,
      schedulePaused: false,
      schedule: defaultWeeklyAvailability,
      now: new Date(2026, 8, 24, 22, 0),
    });

    expect(inside.online).toBe(true);
    expect(inside.label).toMatch(/horário/i);
    expect(outside.online).toBe(false);
    expect(outside.label).toMatch(/fora do horário/i);
  });

  it("allows pausing an automatic schedule without deleting it", () => {
    const paused = driverAvailabilityStatus({
      approved: true,
      mode: "schedule",
      manualOnline: true,
      schedulePaused: true,
      schedule: defaultWeeklyAvailability,
      now: new Date(2026, 8, 24, 10, 0),
    });

    expect(paused.online).toBe(false);
    expect(paused.label).toBe("Pausado");
  });

  it("supports overnight windows that end on the following day", () => {
    const overnight = defaultWeeklyAvailability.map((day) =>
      day.weekday === 4
        ? { ...day, enabled: true, start: "19:00", end: "02:00" }
        : { ...day, enabled: false },
    );

    expect(isWithinWeeklyAvailability(new Date(2026, 8, 24, 23, 30), overnight)).toBe(true);
    expect(isWithinWeeklyAvailability(new Date(2026, 8, 25, 1, 30), overnight)).toBe(true);
    expect(isWithinWeeklyAvailability(new Date(2026, 8, 25, 3, 0), overnight)).toBe(false);
  });

  it("never releases races for an unapproved account", () => {
    const status = driverAvailabilityStatus({
      approved: false,
      mode: "manual",
      manualOnline: true,
      schedulePaused: false,
      schedule: defaultWeeklyAvailability,
      now: new Date(2026, 8, 24, 10, 0),
    });

    expect(status.online).toBe(false);
    expect(status.label).toMatch(/não aprovado/i);
  });
});
