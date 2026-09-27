import { describe, expect, it } from "vitest";
import {
  allRequiredTermsAccepted,
  deliveryPartnerTerm,
  deliveryRequiredTerms,
  demoLegalAcceptance,
  hasCurrentLegalAcceptance,
  legalTermFingerprint,
  privacyNoticeTerm,
  vendorPartnerTerm,
  vendorRequiredTerms,
} from "./legalTerms";

describe("Feiraê partner legal terms", () => {
  it("makes truth, consumer responsibility, ethics and sanitary compliance explicit for feirantes", () => {
    const text = JSON.stringify(vendorPartnerTerm);
    expect(text).toMatch(/verdade|verdadeir/i);
    expect(text).toMatch(/Código de Defesa do Consumidor/i);
    expect(text).toMatch(/RDC Anvisa nº 216\/2004/i);
    expect(text).toMatch(/discrimina|assédio|fraude/i);
    expect(text).toMatch(/responsabilidade/i);
  });

  it("states real autonomy safeguards instead of relying only on a no-employment label", () => {
    const text = JSON.stringify(deliveryPartnerTerm);
    expect(text).toMatch(/online ou offline/i);
    expect(text).toMatch(/aceitar ou recusar/i);
    expect(text).toMatch(/não há exclusividade/i);
    expect(text).toMatch(/não.*afastada.*cláusula|não pode ser afastada/i);
    expect(text).toMatch(/relação de emprego/i);
  });

  it("includes current moto-frete duties and official traffic references", () => {
    const text = JSON.stringify(deliveryPartnerTerm);
    expect(text).toMatch(/Lei nº 12\.009\/2009/i);
    expect(text).toMatch(/21 anos/i);
    expect(text).toMatch(/habilitação por pelo menos dois anos/i);
    expect(text).toMatch(/curso especializado/i);
    expect(text).toMatch(/Resolução Contran nº 1\.020\/2025/i);
  });

  it("separates privacy notice awareness from optional consent", () => {
    const text = JSON.stringify(privacyNoticeTerm);
    expect(text).toMatch(/execução do contrato/i);
    expect(text).toMatch(/legítimo interesse/i);
    expect(text).toMatch(/consentimento/i);
    expect(text).toMatch(/WhatsApp/i);
    expect(text).toMatch(/três dias úteis/i);
    expect(text).toMatch(/não transforma tratamentos obrigatórios em consentimento/i);
  });

  it("requires the current version of every mandatory term", () => {
    const acceptances = vendorRequiredTerms.map((term) =>
      demoLegalAcceptance(term, "feirante", "Feirante Teste", "feirante@feirae.test"),
    );

    expect(allRequiredTermsAccepted(acceptances, vendorRequiredTerms, "feirante")).toBe(true);
    expect(hasCurrentLegalAcceptance(acceptances, vendorPartnerTerm, "feirante")).toBe(true);
    expect(hasCurrentLegalAcceptance(acceptances, privacyNoticeTerm, "feirante")).toBe(true);

    const stale = acceptances.map((acceptance, index) =>
      index === 0 ? { ...acceptance, version: "versao-antiga" } : acceptance,
    );
    expect(allRequiredTermsAccepted(stale, vendorRequiredTerms, "feirante")).toBe(false);
  });

  it("keeps role-specific acceptances isolated", () => {
    const deliveryAcceptances = deliveryRequiredTerms.map((term) =>
      demoLegalAcceptance(term, "delivery", "Entregador Teste", "entregador@feirae.test"),
    );

    expect(allRequiredTermsAccepted(deliveryAcceptances, deliveryRequiredTerms, "delivery")).toBe(true);
    expect(allRequiredTermsAccepted(deliveryAcceptances, vendorRequiredTerms, "feirante")).toBe(false);
  });

  it("generates a stable content fingerprint and changes it when the document changes", async () => {
    const first = await legalTermFingerprint(vendorPartnerTerm);
    const second = await legalTermFingerprint(vendorPartnerTerm);
    const changed = await legalTermFingerprint({
      ...vendorPartnerTerm,
      version: "2026-09-26.2",
    });

    expect(first).toBe(second);
    expect(first).not.toBe(changed);
    expect(first.length).toBeGreaterThan(8);
  });

  it("keeps both operational terms and the LGPD notice mandatory for each partner type", () => {
    expect(vendorRequiredTerms.map((term) => term.id)).toEqual([
      "vendor-partner-terms",
      "partner-privacy-notice",
    ]);
    expect(deliveryRequiredTerms.map((term) => term.id)).toEqual([
      "delivery-partner-terms",
      "partner-privacy-notice",
    ]);
  });
});
