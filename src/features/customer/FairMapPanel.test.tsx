import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Fair } from "../../types";
import { FEIRAE_DF_MAP_VIEW_URL, FairMapPanel } from "./FairMapPanel";

const fairs: Fair[] = [
  {
    name: "Feira do Produtor Rural",
    place: "Planaltina",
    address: "Via N/S, Setor Educacional, Planaltina - DF",
    status: "Horário a confirmar",
    source: "official",
  },
  {
    name: "Feira Permanente do Gama",
    place: "Gama",
    address: "Área Especial, Quadra 01, Setor Norte, Gama - DF",
    status: "Horário a confirmar",
    source: "official",
  },
];

describe("FairMapPanel", () => {
  it("renderiza os pontos do mapa dentro do Feiraê sem iframe externo", () => {
    render(
      <FairMapPanel
        fairItems={fairs}
        userCoords={null}
        onRequestLocation={vi.fn()}
        onFair={vi.fn()}
        onRoute={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Mapa nativo das feiras do Distrito Federal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /selecionar feira do produtor rural/i })).toBeInTheDocument();
    expect(screen.queryByTitle("Mapa das feiras do Distrito Federal")).not.toBeInTheDocument();
  });

  it("abre a feira selecionada a partir do ponto do mapa", () => {
    const onFair = vi.fn();

    render(
      <FairMapPanel
        fairItems={fairs}
        userCoords={null}
        onRequestLocation={vi.fn()}
        onFair={onFair}
        onRoute={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /selecionar feira permanente do gama/i }));

    expect(onFair).toHaveBeenCalledWith("Feira Permanente do Gama");
  });

  it("mostra a feira mais próxima quando a localização do cliente está disponível", () => {
    render(
      <FairMapPanel
        fairItems={fairs}
        userCoords={{ lat: -15.62, lng: -47.65 }}
        onRequestLocation={vi.fn()}
        onFair={vi.fn()}
        onRoute={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /mais próxima: planaltina/i })).toBeInTheDocument();
    expect(screen.getByText(/km de você/i)).toBeInTheDocument();
  });

  it("mantém o mapa público apenas como referência externa opcional", () => {
    render(
      <FairMapPanel
        fairItems={fairs}
        userCoords={null}
        onRequestLocation={vi.fn()}
        onFair={vi.fn()}
        onRoute={vi.fn()}
      />,
    );

    const link = screen.getByRole("link", { name: /mapa público de referência/i });
    expect(link).toHaveAttribute("href", FEIRAE_DF_MAP_VIEW_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });
});
