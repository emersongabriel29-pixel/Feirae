import { beforeEach, describe, expect, it } from "vitest";
import { authenticateLocalAccount, scrubLegacyPlaintextPasswords, updateLocalAccount } from "./localAuth";

describe("local auth", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("validates demo credentials instead of ignoring the password", () => {
    expect(
      authenticateLocalAccount({
        role: "customer",
        email: "cliente@feirae.test",
        name: "",
        password: "errada1",
        signup: false,
      }).ok,
    ).toBe(false);

    expect(
      authenticateLocalAccount({
        role: "customer",
        email: "cliente@feirae.test",
        name: "",
        password: "123456",
        signup: false,
      }).ok,
    ).toBe(true);
  });

  it("creates a local account and requires the stored password on login", () => {
    const signup = authenticateLocalAccount({
      role: "customer",
      email: "nova@feirae.app",
      name: "Nova Cliente",
      password: "segredo1",
      signup: true,
    });
    expect(signup.ok).toBe(true);

    expect(
      authenticateLocalAccount({
        role: "customer",
        email: "nova@feirae.app",
        name: "",
        password: "errada1",
        signup: false,
      }).ok,
    ).toBe(false);

    const wrongRole = authenticateLocalAccount({
      role: "feirante",
      email: "nova@feirae.app",
      name: "",
      password: "segredo1",
      signup: false,
    });
    expect(wrongRole.ok).toBe(false);
    if (!wrongRole.ok) {
      expect(wrongRole.message).toMatch(
        /e-mail já está vinculado ao acesso Cliente\. Entre como Cliente ou utilize outro e-mail/i,
      );
    }

    const login = authenticateLocalAccount({
      role: "customer",
      email: "nova@feirae.app",
      name: "",
      password: "segredo1",
      signup: false,
    });
    expect(login.ok).toBe(true);
  });

  it("changes email and password together", () => {
    authenticateLocalAccount({
      role: "delivery",
      email: "entrega@feirae.app",
      name: "Entregador",
      password: "senha123",
      signup: true,
    });

    const update = updateLocalAccount({
      oldEmail: "entrega@feirae.app",
      role: "delivery",
      name: "Entregador Atualizado",
      email: "novo@feirae.app",
      newPassword: "nova123",
    });
    expect(update.ok).toBe(true);

    expect(
      authenticateLocalAccount({
        role: "delivery",
        email: "entrega@feirae.app",
        name: "",
        password: "senha123",
        signup: false,
      }).ok,
    ).toBe(false);

    const login = authenticateLocalAccount({
      role: "delivery",
      email: "novo@feirae.app",
      name: "",
      password: "nova123",
      signup: false,
    });
    expect(login.ok).toBe(true);
    if (login.ok) expect(login.account.name).toBe("Entregador Atualizado");
  });

  it("removes plaintext passwords left by the old profile implementation", () => {
    window.localStorage.setItem(
      "feirae:account:cliente@feirae.test",
      JSON.stringify({ name: "Cliente", password: "123456" }),
    );

    scrubLegacyPlaintextPasswords();

    expect(window.localStorage.getItem("feirae:account:cliente@feirae.test")).not.toContain("123456");
    expect(window.localStorage.getItem("feirae:account:cliente@feirae.test")).not.toContain("password");
  });
});
