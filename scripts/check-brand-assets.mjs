/* global console, process */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const officialAssets = [
  "02_logo_alta_definicao_fundo_claro.webp",
  "03_logo_fundo_transparente.webp",
  "04_versao_principal.webp",
  "05_versao_horizontal.webp",
  "06_icone_mais_nome.webp",
  "07_versao_monocromatica_verde.webp",
  "08_versao_fundo_escuro.webp",
  "09_versao_selo.webp",
];

const runtimeAssets = new Set([
  "/brand/03_logo_fundo_transparente.webp",
  "/brand/05_versao_horizontal.webp",
  "/brand/09_versao_selo.webp",
]);

const reservedAssets = officialAssets
  .filter(
    (name) =>
      !["03_logo_fundo_transparente.webp", "05_versao_horizontal.webp", "09_versao_selo.webp"].includes(name),
  )
  .map((name) => `/brand/${name}`);

const legacyAssets = [
  "/brand/feirae-logo-approved.webp",
  "/brand/feirae-logo-horizontal.svg",
  "/brand/feirae-symbol.svg",
  "/feirae-mark.svg",
];

const roots = ["src", "public/gestao", "index.html", "public/site.webmanifest"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".html", ".json", ".css"]);

function collect(path) {
  if (!existsSync(path)) return [];
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path).flatMap((name) => collect(join(path, name)));
}

const files = roots.flatMap(collect).filter((path) => extensions.has(extname(path)));

const violations = [];
const usage = new Map([...runtimeAssets].map((asset) => [asset, []]));

for (const file of files) {
  const content = readFileSync(file, "utf8");
  const display = relative(process.cwd(), file);

  for (const asset of runtimeAssets) {
    if (content.includes(asset)) usage.get(asset).push(display);
  }

  for (const asset of reservedAssets) {
    if (content.includes(asset)) {
      violations.push(`${display}: versão reservada usada no runtime: ${asset}`);
    }
  }

  for (const asset of legacyAssets) {
    if (content.includes(asset)) {
      violations.push(`${display}: referência antiga de marca: ${asset}`);
    }
  }
}

for (const name of officialAssets) {
  const path = join("public", "brand", name);
  if (!existsSync(path)) violations.push(`asset oficial ausente: ${path}`);
}

for (const [asset, locations] of usage) {
  if (locations.length === 0) violations.push(`asset operacional sem uso: ${asset}`);
}

if (violations.length) {
  console.error("Falha na política de identidade Feiraê:\n");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("Identidade Feiraê OK: runtime usa somente 03, 05 e 09; kit oficial completo preservado.");
