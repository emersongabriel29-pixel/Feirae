export type Role = "customer" | "feirante" | "delivery";

export type DemoSession = {
  role: Role;
  email: string;
  name: string;
  isNewAccount?: boolean;
};

export type CustomerTab = "home" | "fairs" | "products" | "orders" | "profile";

export type Screen =
  | "main"
  | "fair"
  | "feirante"
  | "tracking"
  | "checkout"
  | "vendors"
  | "favorites"
  | "notifications"
  | "addresses"
  | "account"
  | "payments"
  | "ratings"
  | "chat"
  | "settings"
  | "feiranteOps"
  | "deliveryOps";

export type Product = {
  id: number;
  name: string;
  feirante: string;
  fair: string;
  price: number;
  category: string;
  emoji: string;
  imageDataUrl?: string;
  stock: number;
  unit: string;
  weightKg: number;
  minQuantity?: number;
  volume: "leve" | "medio" | "pesado";
  featured?: boolean;
  vendorId?: string;
  storeId?: string;
  active?: boolean;
};

export type VendorMetrics = {
  rating: number;
  reviewCount: number;
  deliveryMinutes: [number, number];
  deliveryFee: number;
};

export type Fair = {
  name: string;
  place: string;
  address?: string;
  status: string;
  source?: "official" | "demo";
  feirantes?: number;
  rating?: number;
  reviewCount?: number;
  deliveryMinutes?: [number, number];
  deliveryFee?: number;
  lat?: number;
  lng?: number;
};

export type DemoOrder = {
  id: string;
  date: string;
  status: "Recebido" | "Preparando" | "Coleta" | "Em rota" | "Entregue" | "Cancelado";
  value: number;
  fairName?: string;
  createdAt?: string;
  fulfillment?: "delivery" | "pickup";
  paymentMethod?: string;
  cancelReason?: string;
  cancelDetails?: string;
  driver?: {
    name: string;
    vehicle: string;
    plateMasked?: string;
    etaMinutes?: number;
    distanceKm?: number;
  };
  events?: Array<{
    key: string;
    label: string;
    at: string;
  }>;
};

export type Address = {
  id: number;
  label: string;
  details: string;
  isDefault: boolean;
  cep?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  number?: string;
  complement?: string;
  reference?: string;
  lat?: number;
  lng?: number;
  source?: "manual" | "gps";
};
