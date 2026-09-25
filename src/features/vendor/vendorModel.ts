export type VendorProduct = {
  id: number;
  name: string;
  category: string;
  description: string;
  stock: number;
  minStock: number;
  active: boolean;
  price: number;
  saleUnit: string;
  packageSize: string;
  weightKg: number;
  photoDataUrl: string;
  photoName: string;
};

export type VendorOrderStatus =
  "new" | "preparing" | "ready_for_pickup" | "collected" | "delivered" | "rejected";

export type VendorOrderItem = {
  id: string;
  name: string;
  quantityLabel: string;
  estimatedWeightKg: number;
  actualWeightKg: number;
  separated: boolean;
  unavailable: boolean;
  note: string;
};

export type VendorOrder = {
  id: string;
  customer: string;
  createdAt: string;
  status: VendorOrderStatus;
  value: number;
  deliveryFee: number;
  city: string;
  estimatedPickupMinutes: number;
  items: VendorOrderItem[];
  rejectReason: string;
  driverName: string;
};

export type VendorBankProfile = {
  name: string;
  description: string;
  fairName: string;
  box: string;
  corridor: string;
  reference: string;
  categories: string;
  phone: string;
  whatsapp: string;
  logoDataUrl: string;
  coverDataUrl: string;
};

export type VendorScheduleDay = {
  day: string;
  enabled: boolean;
  open: string;
  close: string;
  breakStart: string;
  breakEnd: string;
};

export type VendorPromotionType = "combo" | "horario" | "cupom" | "freteGratis";

export type VendorPromotion = {
  id: string;
  type: VendorPromotionType;
  name: string;
  rule: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
  vendorPaysDelivery: boolean;
  usageLimit: number;
  usedCount: number;
};

export type VendorReview = {
  id: string;
  type: "Cliente" | "Produto" | "Entrega";
  author: string;
  orderId: string;
  date: string;
  rating: number;
  comment: string;
  response: string;
};

export type VendorDocumentStatus = "pending" | "under_review" | "approved" | "correction_required";

export type VendorDocument = {
  id: string;
  name: string;
  description: string;
  required: boolean;
  status: VendorDocumentStatus;
  fileName: string;
  expiresAt: string;
  correctionReason: string;
};

export type VendorSaleRecord = {
  id: string;
  date: string;
  total: number;
  discount: number;
  deliverySubsidy: number;
  refund: number;
  items: Array<{ name: string; quantity: number }>;
};


export const productCategories = [
  "Frutas",
  "Verduras e legumes",
  "Folhas e ervas",
  "Cereais e grãos",
  "Ovos",
  "Carnes e aves",
  "Pescados e frutos do mar",
  "Laticínios",
  "Doces e produtos caseiros",
  "Pães e panificados",
  "Refeições e lanches",
  "Bebidas",
  "Flores",
  "Plantas",
  "Artesanato",
  "Confecções",
  "Calçados",
  "Bolsas e acessórios",
  "Bijuterias",
  "Ferramentas",
  "Utensílios domésticos",
  "Eletrônicos",
  "Bazar e papelaria",
  "Tecidos e armarinho",
  "Produtos agropecuários",
  "Outros",
] as const;

export const productSaleUnits = [
  "kg",
  "g",
  "un",
  "dúzia",
  "par",
  "maço",
  "bandeja",
  "pacote",
  "saco",
  "caixa",
  "cesta",
  "kit",
  "porção",
  "L",
  "ml",
  "m",
  "vaso",
] as const;

export const initialVendorProducts: VendorProduct[] = [
  {
    id: 1,
    name: "Cesta de frutas",
    category: "Frutas",
    description: "Cesta mista de frutas da banca.",
    stock: 30,
    minStock: 5,
    active: true,
    price: 24.9,
    saleUnit: "cesta",
    packageSize: "1 cesta",
    weightKg: 4,
    photoDataUrl: "",
    photoName: "",
  },
  {
    id: 9,
    name: "Tomate orgânico",
    category: "Verduras e legumes",
    description: "Tomate orgânico vendido por quilo.",
    stock: 4,
    minStock: 5,
    active: true,
    price: 8.9,
    saleUnit: "kg",
    packageSize: "1 kg",
    weightKg: 1,
    photoDataUrl: "",
    photoName: "",
  },
  {
    id: 11,
    name: "Cheiro-verde",
    category: "Folhas e ervas",
    description: "Maço de cheiro-verde fresco.",
    stock: 0,
    minStock: 4,
    active: false,
    price: 4.5,
    saleUnit: "maço",
    packageSize: "1 maço",
    weightKg: 0.2,
    photoDataUrl: "",
    photoName: "",
  },
];

