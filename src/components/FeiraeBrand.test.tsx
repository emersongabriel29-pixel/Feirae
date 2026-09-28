import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeiraeBrand } from "./FeiraeBrand";

describe("FeiraeBrand", () => {
  it("renders the canonical Feiraê lockup asset", () => {
    render(<FeiraeBrand priority />);
    expect(screen.getByRole("img", { name: /^feiraê$/i })).toHaveAttribute(
      "src",
      "/brand/feirae-logo-approved.webp",
    );
  });

  it("supports a compact decorative variant for labelled controls", () => {
    render(<FeiraeBrand compact decorative />);
    expect(screen.getByTestId("feirae-brand-lockup")).toHaveClass("is-compact");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(document.querySelector(".feirae-brand-lockup__image")).toHaveAttribute(
      "src",
      "/brand/feirae-logo-approved.webp",
    );
  });
});
