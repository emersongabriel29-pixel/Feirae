import type { DeliveryVehicleType } from "./vehicles";

export type DeliveryPricingInput = {
  vehicleType: DeliveryVehicleType;
  distanceKm: number;
  weightKg: number;
  pickupCount: number;
  peakMultiplier?: number;
};

export type DeliveryQuote = {
  driverPay: number;
  platformFee: number;
  customerFee: number;
  basePay: number;
  distancePay: number;
  weightPay: number;
  extraPickupPay: number;
  peakMultiplier: number;
};

type VehiclePricingRule = {
  basePay: number;
  perKm: number;
  includedKg: number;
  extraKg: number;
  minimumDriverPay: number;
};

export const deliveryPricingRules: Record<DeliveryVehicleType, VehiclePricingRule> = {
  Bicicleta: { basePay: 4.5, perKm: 1.1, includedKg: 5, extraKg: 0.08, minimumDriverPay: 6.5 },
  "Bicicleta cargueira/triciclo": {
    basePay: 6,
    perKm: 1.25,
    includedKg: 15,
    extraKg: 0.08,
    minimumDriverPay: 8,
  },
  Moto: { basePay: 6.5, perKm: 1.5, includedKg: 8, extraKg: 0.12, minimumDriverPay: 9 },
  "Moto com baú": {
    basePay: 7.5,
    perKm: 1.6,
    includedKg: 12,
    extraKg: 0.12,
    minimumDriverPay: 10,
  },
  Carro: { basePay: 10, perKm: 2.1, includedKg: 30, extraKg: 0.18, minimumDriverPay: 14 },
  "Utilitário/Pickup": {
    basePay: 15,
    perKm: 2.6,
    includedKg: 80,
    extraKg: 0.22,
    minimumDriverPay: 20,
  },
  Van: { basePay: 22, perKm: 3.2, includedKg: 150, extraKg: 0.25, minimumDriverPay: 30 },
  Outro: { basePay: 8, perKm: 1.8, includedKg: 10, extraKg: 0.15, minimumDriverPay: 11 },
};

const PLATFORM_PERCENT = 0.12;
const PLATFORM_MINIMUM = 1.5;
const EXTRA_PICKUP_PAY = 1.5;

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateDeliveryQuote(input: DeliveryPricingInput): DeliveryQuote {
  const rule = deliveryPricingRules[input.vehicleType];
  const distanceKm = Math.max(0, input.distanceKm);
  const weightKg = Math.max(0, input.weightKg);
  const pickupCount = Math.max(1, Math.floor(input.pickupCount));
  const peakMultiplier = Math.max(1, input.peakMultiplier ?? 1);

  const basePay = rule.basePay;
  const distancePay = distanceKm * rule.perKm;
  const weightPay = Math.max(0, weightKg - rule.includedKg) * rule.extraKg;
  const extraPickupPay = Math.max(0, pickupCount - 1) * EXTRA_PICKUP_PAY;
  const rawDriverPay = (basePay + distancePay + weightPay + extraPickupPay) * peakMultiplier;
  const driverPay = roundMoney(Math.max(rule.minimumDriverPay, rawDriverPay));
  const platformFee = roundMoney(Math.max(PLATFORM_MINIMUM, driverPay * PLATFORM_PERCENT));
  const customerFee = roundMoney(driverPay + platformFee);

  return {
    driverPay,
    platformFee,
    customerFee,
    basePay: roundMoney(basePay),
    distancePay: roundMoney(distancePay),
    weightPay: roundMoney(weightPay),
    extraPickupPay: roundMoney(extraPickupPay),
    peakMultiplier,
  };
}

export function routeProgressSummary({
  stage,
  pickupDistanceKm,
  pickupEtaMinutes,
  deliveryDistanceKm,
  deliveryEtaMinutes,
}: {
  stage: number;
  pickupDistanceKm: number;
  pickupEtaMinutes: number;
  deliveryDistanceKm: number;
  deliveryEtaMinutes: number;
}) {
  if (stage <= 0) {
    return {
      label: "A caminho da banca",
      distanceKm: pickupDistanceKm,
      etaMinutes: pickupEtaMinutes,
      destination: "pickup" as const,
    };
  }
  if (stage === 1) {
    return {
      label: "Na banca / confirmando coleta",
      distanceKm: 0,
      etaMinutes: 0,
      destination: "pickup" as const,
    };
  }
  if (stage === 2) {
    return {
      label: "Pedido coletado · pronto para iniciar entrega",
      distanceKm: deliveryDistanceKm,
      etaMinutes: deliveryEtaMinutes,
      destination: "dropoff" as const,
    };
  }
  return {
    label: "Em rota para o cliente",
    distanceKm: deliveryDistanceKm,
    etaMinutes: deliveryEtaMinutes,
    destination: "dropoff" as const,
  };
}
