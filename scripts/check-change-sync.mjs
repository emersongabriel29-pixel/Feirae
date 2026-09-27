/* global process, console */
import { execFileSync } from "node:child_process";
import { evaluateChangedFiles } from "./change-sync-policy.mjs";

const base = process.env.BASE_SHA;
const head = process.env.HEAD_SHA ?? "HEAD";

if (!base) {
  console.log("check-change-sync: BASE_SHA ausente; verificação semântica ignorada fora de pull request.");
  process.exit(0);
}

const output = execFileSync("git", ["diff", "--name-only", base, head], {
  encoding: "utf8",
});

const files = output
  .split("\n")
  .map((value) => value.trim())
  .filter(Boolean);

if (files.length === 0) {
  console.log("check-change-sync: nenhum arquivo alterado.");
  process.exit(0);
}

const failures = evaluateChangedFiles(files);

if (failures.length > 0) {
  console.error("\nFalha de sincronização do projeto:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error("\nArquivos alterados:");
  for (const file of files) console.error(`  ${file}`);
  process.exit(1);
}

console.log("check-change-sync: código, testes e documentação específica avançam juntos.");
