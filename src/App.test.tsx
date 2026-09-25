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

  it("shows CPF, birth date and address fields in the customer account", () => {
    render(<App />);
    loginAs("cliente");
    fireEvent.click(screen.getByRole("button", { name: /^perfil$/i }));
    fireEvent.click(screen.getByRole("button", { name: /minha conta/i }));

    expect(screen.getByLabelText(/^cpf$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/data de nascimento/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^cep$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^endereço$/i)).toBeInTheDocument();
  });

  it("uses structured address fields and does not promise delivery before calculation", () => {
    render(<App />);
    loginAs("cliente");
    fireEvent.click(screen.getByRole("button", { name: /^perfil$/i }));
    fireEvent.click(screen.getByRole("button", { name: /meus endereços/i }));
    fireEvent.click(screen.getByRole("button", { name: /adicionar endereço/i }));

    expect(screen.getByLabelText(/^cep$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^estado$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cidade\/região/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bairro\/setor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rua\/quadra/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/número\/lote/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/complemento/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ponto de referência/i)).toBeInTheDocument();

    expect(screen.queryByText(/taxa estimada r\$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/complete o endereço/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^cep$/i), { target: { value: "73300-000" } });
    fireEvent.change(screen.getByLabelText(/cidade\/região/i), { target: { value: "Planaltina" } });
    fireEvent.change(screen.getByLabelText(/rua\/quadra/i), { target: { value: "Quadra 1" } });
    fireEvent.change(screen.getByLabelText(/número\/lote/i), { target: { value: "10" } });

    expect(screen.getByText(/endereço pronto para validação/i)).toBeInTheDocument();
    expect(screen.getByText(/calculados no checkout/i)).toBeInTheDocument();
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
    expect(screen.getByText(/30 cesta\(s\)/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /editar r\$/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /editar produto/i })[0]);
    expect(screen.getByLabelText(/foto principal/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/categoria/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/unidade de venda/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/peso logístico/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    fireEvent.click(screen.getByRole("button", { name: /voltar para central/i }));
    fireEvent.click(screen.getByRole("button", { name: /^estoque$/i }));
    expect(screen.getAllByRole("button", { name: "+" }).length).toBeGreaterThan(0);
    expect(screen.getByText(/alertas abaixo do mínimo/i)).toBeInTheDocument();
  });

  it("gives the vendor a personal account form separate from the stall", () => {
    render(<App />);
    loginAs("feirante");
    fireEvent.click(screen.getByRole("button", { name: /abrir central operacional/i }));
    fireEvent.click(screen.getByRole("button", { name: /^conta$/i }));

    expect(screen.getByRole("heading", { name: /^minha conta$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^cpf$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tipo de cadastro/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cnpj/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/chave pix/i)).toBeInTheDocument();
  });

  it("keeps the vendor order flow sequential and hands delivery stages to the driver", () => {
    render(<App />);
    loginAs("feirante");
    fireEvent.click(screen.getByRole("button", { name: /abrir central operacional/i }));
    fireEvent.click(screen.getByRole("button", { name: /^pedidos$/i }));

    const firstOrder = screen.getByText(/FE-1027 · Dona Marta/i).closest("article");
    expect(firstOrder).not.toBeNull();
    fireEvent.click(within(firstOrder as HTMLElement).getByRole("button", { name: /abrir pedido/i }));

    expect(screen.getByRole("button", { name: /aceitar pedido/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /coletado/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /aceitar pedido/i }));

    screen.getAllByRole("button", { name: /marcar separado/i }).forEach((button) => fireEvent.click(button));
    fireEvent.click(screen.getByRole("button", { name: /marcar pedido como pronto/i }));

    expect(screen.getByText(/aguardando entregador/i)).toBeInTheDocument();
    expect(screen.getByText(/coleta, rota e entrega pertencem ao fluxo do entregador/i)).toBeInTheDocument();
  });

  it("opens real bank editing instead of inert cards", () => {
    render(<App />);
    loginAs("feirante");
    fireEvent.click(screen.getByRole("button", { name: /abrir central operacional/i }));
    fireEvent.click(screen.getByRole("button", { name: /minha banca/i }));
    fireEvent.click(screen.getByRole("button", { name: /editar banca/i }));

    expect(screen.getByLabelText(/nome da banca/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^feira$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/box\/banca/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/foto de capa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^logo$/i)).toBeInTheDocument();
  });

  it("uses the selected fair official schedule and allows custom day-by-day hours", () => {
    render(<App />);
    loginAs("feirante");
    fireEvent.click(screen.getByRole("button", { name: /abrir central operacional/i }));
    fireEvent.click(screen.getByRole("button", { name: /^horários$/i }));

    expect(screen.getByText(/segunda e quinta · 19h–2h/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /definir meu próprio horário/i }));

    expect(screen.getAllByLabelText(/^abertura$/i).length).toBe(7);
    expect(screen.getAllByLabelText(/^fechamento$/i).length).toBe(7);
    expect(screen.getAllByRole("button", { name: /^aberto$/i }).length).toBeGreaterThan(0);
  });

  it("configures delivery, pickup and vendor-sponsored free shipping without a fixed 20 kg rule", () => {
    render(<App />);
    loginAs("feirante");
    fireEvent.click(screen.getByRole("button", { name: /abrir central operacional/i }));
    fireEvent.click(screen.getByRole("button", { name: /entrega\/retirada/i }));

    expect(screen.queryByText(/até 20 kg para moto/i)).not.toBeInTheDocument();
    expect(screen.getByText(/capacidade real disponível/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /frete grátis pago pela banca/i })).toBeInTheDocument();
  });

  it("explains vendor receiving status and keeps real fees unconfigured", () => {
    render(<App />);
    loginAs("feirante");
    fireEvent.click(screen.getByRole("button", { name: /abrir central operacional/i }));
    fireEvent.click(screen.getByRole("button", { name: /^financeiro$/i }));

    expect(screen.getByText(/taxa feiraê/i)).toBeInTheDocument();
    expect(screen.getAllByText(/a definir/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/depende do provedor/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cadastrar destino de recebimento/i })).toBeInTheDocument();
  });

  it("keeps document uploads under review instead of treating upload as approval", () => {
    render(<App />);
    loginAs("feirante");
    fireEvent.click(screen.getByRole("button", { name: /abrir central operacional/i }));
    fireEvent.click(screen.getByRole("button", { name: /^documentos$/i }));

    expect(screen.getByText(/enviar arquivo não aprova o cadastro/i)).toBeInTheDocument();
    expect(screen.getByText(/permissão\/autorização da banca ou box/i)).toBeInTheDocument();
    expect(screen.getAllByText(/pendente de envio/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/enquanto os documentos obrigatórios não estiverem aprovados/i)).toBeInTheDocument();
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

  it("offers all delivery vehicle types with editable carrying capacity", () => {
    render(<App />);
    loginAs("entregador");
    fireEvent.click(screen.getByRole("button", { name: /abrir central operacional/i }));
    fireEvent.click(screen.getByRole("button", { name: /^veículos$/i }));
    fireEvent.click(screen.getByRole("button", { name: /cadastrar veículo/i }));

    const vehicleType = screen.getByLabelText(/tipo de veículo/i);
    expect(
      within(vehicleType).getByRole("option", { name: /bicicleta · sugestão 10 kg/i }),
    ).toBeInTheDocument();
    expect(
      within(vehicleType).getByRole("option", { name: /moto com baú · sugestão 20 kg/i }),
    ).toBeInTheDocument();
    expect(within(vehicleType).getByRole("option", { name: /carro · sugestão 80 kg/i })).toBeInTheDocument();
    expect(
      within(vehicleType).getByRole("option", { name: /utilitário\/pickup · sugestão 250 kg/i }),
    ).toBeInTheDocument();
    expect(within(vehicleType).getByRole("option", { name: /van · sugestão 500 kg/i })).toBeInTheDocument();

    fireEvent.change(vehicleType, { target: { value: "Carro" } });
    expect(screen.getByLabelText(/capacidade máxima usada no feiraê/i)).toHaveValue(80);
  });

  it("gives the delivery person a personal account with CPF and CNH fields", () => {
    render(<App />);
    loginAs("entregador");
    fireEvent.click(screen.getByRole("button", { name: /abrir central operacional/i }));
    fireEvent.click(screen.getByRole("button", { name: /^conta$/i }));

    expect(screen.getByRole("heading", { name: /^minha conta$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^cpf$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^cnh$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/categoria da cnh/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/chave pix/i)).toBeInTheDocument();
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
