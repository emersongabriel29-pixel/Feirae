export const vehicleCapacityDefaults = {
  Bicicleta: 10,
  "Bicicleta cargueira/triciclo": 40,
  Moto: 12,
  "Moto com baú": 20,
  Carro: 80,
  "Utilitário/Pickup": 250,
  Van: 500,
  Outro: 10,
} as const;

export type DeliveryVehicleType = keyof typeof vehicleCapacityDefaults;

export type DeliveryVehicle = {
  id: string;
  type: DeliveryVehicleType;
  capacityKg: number;
  brandModel: string;
  plate: string;
  active: boolean;
};

export const vehicleTypeOptions = Object.keys(vehicleCapacityDefaults) as DeliveryVehicleType[];

export function suggestedCapacityForVehicle(type: DeliveryVehicleType) {
  return vehicleCapacityDefaults[type];
}

export function requiresPlate(type: DeliveryVehicleType) {
  return !["Bicicleta", "Bicicleta cargueira/triciclo", "Outro"].includes(type);
}
