export type ProductMeasurementPolicy = {
  allowedUnits: string[];
  defaultUnit: string;
  examples: string[];
  note: string;
};

const DEFAULT_POLICY: ProductMeasurementPolicy = {
  allowedUnits: ["un", "peça", "pacote", "caixa", "kit"],
  defaultUnit: "un",
  examples: ["1 unidade", "1 peça", "1 pacote"],
  note: "Escolha uma unidade comercial clara e uma apresentação exata para o cliente.",
};

const POLICIES: Record<string, ProductMeasurementPolicy> = {
  Frutas: {
    allowedUnits: ["kg", "un", "bandeja", "saco", "caixa", "cesta"],
    defaultUnit: "kg",
    examples: ["1 kg", "1 unidade", "bandeja 500 g", "caixa 5 kg"],
    note: "Frutas soltas podem ser vendidas por kg; embaladas devem informar o peso/apresentação exata.",
  },
  "Verduras e legumes": {
    allowedUnits: ["kg", "un", "bandeja", "saco", "caixa", "cesta"],
    defaultUnit: "kg",
    examples: ["1 kg", "1 unidade", "bandeja 500 g"],
    note: "Use kg para produto solto ou uma apresentação fixa quando vendido em bandeja, saco ou unidade.",
  },
  "Folhas e ervas": {
    allowedUnits: ["maço", "un", "bandeja", "pacote"],
    defaultUnit: "maço",
    examples: ["1 maço", "2 maços", "bandeja 200 g"],
    note: "Cheiro-verde, coentro, couve e ervas devem preferir maço/unidade ou embalagem fixa.",
  },
  "Cereais e grãos": {
    allowedUnits: ["kg", "pacote", "saco", "caixa"],
    defaultUnit: "pacote",
    examples: ["pacote 500 g", "pacote 1 kg", "saco 5 kg"],
    note: "Farinha, arroz e grãos embalados devem usar pacote/saco com peso exato. Produto a granel pode usar kg.",
  },
  Ovos: {
    allowedUnits: ["dúzia", "bandeja", "un", "caixa"],
    defaultUnit: "dúzia",
    examples: ["1 dúzia", "bandeja com 30 ovos"],
    note: "Ovos devem usar quantidade de unidades, dúzia ou bandeja; peso serve apenas para logística.",
  },
  "Carnes e aves": {
    allowedUnits: ["kg", "bandeja", "pacote", "peça", "un"],
    defaultUnit: "kg",
    examples: ["1 kg", "bandeja 500 g", "1 peça"],
    note: "Carne pode ser vendida por kg ou em embalagem/peça com apresentação definida.",
  },
  "Pescados e frutos do mar": {
    allowedUnits: ["kg", "bandeja", "pacote", "peça", "un"],
    defaultUnit: "kg",
    examples: ["filé 1 kg", "bandeja 500 g", "1 peixe inteiro", "camarão 1 kg"],
    note: "Filés e camarões normalmente usam kg ou embalagem fixa. Peixe inteiro pode ser por peça ou kg, mas a regra deve ser explícita.",
  },
  Laticínios: {
    allowedUnits: ["kg", "peça", "un", "pacote", "pote"],
    defaultUnit: "peça",
    examples: ["1 peça", "500 g", "pote 300 g"],
    note: "Queijos podem ser por peça ou kg; potes e embalagens devem informar o peso exato.",
  },
  "Doces e produtos caseiros": {
    allowedUnits: ["un", "peça", "pote", "pacote", "caixa", "porção"],
    defaultUnit: "un",
    examples: ["1 unidade", "pote 500 g", "caixa com 6"],
    note: "Use unidade/peça ou embalagem com conteúdo definido.",
  },
  "Pães e panificados": {
    allowedUnits: ["un", "pacote", "cesta", "porção"],
    defaultUnit: "un",
    examples: ["1 unidade", "pacote com 6", "1 cesta"],
    note: "Pães e panificados devem ter quantidade ou embalagem definida.",
  },
  "Refeições e lanches": {
    allowedUnits: ["un", "porção", "kit", "caixa"],
    defaultUnit: "un",
    examples: ["1 unidade", "1 porção", "combo com 3 itens"],
    note: "Use unidade, porção ou combo com composição explícita.",
  },
  Bebidas: {
    allowedUnits: ["L", "ml", "un", "garrafa", "caixa"],
    defaultUnit: "un",
    examples: ["garrafa 500 ml", "1 L", "caixa com 12"],
    note: "Informe volume exato por unidade/garrafa/caixa.",
  },
  Flores: {
    allowedUnits: ["un", "maço", "buquê", "vaso"],
    defaultUnit: "buquê",
    examples: ["1 buquê", "1 vaso", "1 maço"],
    note: "Use unidade, maço, buquê ou vaso.",
  },
  Plantas: {
    allowedUnits: ["vaso", "un"],
    defaultUnit: "vaso",
    examples: ["1 vaso", "1 unidade"],
    note: "Use vaso ou unidade; peso é somente logístico.",
  },
};

export function measurementPolicyForCategory(category: string): ProductMeasurementPolicy {
  return POLICIES[category] ?? DEFAULT_POLICY;
}

export function exactPresentation(unit: string, packageSize?: string) {
  const presentation = packageSize?.trim();
  if (presentation) return presentation;
  if (unit === "kg") return "1 kg";
  if (unit === "g") return "100 g";
  if (unit === "L") return "1 L";
  if (unit === "ml") return "100 ml";
  return `1 ${unit}`;
}

export function measurementCustomerNote(unit: string, packageSize?: string) {
  const presentation = exactPresentation(unit, packageSize);
  return `Venda por ${presentation}. O peso logístico não altera o preço informado.`;
}