export const initialVendorOrders: VendorOrder[] = [
  {
    id: "FE-1027",
    customer: "Dona Marta",
    createdAt: "Hoje · 00:03",
    status: "new",
    value: 86.8,
    deliveryFee: 12.8,
    city: "Planaltina",
    estimatedPickupMinutes: 18,
    rejectReason: "",
    driverName: "",
    items: [
      {
        id: "1027-1",
        name: "Cesta de frutas",
        quantityLabel: "1 cesta",
        estimatedWeightKg: 4,
        actualWeightKg: 4,
        separated: false,
        unavailable: false,
        note: "",
      },
      {
        id: "1027-2",
        name: "Tomate orgânico",
        quantityLabel: "2 kg",
        estimatedWeightKg: 2,
        actualWeightKg: 2,
        separated: false,
        unavailable: false,
        note: "",
      },
      {
        id: "1027-3",
        name: "Cheiro-verde",
        quantityLabel: "2 maços",
        estimatedWeightKg: 0.4,
        actualWeightKg: 0.4,
        separated: false,
        unavailable: false,
        note: "",
      },
    ],
  },
  {
    id: "FE-1026",
    customer: "Carlos",
    createdAt: "Ontem · 18:42",
    status: "preparing",
    value: 54.2,
    deliveryFee: 9.9,
    city: "Planaltina",
    estimatedPickupMinutes: 12,
    rejectReason: "",
    driverName: "",
    items: [
      {
        id: "1026-1",
        name: "Tomate orgânico",
        quantityLabel: "3 kg",
        estimatedWeightKg: 3,
        actualWeightKg: 3,
        separated: true,
        unavailable: false,
        note: "",
      },
      {
        id: "1026-2",
        name: "Cesta de frutas",
        quantityLabel: "1 cesta",
        estimatedWeightKg: 4,
        actualWeightKg: 4,
        separated: false,
        unavailable: false,
        note: "",
      },
    ],
  },
  {
    id: "FE-1025",
    customer: "Renata",
    createdAt: "Ontem · 16:15",
    status: "ready_for_pickup",
    value: 132.5,
    deliveryFee: 14.5,
    city: "Sobradinho",
    estimatedPickupMinutes: 0,
    rejectReason: "",
    driverName: "Entregador a definir",
    items: [
      {
        id: "1025-1",
        name: "Cesta de frutas",
        quantityLabel: "3 cestas",
        estimatedWeightKg: 12,
        actualWeightKg: 12,
        separated: true,
        unavailable: false,
        note: "",
      },
    ],
  },
  {
    id: "FE-1024",
    customer: "Joana",
    createdAt: "20/09 · 12:18",
    status: "delivered",
    value: 96.3,
    deliveryFee: 11.9,
    city: "Planaltina",
    estimatedPickupMinutes: 0,
    rejectReason: "",
    driverName: "Rafael",
    items: [
      {
        id: "1024-1",
        name: "Cesta de frutas",
        quantityLabel: "2 cestas",
        estimatedWeightKg: 8,
        actualWeightKg: 8,
        separated: true,
        unavailable: false,
        note: "",
      },
    ],
  },
];

export const initialBankProfile: VendorBankProfile = {
  name: "Sítio da Vó",
  description: "Hortifruti, cestas e produtos selecionados.",
  fairName: "Feira do Produtor Rural",
  box: "18",
  corridor: "",
  reference: "Próximo à entrada principal",
  categories: "Hortifruti, orgânicos e cestas",
  phone: "",
  whatsapp: "",
  logoDataUrl: "",
  coverDataUrl: "",
};

export const initialVendorSchedule: VendorScheduleDay[] = [
  { day: "Segunda", enabled: true, open: "19:00", close: "02:00", breakStart: "", breakEnd: "" },
  { day: "Terça", enabled: false, open: "08:00", close: "17:00", breakStart: "", breakEnd: "" },
  { day: "Quarta", enabled: false, open: "08:00", close: "17:00", breakStart: "", breakEnd: "" },
  { day: "Quinta", enabled: true, open: "19:00", close: "02:00", breakStart: "", breakEnd: "" },
  { day: "Sexta", enabled: false, open: "08:00", close: "17:00", breakStart: "", breakEnd: "" },
  { day: "Sábado", enabled: false, open: "07:00", close: "14:00", breakStart: "", breakEnd: "" },
  { day: "Domingo", enabled: false, open: "07:00", close: "14:00", breakStart: "", breakEnd: "" },
];

export const initialVendorPromotions: VendorPromotion[] = [
  {
    id: "promo-frutas",
    type: "cupom",
    name: "10% na cesta de frutas",
    rule: "10% na cesta de frutas até domingo",
    startsAt: "",
    endsAt: "",
    active: false,
    vendorPaysDelivery: false,
    usageLimit: 30,
    usedCount: 4,
  },
];

