import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

function loginAs(role: "cliente" | "feirante" | "entregador") {
  fireEvent.click(screen.getByRole("radio", { name: new RegExp(role, "i") }));
  fireEvent.change(screen.getByLabelText(/e-mail/i), {
    target: { value: `${role}@feirae.test` },
  });
  fireEvent.change(screen.getByPlaceholderText(/digite sua senha/i), {
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
    expect(window.location.hash).toBe("#/cliente/produtos");
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

  it("shows the demonstration account identity instead of visitor", () => {
    render(<App />);
    loginAs("cliente");
    fireEvent.click(screen.getByRole("button", { name: /^perfil$/i }));
    expect(screen.getByRole("heading", { name: /olá, cliente/i })).toBeInTheDocument();
    expect(screen.getByText(/cliente@feirae\.test/i)).toBeInTheDocument();
  });

  it("allows showing and hiding the password", () => {
    render(<App />);
    const password = screen.getByPlaceholderText(/digite sua senha/i);
    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: /mostrar senha/i }));
    expect(password).toHaveAttribute("type", "text");
  });

  it("keeps featured fairs inside the fairs area", () => {
    render(<App />);
    loginAs("cliente");
    expect(screen.queryByRole("heading", { name: /feiras em destaque/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /^feiras$/i })[0]);
    expect(screen.getByRole("heading", { name: /feiras em destaque/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /outras feiras/i })).toBeInTheDocument();
  });

  it("lists all registered fair regions and filters fairs when the region changes", () => {
    render(<App />);
    loginAs("cliente");
    fireEvent.click(screen.getAllByRole("button", { name: /^feiras$/i })[0]);

    const regionSelect = screen.getByLabelText(/cidade\/região/i);
    expect(screen.getByRole("option", { name: "Gama" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Taguatinga" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Samambaia" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Fercal" })).toBeInTheDocument();

    fireEvent.change(regionSelect, { target: { value: "Ceilândia" } });

    expect(screen.getByRole("heading", { name: /^feiras em ceilândia$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /feira da guariroba/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /feira do produtor rural/i })).not.toBeInTheDocument();
  });

  it("opens the selected order details with its own id and status", () => {
    window.localStorage.setItem(
      "feirae:orders",
      JSON.stringify([
        { id: "FE-1029", date: "21/09/2026", status: "Recebido", value: 65.8 },
        { id: "FE-1024", date: "20/09/2026", status: "Em rota", value: 58.7 },
      ]),
    );

    render(<App />);
    loginAs("cliente");
    fireEvent.click(screen.getAllByRole("button", { name: /^pedidos$/i })[0]);

    const orderCard = screen.getByText("FE-1029").closest("article");
    expect(orderCard).not.toBeNull();
    fireEvent.click(within(orderCard as HTMLElement).getByRole("button", { name: /ver detalhes/i }));

    expect(screen.getByText(/pedido fe-1029 · recebido/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^pedido recebido$/i })).toBeInTheDocument();
    expect(screen.queryByText(/seu pedido está a caminho/i)).not.toBeInTheDocument();
  });
});

describe("Feiraê role access", () => {
  it("discards an obsolete or invalid saved profile", () => {
    window.localStorage.setItem(
      "feirae:session",
      JSON.stringify({ role: "admin", email: "admin@feirae.test", name: "Admin" }),
    );
    render(<App />);
    expect(screen.getByRole("heading", { name: /como você vai usar o aplicativo/i })).toBeInTheDocument();
  });

  it("opens the vendor experience selected at login", () => {
    render(<App />);
    loginAs("feirante");
    expect(screen.getByRole("heading", { name: /painel do feirante/i })).toBeInTheDocument();
    expect(screen.queryByText(/minha feira/i)).not.toBeInTheDocument();
  });

  it("lets the vendor manage products and inventory in the demo", () => {
    render(<App />);
    loginAs("feirante");
    fireEvent.click(screen.getByRole("button", { name: /abrir central operacional/i }));
    fireEvent.click(screen.getByRole("button", { name: /^produtos$/i }));
    expect(screen.getByText(/30 unidades disponíveis/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /voltar para central/i }));
    fireEvent.click(screen.getByRole("button", { name: /^estoque$/i }));
    expect(screen.getAllByRole("button", { name: "+" }).length).toBeGreaterThan(0);
  });

  it("opens the delivery experience selected at login", () => {
    render(<App />);
    loginAs("entregador");
    expect(screen.getByRole("heading", { name: /central do entregador/i })).toBeInTheDocument();
  });

  it("lets the delivery person accept and advance a delivery", () => {
    render(<App />);
    loginAs("entregador");
    fireEvent.click(screen.getByRole("button", { name: /abrir central operacional/i }));
    fireEvent.click(screen.getByRole("button", { name: /^entregas$/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /aceitar/i })[0]);
    expect(screen.getByText(/entrega em andamento/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /ir para a banca/i }));
    expect(screen.getByRole("button", { name: /confirmar coleta/i })).toBeInTheDocument();
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
