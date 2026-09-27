const isDoc = (file) =>
  file === "README.md" ||
  file === "CONTRIBUTING.md" ||
  file.startsWith("docs/") ||
  file === ".github/pull_request_template.md";

const isTest = (file) =>
  /(?:\.test\.|\.spec\.)/.test(file) ||
  file.startsWith("tests/") ||
  file.startsWith("e2e/") ||
  file === "scripts/change-sync-policy-checks.mjs";

const hasAny = (files, predicates) =>
  files.some((file) => predicates.some((predicate) => predicate(file)));

const startsWithAny = (...prefixes) => (file) => prefixes.some((prefix) => file.startsWith(prefix));
const equalsAny = (...names) => (file) => names.includes(file);

export function evaluateChangedFiles(files) {
  const changed = new Set(files);
  const changedDocs = files.filter(isDoc);
  const changedTests = files.filter(isTest);
  const behaviorSource = files.filter(
    (file) => file.startsWith("src/") && /\.(ts|tsx)$/.test(file) && !isTest(file) && !file.endsWith(".d.ts"),
  );
  const migrations = files.filter((file) => file.startsWith("supabase/migrations/"));
  const workflowsOrDeploy = files.filter(
    (file) =>
      file.startsWith(".github/workflows/") ||
      file === ".env.example" ||
      /(?:vercel|netlify|firebase|docker|fly\.toml|supabase\/config\.toml)/i.test(file),
  );
  const nonDocProjectChanges = files.filter(
    (file) => !isDoc(file) && !file.startsWith(".github/pull_request_template") && file !== "package-lock.json",
  );

  const failures = [];

  const requireDocs = (triggered, docs, reason) => {
    if (!triggered) return;
    const missing = docs.filter((doc) => !changed.has(doc));
    if (missing.length > 0) {
      failures.push(`${reason} Documentos obrigatórios ausentes: ${missing.join(", ")}.`);
    }
  };

  if (nonDocProjectChanges.length > 0 && changedDocs.length === 0) {
    failures.push("Há alteração de código/config/schema sem atualização de documentação no mesmo PR.");
  }

  if (behaviorSource.length > 0 && changedTests.length === 0) {
    failures.push("Há alteração de comportamento em src/ sem arquivo de teste alterado no mesmo PR.");
  }

  requireDocs(
    changedTests.length > 0,
    ["docs/TESTING_QA.md"],
    "Testes foram alterados; a cobertura documentada precisa acompanhar a suíte.",
  );

  requireDocs(
    migrations.length > 0,
    [
      "docs/SCHEMA_GAP_MATRIX.md",
      "docs/DATA_MODEL_AND_STATES.md",
      "docs/IMPLEMENTATION_TRACEABILITY.md",
      "docs/DEPLOYMENT_AND_ENVIRONMENTS.md",
    ],
    "Migration/schema foi alterado.",
  );

  requireDocs(
    workflowsOrDeploy.length > 0,
    ["docs/DEPLOYMENT_AND_ENVIRONMENTS.md"],
    "Workflow ou configuração de ambiente foi alterado.",
  );

  const uiUxChanged = hasAny(files, [
    startsWithAny("src/styles/", "src/components/"),
    (file) => /^src\/features\/(customer|vendor|delivery)\/.*Screens\.tsx$/.test(file),
    equalsAny("src/App.tsx"),
  ]);
  requireDocs(
    uiUxChanged,
    ["docs/UI_INTERACTION_AUDIT.md", "docs/DESIGN_SYSTEM.md"],
    "UI/UX foi alterada.",
  );

  const launchChanged = hasAny(files, [
    (file) => file.startsWith("src/components/LaunchExperience"),
    equalsAny("src/domain/feiraeSound.ts", "src/main.tsx"),
  ]);
  requireDocs(
    launchChanged,
    ["docs/LAUNCH_EXPERIENCE.md", "docs/ARCHITECTURE.md", "docs/FUNCTIONAL_SPEC.md"],
    "Experiência de abertura/identidade sonora foi alterada.",
  );

  const orderDomainChanged = hasAny(files, [
    equalsAny(
      "src/domain/orderBridge.ts",
      "src/domain/multiVendor.ts",
      "src/domain/inventoryBridge.ts",
      "src/domain/walletBridge.ts",
    ),
  ]);
  requireDocs(
    orderDomainChanged,
    ["docs/FUNCTIONAL_SPEC.md", "docs/IMPLEMENTATION_TRACEABILITY.md"],
    "Regra crítica de pedido/estoque/carteira foi alterada.",
  );

  const notificationChanged = hasAny(files, [equalsAny("src/domain/feiraeNotifications.ts", "public/feirae-sw.js")]);
  requireDocs(
    notificationChanged,
    ["docs/NOTIFICATIONS.md", "docs/IMPLEMENTATION_TRACEABILITY.md"],
    "Notificações foram alteradas.",
  );

  const authPrivacyChanged = hasAny(files, [
    equalsAny(
      "src/domain/localAuth.ts",
      "src/domain/legalTerms.ts",
      "src/domain/customerLegal.ts",
      "src/domain/storedFile.ts",
    ),
  ]);
  requireDocs(
    authPrivacyChanged,
    ["docs/SECURITY_AND_AUTH.md", "docs/LGPD_AND_PRIVACY.md"],
    "Autenticação, termos ou dados pessoais foram alterados.",
  );

  return failures;
}