export const initialVendorReviews: VendorReview[] = [
  {
    id: "review-1",
    type: "Cliente",
    author: "Joana",
    orderId: "FE-1024",
    date: "20/09/2026",
    rating: 5,
    comment: "Produtos frescos e pedido bem embalado.",
    response: "",
  },
  {
    id: "review-2",
    type: "Produto",
    author: "Marina",
    orderId: "FE-1019",
    date: "18/09/2026",
    rating: 4.8,
    comment: "Cesta bem montada e peso correto.",
    response: "",
  },
  {
    id: "review-3",
    type: "Entrega",
    author: "Rafael",
    orderId: "FE-1024",
    date: "20/09/2026",
    rating: 5,
    comment: "Pedido estava pronto no horário combinado.",
    response: "",
  },
];

export const initialVendorDocuments: VendorDocument[] = [
  {
    id: "identity",
    name: "Documento oficial com foto",
    description: "RG, CNH ou outro documento oficial válido do responsável.",
    required: true,
    status: "approved",
    fileName: "documento_identidade.pdf",
    expiresAt: "",
    correctionReason: "",
  },
  {
    id: "address",
    name: "Comprovante de residência",
    description: "Comprovante ou declaração de residência do responsável.",
    required: true,
    status: "approved",
    fileName: "comprovante_residencia.pdf",
    expiresAt: "",
    correctionReason: "",
  },
  {
    id: "permit",
    name: "Permissão/autorização da banca ou box",
    description: "Termo de Permissão de Uso, cessão/autorização válida ou documento equivalente da feira.",
    required: true,
    status: "approved",
    fileName: "termo_permissao.pdf",
    expiresAt: "",
    correctionReason: "",
  },
  {
    id: "sanitary",
    name: "Licença/registro sanitário",
    description: "Somente quando a atividade ou categoria de produto exigir.",
    required: false,
    status: "pending",
    fileName: "",
    expiresAt: "",
    correctionReason: "",
  },
];

export const initialVendorSalesHistory: VendorSaleRecord[] = [
  {
    id: "sale-1024",
    date: "2026-09-25T09:30:00-03:00",
    total: 96.3,
    discount: 0,
    deliverySubsidy: 0,
    refund: 0,
    items: [
      { name: "Cesta de frutas", quantity: 2 },
      { name: "Tomate orgânico", quantity: 2 },
    ],
  },
  {
    id: "sale-1023",
    date: "2026-09-24T16:10:00-03:00",
    total: 86.8,
    discount: 5,
    deliverySubsidy: 0,
    refund: 0,
    items: [
      { name: "Cesta de frutas", quantity: 1 },
      { name: "Tomate orgânico", quantity: 3 },
      { name: "Cheiro-verde", quantity: 2 },
    ],
  },
  {
    id: "sale-1018",
    date: "2026-09-18T11:20:00-03:00",
    total: 132.5,
    discount: 0,
    deliverySubsidy: 12.4,
    refund: 0,
    items: [
      { name: "Cesta de frutas", quantity: 3 },
      { name: "Tomate orgânico", quantity: 4 },
    ],
  },
  {
    id: "sale-1009",
    date: "2026-09-08T14:05:00-03:00",
    total: 74.9,
    discount: 0,
    deliverySubsidy: 0,
    refund: 0,
    items: [
      { name: "Tomate orgânico", quantity: 5 },
      { name: "Cheiro-verde", quantity: 3 },
    ],
  },
  {
    id: "sale-0991",
    date: "2026-08-21T10:40:00-03:00",
    total: 118.4,
    discount: 8,
    deliverySubsidy: 9.8,
    refund: 0,
    items: [
      { name: "Cesta de frutas", quantity: 2 },
      { name: "Tomate orgânico", quantity: 4 },
    ],
  },
  {
    id: "sale-0982",
    date: "2026-08-11T17:15:00-03:00",
    total: 92.6,
    discount: 0,
    deliverySubsidy: 0,
    refund: 18.9,
    items: [
      { name: "Cesta de frutas", quantity: 1 },
      { name: "Cheiro-verde", quantity: 5 },
    ],
  },
  {
    id: "sale-0944",
    date: "2026-07-19T12:00:00-03:00",
    total: 156.2,
    discount: 10,
    deliverySubsidy: 0,
    refund: 0,
    items: [
      { name: "Cesta de frutas", quantity: 4 },
      { name: "Tomate orgânico", quantity: 2 },
    ],
  },
];

export function vendorOrderStatusLabel(status: VendorOrderStatus) {
  const labels: Record<VendorOrderStatus, string> = {
    new: "Aguardando aceite",
    preparing: "Preparando",
    ready_for_pickup: "Pronto para coleta",
    collected: "Coletado",
    delivered: "Entregue",
    rejected: "Recusado/cancelado",
  };
  return labels[status];
}

export function vendorDocumentStatusLabel(status: VendorDocumentStatus) {
  const labels: Record<VendorDocumentStatus, string> = {
    pending: "Pendente de envio",
    under_review: "Em análise",
    approved: "Aprovado",
    correction_required: "Correção necessária",
  };
  return labels[status];
}
