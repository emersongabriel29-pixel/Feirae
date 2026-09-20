import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("Feiraê customer flow", () => {
  it("opens the catalog from the home page", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /explorar produtos/i }));
    expect(screen.getByRole("heading", { name: /produtos da feira/i })).toBeInTheDocument();
  });

  it("completes the local demo checkout without leaving a blank screen", () => {
    render(<App />);
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
