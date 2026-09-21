export type Role = "customer" | "feirante" | "delivery";

export type DemoSession = {
  role: Role;
  email: string;
  name: string;
};

export type CustomerTab = "home" | "fairs" | "products" | "orders" | "profile";

export type Screen =
  | "main"
  | "fair"
  | "feirante"
  | "tracking"
  | "checkout"
  | "favorites"
  | "notifications"
  | "addresses"
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
  stock: number;
  unit: string;
  featured?: boolean;
};

export type Fair = {
  name: string;
  place: string;
  status: string;
  feirantes: number;
  lat: number;
  lng: number;
};

export type DemoOrder = {
  id: string;
  date: string;
  status: "Recebido" | "Preparando" | "Coleta" | "Em rota" | "Entregue" | "Cancelado";
  value: number;
};

export type Address = {
  id: number;
  label: string;
  details: string;
  isDefault: boolean;
};
