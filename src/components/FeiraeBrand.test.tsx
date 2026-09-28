import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeiraeBrand } from "./FeiraeBrand";

describe("FeiraeBrand", () => {
  it("renders the canonical Feiraê lockup asset", () => {
    render(<FeiraeBrand priority />);
    expect(screen.getByRole("img", { name: /^feiraê$/i })).toHaveAttribute(
      "src",
      "/brand/feirae-logo-horizontal.svg",
    );
  });

  it("uses the compact variant without changing the brand asset", () => {
    render(<FeiraeBrand compact />);
    expect(screen.getByTestId("feirae-brand-lockup")).toHaveClass("is-compact");
    expect(screen.getByRole("img")).toHaveAttribute("src", "/brand/feirae-logo-horizontal.svg");
  });
});
