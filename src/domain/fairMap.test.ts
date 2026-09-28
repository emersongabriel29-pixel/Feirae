import { describe, expect, it } from "vitest";
import type { Fair } from "../types";
import {
  fairMapCoordinate,
  fairMapPoints,
  nearestFairPoint,
  projectDfCoordinate,
} from "./fairMap";

const planaltinaFair: Fair = {
  name: "Feira do Produtor Rural",
  place: "Planaltina",
  status: "Horário a confirmar",
};

describe("fairMap", () => {
  it("prioriza coordenadas exatas cadastradas na feira", () => {
    const coordinate = fairMapCoordinate({
      ...planaltinaFair,
      lat: -15.62,
      lng: -47.65,
    });

    expect(coordinate).toEqual({
      lat: -15.62,
      lng: -47.65,
      precision: "exact",
    });
  });

  it("usa uma referência regional quando a feira ainda não tem coordenada própria", () => {
    const coordinate = fairMapCoordinate(planaltinaFair);

    expect(coordinate).not.toBeNull();
    expect(coordinate?.precision).toBe("region");
    expect(coordinate?.lat).toBeLessThan(-15.5);
    expect(coordinate?.lng).toBeGreaterThan(-47.8);
  });

  it("mantém os pontos projetados dentro do mapa nativo", () => {
    const point = projectDfCoordinate({ lat: -15.8, lng: -47.9 });

    expect(point.x).toBeGreaterThanOrEqual(2);
    expect(point.x).toBeLessThanOrEqual(98);
    expect(point.y).toBeGreaterThanOrEqual(3);
    expect(point.y).toBeLessThanOrEqual(97);
  });

  it("calcula a feira mais próxima entre os pontos disponíveis", () => {
    const items: Fair[] = [
      planaltinaFair,
      {
        name: "Feira Permanente do Gama",
        place: "Gama",
        status: "Horário a confirmar",
      },
    ];

    const nearest = nearestFairPoint(items, { lat: -15.62, lng: -47.65 });

    expect(nearest?.fair.name).toBe("Feira do Produtor Rural");
    expect(nearest?.distanceKm).toBeLessThan(3);
    expect(fairMapPoints(items)).toHaveLength(2);
  });
});
