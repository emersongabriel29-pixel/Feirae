import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Fair } from "../../types";
import { sortFairsByProximity } from "../../domain/fairMap";
import { FairMapPanel } from "./FairMapPanel";

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
  it("usa um mapa viário real do OpenStreetMap por baixo dos pontos do Feiraê", () => {
    render(
      <FairMapPanel
        fairItems={fairs}
        userCoords={null}
        onRequestLocation={vi.fn()}
        onFair={vi.fn()}
        onRoute={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Mapa das feiras do Distrito Federal")).toBeInTheDocument();
    expect(screen.getByTitle("Mapa OpenStreetMap das feiras do Distrito Federal")).toHaveAttribute(
      "src",
      expect.stringContaining("openstreetmap.org/export/embed.html"),
    );
    const feiraMarker = screen.getByRole("button", { name: /selecionar feira do produtor rural/i });
    expect(feiraMarker).toBeInTheDocument();
    expect(feiraMarker.querySelector(".lucide-store")).not.toBeNull();
  });

  it("seleciona o ponto antes de abrir explicitamente a feira", () => {
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
    expect(onFair).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /abrir feira/i }));
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

  it("prioriza Planaltina e depois ordena as demais feiras por distância quando a região é Planaltina", () => {
    const sorted = sortFairsByProximity(fairs, null, "Planaltina, DF");

    expect(sorted[0].place).toBe("Planaltina");
    expect(sorted[0].distance).not.toBeNull();
    expect(sorted[1].place).toBe("Gama");
    expect(sorted[0].distance as number).toBeLessThan(sorted[1].distance as number);
  });

  it("envia o endereço da feira selecionada para a rota interna", () => {
    const onRoute = vi.fn();

    render(
      <FairMapPanel
        fairItems={fairs}
        userCoords={null}
        onRequestLocation={vi.fn()}
        onFair={vi.fn()}
        onRoute={onRoute}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /selecionar feira permanente do gama/i }));
    fireEvent.click(screen.getByRole("button", { name: /rota no feiraê/i }));

    expect(onRoute).toHaveBeenCalledWith("Área Especial, Quadra 01, Setor Norte, Gama - DF");
  });
});
