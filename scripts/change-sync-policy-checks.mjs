import assert from "node:assert/strict";
import test from "node:test";
import { evaluateChangedFiles } from "./change-sync-policy.mjs";

test("requires documentation for project changes", () => {
  const failures = evaluateChangedFiles(["src/domain/operations.ts", "src/domain/operations.test.ts"]);
  assert.ok(failures.some((failure) => failure.includes("sem atualização de documentação")));
});

test("requires a test when source behavior changes", () => {
  const failures = evaluateChangedFiles(["src/domain/operations.ts", "docs/FUNCTIONAL_SPEC.md"]);
  assert.ok(failures.some((failure) => failure.includes("sem arquivo de teste")));
});

test("requires TESTING_QA whenever tests change", () => {
  const failures = evaluateChangedFiles([
    "src/domain/operations.test.ts",
    "docs/FUNCTIONAL_SPEC.md",
  ]);
  assert.ok(failures.some((failure) => failure.includes("docs/TESTING_QA.md")));
});

test("requires UI audit and design system for UI changes", () => {
  const failures = evaluateChangedFiles([
    "src/styles/customer.css",
    "docs/UI_UX_PRO_MAX_GUARDRAILS.md",
  ]);
  assert.ok(failures.some((failure) => failure.includes("docs/UI_INTERACTION_AUDIT.md")));
  assert.ok(failures.some((failure) => failure.includes("docs/DESIGN_SYSTEM.md")));
});

test("requires all schema and deployment docs for migrations", () => {
  const failures = evaluateChangedFiles([
    "supabase/migrations/0004_example.sql",
    "docs/SCHEMA_GAP_MATRIX.md",
  ]);
  assert.ok(failures.some((failure) => failure.includes("docs/DATA_MODEL_AND_STATES.md")));
  assert.ok(failures.some((failure) => failure.includes("docs/IMPLEMENTATION_TRACEABILITY.md")));
  assert.ok(failures.some((failure) => failure.includes("docs/DEPLOYMENT_AND_ENVIRONMENTS.md")));
});

test("requires launch architecture and functional documentation", () => {
  const failures = evaluateChangedFiles([
    "src/components/LaunchExperience.tsx",
    "src/components/LaunchExperience.test.tsx",
    "docs/TESTING_QA.md",
    "docs/LAUNCH_EXPERIENCE.md",
    "docs/UI_INTERACTION_AUDIT.md",
    "docs/DESIGN_SYSTEM.md",
  ]);
  assert.ok(failures.some((failure) => failure.includes("docs/ARCHITECTURE.md")));
  assert.ok(failures.some((failure) => failure.includes("docs/FUNCTIONAL_SPEC.md")));
});

test("requires domain-specific order documentation", () => {
  const failures = evaluateChangedFiles([
    "src/domain/multiVendor.ts",
    "src/domain/multiVendor.test.ts",
    "docs/TESTING_QA.md",
    "docs/MULTI_VENDOR_ORDERS.md",
  ]);
  assert.ok(failures.some((failure) => failure.includes("docs/FUNCTIONAL_SPEC.md")));
  assert.ok(failures.some((failure) => failure.includes("docs/IMPLEMENTATION_TRACEABILITY.md")));
});

test("accepts a fully synchronized representative UI change", () => {
  const failures = evaluateChangedFiles([
    "src/components/AppComponents.tsx",
    "src/App.test.tsx",
    "docs/TESTING_QA.md",
    "docs/UI_INTERACTION_AUDIT.md",
    "docs/DESIGN_SYSTEM.md",
  ]);
  assert.deepEqual(failures, []);
});
