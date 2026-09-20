import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

function loginAs(role: "cliente" | "feirante" | "entregador") {
  fireEvent.click(screen.getByRole("radio", { name: new RegExp(role, "i") }));
  fireEvent.change(screen.getByLabelText(/e-mail/i), {
    target: { value: `${role}@feirae.test` },
  });
  fireEvent.change(screen.getByLabelText(/senha/i), {
    target: { value: "123456" },
  });
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`entrar como ${role}`, "i") }));
}

describe("Feiraê customer flow", () => {
  it("opens the catalog from the home page", () => {
    render(<App />);
    loginAs("cliente");
    fireEvent.click(screen.getByRole("button", { name: /explorar produtos/i }));
    expect(screen.getByRole("heading", { name: /produtos da feira/i })).toBeInTheDocument();
  });

  it("completes the local demo checkout without leaving a blank screen", () => {
    render(<App />);
    loginAs("cliente");
    fireEvent.click(screen.getByRole("button", { name: /explorar produtos/i }));
    fireEvent.click(screen.getByRole("button", { name: /adicionar cesta de frutas/i }));
    fireEvent.click(screen.getByRole("button", { name: /abrir sacola com 1 itens/i }));
    fireEvent.click(screen.getByRole("button", { name: /continuar para checkout/i }));
    expect(screen.getByRole("heading", { name: /finalizar pedido/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /confirmar pedido/i }));
    expect(screen.getByRole("heading", { name: /meus pedidos/i })).toBeInTheDocument();
    expect(screen.getByText(/recebido/i)).toBeInTheDocument();
  });
});

describe("Feiraê role access", () => {
  it("discards an obsolete or invalid saved profile", () => {
    window.localStorage.setItem("feirae:session-role", JSON.stringify("admin"));
    render(<App />);
    expect(screen.getByRole("heading", { name: /como você vai usar o aplicativo/i })).toBeInTheDocument();
  });

  it("opens the vendor experience selected at login", () => {
    render(<App />);
    loginAs("feirante");
    expect(screen.getByRole("heading", { name: /painel do feirante/i })).toBeInTheDocument();
    expect(screen.queryByText(/minha feira/i)).not.toBeInTheDocument();
  });

  it("opens the delivery experience selected at login", () => {
    render(<App />);
    loginAs("entregador");
    expect(screen.getByRole("heading", { name: /central do entregador/i })).toBeInTheDocument();
  });

  it("only allows changing the profile after logout", () => {
    render(<App />);
    loginAs("feirante");
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /sair/i }));
    expect(screen.getByRole("heading", { name: /como você vai usar o aplicativo/i })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });
});
