import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  FEIRAE_DF_MAP_EMBED_URL,
  FEIRAE_DF_MAP_VIEW_URL,
  FairMapPanel,
} from "./FairMapPanel";

describe("FairMapPanel", () => {
  it("carrega o Google My Maps somente depois da ação do usuário", () => {
    render(<FairMapPanel />);

    expect(screen.queryByTitle("Mapa das feiras do Distrito Federal")).not.toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: /abrir mapa interativo/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);

    const frame = screen.getByTitle("Mapa das feiras do Distrito Federal");
    expect(frame).toHaveAttribute("src", FEIRAE_DF_MAP_EMBED_URL);
    expect(frame).toHaveAttribute("loading", "lazy");
    expect(screen.getByRole("button", { name: /ocultar mapa/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("oferece acesso ao mapa completo em nova aba", () => {
    render(<FairMapPanel />);

    const link = screen.getByRole("link", { name: /abrir mapa completo/i });
    expect(link).toHaveAttribute("href", FEIRAE_DF_MAP_VIEW_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});
