import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FEIRAE_SPLASH_LAST_FULL_DAY_KEY, LaunchExperience } from "./LaunchExperience";

describe("LaunchExperience", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-27T10:00:00"));
    window.localStorage.clear();
    window.localStorage.setItem("feirae:sound-enabled", "false");

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the full launch on the first opening of the day", () => {
    render(
      <LaunchExperience>
        <div>Aplicativo Feiraê</div>
      </LaunchExperience>,
    );

    const splash = screen.getByRole("status", { name: "Feiraê carregando" });
    expect(splash).toHaveAttribute("data-variant", "full");
    expect(window.localStorage.getItem(FEIRAE_SPLASH_LAST_FULL_DAY_KEY)).toBe("2026-09-27");

    act(() => {
      vi.advanceTimersByTime(3100);
    });

    expect(screen.queryByRole("status", { name: "Feiraê carregando" })).not.toBeInTheDocument();
    expect(screen.getByText("Aplicativo Feiraê")).toBeVisible();
  });

  it("uses the quick launch when the full animation already ran that day", () => {
    window.localStorage.setItem(FEIRAE_SPLASH_LAST_FULL_DAY_KEY, "2026-09-27");

    render(
      <LaunchExperience>
        <div>Aplicativo Feiraê</div>
      </LaunchExperience>,
    );

    expect(screen.getByRole("status", { name: "Feiraê carregando" })).toHaveAttribute(
      "data-variant",
      "quick",
    );

    act(() => {
      vi.advanceTimersByTime(1450);
    });

    expect(screen.queryByRole("status", { name: "Feiraê carregando" })).not.toBeInTheDocument();
  });

  it("uses the static reduced-motion fallback when requested by the device", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(
      <LaunchExperience>
        <div>Aplicativo Feiraê</div>
      </LaunchExperience>,
    );

    expect(screen.getByRole("status", { name: "Feiraê carregando" })).toHaveAttribute(
      "data-variant",
      "reduced",
    );
  });
});
