export function slugId(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function vendorIdFor(name: string) {
  return `vendor:${slugId(name) || "sem-nome"}`;
}

export function storeIdFor(fairName: string, vendorName: string) {
  return `store:${slugId(fairName)}:${slugId(vendorName)}`;
}
