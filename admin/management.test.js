/* global URL */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { modules } from "./modules.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const app = read("./app.js");
const migration = read("../supabase/migrations/0003_management_console.sql");
const edge = read("../supabase/functions/admin-actions/index.ts");
const documentUpload = read("../supabase/functions/document-upload/index.ts");
const supabaseConfig = read("../supabase/config.toml");

describe("Feiraê Gestão hardening", () => {
  it("does not expose generic editors for critical operational records", () => {
    expect(modules.orders.fields).toEqual([]);
    expect(modules.delivery_jobs.fields).toEqual([]);
    expect(modules.payments.fields).toEqual([]);
    expect(modules.payouts.readonly).toBe(true);
    expect(modules.documents.fields).toEqual([]);
    expect(modules.reviews.fields).toEqual([]);
    expect(modules.privacy.fields).toEqual([]);
    expect(modules.vendors.fields.some((field) => field.key === "approved")).toBe(false);
    expect(modules.drivers.fields.some((field) => field.key === "approved")).toBe(false);
  });

  it("uses server-side pagination instead of the old 300 row cap", () => {
    expect(app).toContain(".range(from,to)");
    expect(app).not.toContain('.select("*").limit(300)');
    expect(app).toContain("Buscar no banco");
  });

  it("requires explicit superadmin or explicit permissions", () => {
    expect(migration).toContain("is_superadmin boolean not null default false");
    expect(migration).toContain("and aa.is_superadmin");
    expect(migration).not.toContain("not exists (\n        select 1 from public.admin_permissions");
  });

  it("blocks direct browser mutation of critical tables", () => {
    for (const table of [
      "orders",
      "deliveries",
      "payments",
      "payouts",
      "wallet_entries",
      "admin_access",
      "admin_permissions",
      "account_enforcements",
      "privacy_requests",
    ]) {
      expect(migration).toContain(
        `revoke insert, update, delete on table public.${table} from authenticated`,
      );
    }
  });

  it("requires MFA both in RLS and in admin server actions", () => {
    expect(migration).toContain("auth.jwt()->>'aal'");
    expect(edge).toContain('currentLevel !== "aal2"');
    expect(app).toContain("challengeAndVerify");
  });

  it("routes critical actions through the admin Edge Function", () => {
    expect(app).toContain('functions.invoke("admin-actions"');
    for (const action of [
      "order_transition",
      "payment_reconcile",
      "document_review",
      "review_moderate",
      "privacy_update",
      "support_update",
      "enforcement_create",
      "admin_permissions_replace",
      "refresh_alerts",
      "health_check",
      "profile_approval",
    ]) {
      expect(edge).toContain(`action === "${action}"`);
    }
  });

  it("persists operational alerts and creates a private document bucket", () => {
    expect(migration).toContain("create table if not exists public.operational_alerts");
    expect(migration).toContain("insert into storage.buckets");
    expect(migration).toContain("'onboarding-documents'");
    expect(migration).toContain("false,");
  });

  it("prevents browser bypass of role, approval and audit protections", () => {
    expect(migration).toContain("Profile role changes must use a trusted server-side action.");
    expect(migration).toContain("Operational approval must use a trusted administrative action.");
    expect(migration).toContain(
      "revoke insert, update, delete on table public.admin_audit_logs from authenticated",
    );
  });

  it("validates document content server-side and keeps JWT verification enabled", () => {
    expect(documentUpload).toContain("file_signature_mismatch");
    expect(documentUpload).toContain("matchesSignature");
    expect(documentUpload).toContain("5 * 1024 * 1024");
    expect(supabaseConfig).toContain("[functions.document-upload]");
    expect(supabaseConfig).toContain("verify_jwt = true");
  });

  it("fixes the production Supabase connection instead of allowing arbitrary browser switching", () => {
    expect(app).toContain('fetch("./config.json"');
    expect(app).toContain("if(!isLocalAdmin)");
    expect(app).toContain("A conexão da Gestão é fixa em produção.");
  });
});
