import { beforeEach, describe, expect, it } from "vitest";
import {
  customerLegalStorageKey,
  customerPrivacyNotice,
  customerRequiredTerms,
  customerTermsOfUse,
  saveCustomerLegalAcceptances,
} from "./customerLegal";

describe("customer legal onboarding", () => {
  beforeEach(() => window.localStorage.clear());

  it("keeps customer terms and privacy as separate mandatory documents", () => {
    expect(customerRequiredTerms.map((term) => term.id)).toEqual([
      "customer-terms-of-use",
      "customer-privacy-notice",
    ]);
    expect(customerTermsOfUse.role).toBe("customer");
    expect(customerPrivacyNotice.role).toBe("customer");
  });

  it("does not use the privacy acknowledgement as generic consent", () => {
    const text = JSON.stringify(customerPrivacyNotice);
    expect(text).toMatch(/execução do contrato/i);
    expect(text).toMatch(/legítimo interesse/i);
    expect(text).toMatch(/consentimento/i);
    expect(text).toMatch(/não transforma todo tratamento em consentimento/i);
    expect(text).toMatch(/não devem vir pré-marcadas/i);
  });

  it("preserves consumer rights in the customer terms", () => {
    const text = JSON.stringify(customerTermsOfUse);
    expect(text).toMatch(/Código de Defesa do Consumidor/i);
    expect(text).toMatch(/arrependimento/i);
    expect(text).toMatch(/não criam renúncia antecipada/i);
    expect(text).toMatch(/Decreto nº 7\.962\/2013/i);
  });

  it("stores versioned acceptance evidence after customer signup", () => {
    saveCustomerLegalAcceptances("Cliente Teste", "CLIENTE.NOVO@FEIRAE.APP");

    const raw = window.localStorage.getItem(customerLegalStorageKey("cliente.novo@feirae.app"));
    expect(raw).not.toBeNull();
    const acceptances = JSON.parse(raw ?? "[]") as Array<Record<string, string>>;
    expect(acceptances).toHaveLength(2);
    expect(acceptances.every((item) => item.role === "customer")).toBe(true);
    expect(acceptances.every((item) => item.method === "checkbox")).toBe(true);
    expect(acceptances.every((item) => item.version && item.fingerprint)).toBe(true);
  });
});
