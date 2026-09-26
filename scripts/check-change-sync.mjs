import { execFileSync } from "node:child_process";

const base = process.env.BASE_SHA;
const head = process.env.HEAD_SHA ?? "HEAD";

if (!base) {
  console.log(
    "check-change-sync: BASE_SHA ausente; verificação semântica ignorada fora de pull request.",
  );
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

const isDoc = (file) =>
  file === "README.md" ||
  file === "CONTRIBUTING.md" ||
  file.startsWith("docs/") ||
  file === ".github/pull_request_template.md";

const isTest = (file) =>
  /(?:\.test\.|\.spec\.)/.test(file) ||
  file.startsWith("tests/") ||
  file.startsWith("e2e/");

const behaviorSource = files.filter(
  (file) =>
    file.startsWith("src/") &&
    /\.(ts|tsx)$/.test(file) &&
    !isTest(file) &&
    !file.endsWith(".d.ts"),
);

const changedDocs = files.filter(isDoc);
const changedTests = files.filter(isTest);
const migrations = files.filter((file) => file.startsWith("supabase/migrations/"));
const workflowsOrDeploy = files.filter(
  (file) =>
    file.startsWith(".github/workflows/") ||
    file === ".env.example" ||
    /(?:vercel|netlify|firebase|docker|fly\.toml|supabase\/config\.toml)/i.test(file),
);

const nonDocProjectChanges = files.filter(
  (file) =>
    !isDoc(file) &&
    !file.startsWith(".github/pull_request_template") &&
    file !== "package-lock.json",
);

const failures = [];

if (nonDocProjectChanges.length > 0 && changedDocs.length === 0) {
  failures.push(
    "Há alteração de código/config/schema sem atualização de documentação no mesmo PR.",
  );
}

if (behaviorSource.length > 0 && changedTests.length === 0) {
  failures.push(
    "Há alteração de comportamento em src/ sem arquivo de teste alterado no mesmo PR.",
  );
}

if (migrations.length > 0) {
  const schemaDocs = new Set([
    "docs/SCHEMA_GAP_MATRIX.md",
    "docs/DATA_MODEL_AND_STATES.md",
    "docs/IMPLEMENTATION_TRACEABILITY.md",
  ]);
  if (!changedDocs.some((file) => schemaDocs.has(file))) {
    failures.push(
      "Migration alterada sem atualizar SCHEMA_GAP_MATRIX, DATA_MODEL_AND_STATES ou IMPLEMENTATION_TRACEABILITY.",
    );
  }
}

if (
  workflowsOrDeploy.length > 0 &&
  !changedDocs.includes("docs/DEPLOYMENT_AND_ENVIRONMENTS.md")
) {
  failures.push(
    "Workflow/configuração de ambiente alterada sem atualizar DEPLOYMENT_AND_ENVIRONMENTS.md.",
  );
}

if (failures.length > 0) {
  console.error("\nFalha de sincronização do projeto:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error("\nArquivos alterados:");
  for (const file of files) console.error(`  ${file}`);
  process.exit(1);
}

console.log("check-change-sync: código, testes e documentação avançam juntos.");
