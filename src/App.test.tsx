import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";
import { readUnifiedOrders, upsertUnifiedOrder } from "./domain/orderBridge";

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
    fireEvent.click(screen.getByRole("button", { name: /adicionar planta ornamental/i }));
    fireEvent.click(screen.getByRole("button", { name: /abrir sacola com 1 itens/i }));
    fireEvent.click(screen.getByRole("button", { name: /continuar para checkout/i }));
    expect(screen.getByRole("heading", { name: /finalizar pedido/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retirada/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirmar pedido/i }));
    expect(screen.getByRole("heading", { name: /meus pedidos/i })).toBeInTheDocument();
    expect(screen.getByText(/recebido/i)).toBeInTheDocument();
  });

  it("shows the demonstration account identity instead of visitor", () => {
    render(<App />);
    loginAs("cliente");
    fireEvent.click(screen.getAllByRole("button", { name: /^perfil$/i })[0]);
    expect(screen.getByRole("heading", { name: /olá, cliente/i })).toBeInTheDocument();
    expect(screen.getByText(/cliente@feirae\.test/i)).toBeInTheDocument();
  });

  it("shows CPF, birth date and address fields in the customer account", () => {
    render(<App />);
    loginAs("cliente");
    fireEvent.click(screen.getAllByRole("button", { name: /^perfil$/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /minha conta/i }));

    expect(screen.getByLabelText(/^cpf$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/data de nascimento/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^cep$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^endereço$/i)).toBeInTheDocument();
  });

  it("uses structured address fields and does not promise delivery before calculation", () => {
    render(<App />);
    loginAs("cliente");
    fireEvent.click(screen.getAllByRole("button", { name: /^perfil$/i })[0]);
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

    expect(screen.getByText(/endereço pronto para salvar/i)).toBeInTheDocument();
    expect(screen.getByText(/rota e o frete usam este endereço/i)).toBeInTheDocument();
  });

  it("allows showing and hiding the password", () => {
    render(<App />);
    const password = screen.getByPlaceholderText(/digite sua senha/i);
    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: /mostrar senha/i }));
    expect(password).toHaveAttribute("type", "text");
  });

  it("rejects an incorrect password instead of ignoring it", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: "cliente@feirae.test" },
    });
    fireEvent.change(screen.getByPlaceholderText(/digite sua senha/i), {
      target: { value: "senha-errada" },
    });
    fireEvent.click(screen.getByRole("button", { name: /entrar como cliente/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/e-mail ou senha incorretos/i);
    expect(screen.getByRole("heading", { name: /como você vai usar o aplicativo/i })).toBeInTheDocument();
  });

  it("applies customer name email and password only when the account form is saved", () => {
    render(<App />);
    loginAs("cliente");
    fireEvent.click(screen.getAllByRole("button", { name: /^perfil$/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /minha conta/i }));

    fireEvent.change(screen.getByLabelText(/nome completo/i), {
      target: { value: "Cliente Atualizada" },
    });
    fireEvent.change(screen.getByLabelText(/e-mail de acesso/i), {
      target: { value: "cliente.nova@feirae.app" },
    });
    fireEvent.change(screen.getByLabelText(/nova senha/i), {
      target: { value: "nova123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /salvar alterações/i }));
    expect(screen.getByText(/alterações salvas/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /voltar/i }));
    expect(screen.getByRole("heading", { name: /olá, cliente atualizada/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /sair da conta/i }));
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: "cliente.nova@feirae.app" },
    });
    fireEvent.change(screen.getByPlaceholderText(/digite sua senha/i), {
      target: { value: "nova123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /entrar como cliente/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /^perfil$/i })[0]);
    expect(screen.getByRole("heading", { name: /olá, cliente atualizada/i })).toBeInTheDocument();
  });

  it("applies the compact cards preference to the interface", () => {
    render(<App />);
    loginAs("cliente");
    fireEvent.click(screen.getAllByRole("button", { name: /^perfil$/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /configurações/i }));

    fireEvent.click(screen.getByLabelText(/cards compactos/i));
    expect(document.documentElement).toHaveClass("compact-product-cards");
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
      "feirae:orders:cliente@feirae.test",
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

    expect(screen.getByText(/pedido fe-1029.*recebido/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^pedido recebido$/i })).toBeInTheDocument();
    expect(screen.queryByText(/seu pedido está a caminho/i)).not.toBeInTheDocument();
  });

  it("shows only vendors from the selected fair", () => {
    render(<App />);
    loginAs("cliente");

    fireEvent.change(screen.getByLabelText(/^feira$/i), {
      target: { value: "Feira do Produtor Rural" },
    });
    fireEvent.click(screen.getByRole("button", { name: /bancas/i }));

    expect(screen.getByRole("heading", { name: /bancas e feirantes/i })).toBeInTheDocument();
    expect(screen.getByText("Sítio da Vó")).toBeInTheDocument();
    expect(screen.getByText("Queijaria do Cerrado")).toBeInTheDocument();
    expect(screen.queryByText("Mãos do DF")).not.toBeInTheDocument();
  });

  it("prevents mixing products from different fairs in one cart", () => {
    render(<App />);
    loginAs("cliente");

    const search = screen.getByPlaceholderText(/busque produtos/i);
    fireEvent.change(search, { target: { value: "cesta de frutas" } });
    fireEvent.click(screen.getByRole("button", { name: /adicionar cesta de frutas/i }));

    fireEvent.change(search, { target: { value: "bolsa artesanal" } });
    fireEvent.click(screen.getByRole("button", { name: /adicionar bolsa artesanal/i }));

    expect(screen.getByText(/sua sacola é da feira do produtor rural/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /abrir sacola com 1 itens/i })).toBeInTheDocument();
  });

  it("finds products ignoring accents and clears the category constraint for global search", () => {
    render(<App />);
    loginAs("cliente");
    const search = screen.getByPlaceholderText(/busque produtos/i);

    fireEvent.change(search, { target: { value: "paes" } });

    expect(screen.getByRole("heading", { name: /resultados da busca/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /cesta de pães/i })).toBeInTheDocument();
  });

  it("uses verified fair hours in the customer fair list", () => {
    render(<App />);
    loginAs("cliente");
    fireEvent.click(screen.getAllByRole("button", { name: /^feiras$/i })[0]);

    fireEvent.change(screen.getByLabelText(/cidade\/região/i), {
      target: { value: "Gama" },
    });

    expect(screen.getByText(/ter–dom 7h–18h/i)).toBeInTheDocument();
  });

  it("offers pay-now and pay-on-delivery methods while keeping weight as an estimate", () => {
    render(<App />);
    loginAs("cliente");
    const search = screen.getByPlaceholderText(/busque produtos/i);
    fireEvent.change(search, { target: { value: "tomate orgânico" } });
    fireEvent.click(screen.getByRole("button", { name: /adicionar tomate orgânico/i }));
    fireEvent.click(screen.getByRole("button", { name: /abrir sacola com 1 itens/i }));
    fireEvent.click(screen.getByRole("button", { name: /continuar para checkout/i }));

    expect(screen.getByRole("button", { name: /pix/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /cartão/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /^dinheiro/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cartão na maquininha/i })).toBeInTheDocument();
    expect(screen.getByText(/há produtos vendidos por peso/i)).toBeInTheDocument();
    expect(screen.getByText(/total estimado/i)).toBeInTheDocument();
    expect(screen.queryByText(/veículo indicado/i)).not.toBeInTheDocument();
  });

  it("asks for complete card data but does not describe storing CVV", () => {
    render(<App />);
    loginAs("cliente");
    fireEvent.click(screen.getAllByRole("button", { name: /^perfil$/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /pagamentos e carteira/i }));
    fireEvent.click(screen.getByRole("button", { name: /adicionar/i }));

    expect(screen.getByLabelText(/nome no cartão/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/número do cartão/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/validade/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cvv/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^tipo$/i)).toBeInTheDocument();
    expect(screen.getByText(/cvv não é salvo/i)).toBeInTheDocument();
  });

  it("separates client cancellation reasons from delivery incident reasons", () => {
    window.localStorage.setItem(
      "feirae:orders:cliente@feirae.test",
      JSON.stringify([{ id: "FE-1030", date: "25/09/2026", status: "Recebido", value: 50 }]),
    );
    render(<App />);
    loginAs("cliente");
    fireEvent.click(screen.getAllByRole("button", { name: /^pedidos$/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /ver detalhes/i }));

    expect(screen.getByRole("option", { name: /não preciso mais/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /^outro$/i })).toBeInTheDocument();
    const reason = screen.getByRole("option", { name: /^outro$/i }).closest("select");
    expect(reason).not.toBeNull();
    fireEvent.change(reason as HTMLSelectElement, { target: { value: "Outro" } });
    expect(screen.getByLabelText(/descreva o motivo/i)).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /cliente ausente/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /emergência na entrega/i })).not.toBeInTheDocument();
  });

  it("builds notifications from the current order states", () => {
    render(<App />);
    loginAs("cliente");
    fireEvent.click(screen.getByRole("button", { name: /abrir notificações/i }));

    expect(screen.getByText(/fe-1024 · a caminho do cliente/i)).toBeInTheDocument();
    expect(screen.getByText(/fe-1019 · entregue/i)).toBeInTheDocument();
    expect(screen.queryByText(/novo desconto na feira/i)).not.toBeInTheDocument();
  });

  it("separates submitted reviews from delivered orders still waiting for a review", () => {
    window.localStorage.setItem(
      "feirae:orders:cliente@feirae.test",
      JSON.stringify([{ id: "FE-1031", date: "25/09/2026", status: "Entregue", value: 72 }]),
    );
    render(<App />);
    loginAs("cliente");
    fireEvent.click(screen.getAllByRole("button", { name: /^perfil$/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /minhas avaliações/i }));

    expect(screen.getByRole("heading", { name: /pedidos para avaliar/i })).toBeInTheDocument();
    expect(screen.getByText("FE-1031")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /avaliações já enviadas/i })).toBeInTheDocument();
  });

  it("completes pickup from customer checkout through vendor handoff to delivered", () => {
    render(<App />);
    loginAs("cliente");

    const search = screen.getByPlaceholderText(/busque produtos/i);
    fireEvent.change(search, { target: { value: "cesta de frutas" } });
    fireEvent.click(screen.getByRole("button", { name: /adicionar cesta de frutas/i }));
    fireEvent.click(screen.getByRole("button", { name: /abrir sacola com 1 itens/i }));
    fireEvent.click(screen.getByRole("button", { name: /continuar para checkout/i }));
    fireEvent.click(screen.getByRole("button", { name: /retirada/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirmar pedido/i }));

    const created = readUnifiedOrders("cliente@feirae.test")[0];
    expect(created.fulfillment).toBe("pickup");
    expect(created.status).toBe("received");

    fireEvent.click(screen.getAllByRole("button", { name: /^perfil$/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /sair da conta/i }));
    loginAs("feirante");
    fireEvent.click(screen.getAllByRole("button", { name: /^pedidos$/i })[0]);

    const createdOrderCard = screen
      .getAllByText(new RegExp(created.id, "i"))
      .map((node) => node.closest("article"))
      .find(
        (article): article is HTMLElement =>
          Boolean(article) &&
          Boolean(within(article as HTMLElement).queryByRole("button", { name: /abrir pedido/i })),
      );
    expect(createdOrderCard).toBeTruthy();
    fireEvent.click(within(createdOrderCard as HTMLElement).getByRole("button", { name: /abrir pedido/i }));
    fireEvent.click(screen.getByRole("button", { name: /aceitar pedido/i }));
    screen.getAllByRole("button", { name: /marcar separado/i }).forEach((button) => fireEvent.click(button));
    fireEvent.click(screen.getByRole("button", { name: /marcar pedido como pronto/i }));
    expect(screen.getByText(/pronto para o cliente/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /confirmar retirada pelo cliente/i }));

    expect(readUnifiedOrders().find((order) => order.id === created.id)?.status).toBe("delivered");
  });

  it("makes WhatsApp consent explicit and optional", () => {
    render(<App />);
    loginAs("cliente");
    fireEvent.click(screen.getAllByRole("button", { name: /^perfil$/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /configurações/i }));

    expect(
      screen.getByRole("checkbox", { name: /autorizo receber mensagens do feiraê via whatsapp/i }),
    ).toBeInTheDocument();
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
    expect(screen.getByRole("heading", { name: /operação do feirante/i })).toBeInTheDocument();
    expect(screen.queryByText(/minha feira/i)).not.toBeInTheDocument();
  });

  it("lets the vendor manage products and inventory in the demo", () => {
    render(<App />);
    loginAs("feirante");
    fireEvent.click(screen.getAllByRole("button", { name: /^produtos$/i })[0]);
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
    fireEvent.click(screen.getAllByRole("button", { name: /^pedidos$/i })[0]);

    const firstOrder = screen.getByText(/FE-1027 · Dona Marta/i).closest("article");
    expect(firstOrder).not.toBeNull();
    fireEvent.click(within(firstOrder as HTMLElement).getByRole("button", { name: /abrir pedido/i }));

    expect(screen.getByRole("button", { name: /aceitar pedido/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /coletado/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /aceitar pedido/i }));

    screen.getAllByRole("button", { name: /marcar separado/i }).forEach((button) => fireEvent.click(button));
    fireEvent.click(screen.getByRole("button", { name: /marcar pedido como pronto/i }));

    expect(screen.getByText(/aguardando entregador/i)).toBeInTheDocument();
    expect(screen.getByText(/sua parte está pronta/i)).toBeInTheDocument();
    expect(screen.getByText(/todas as bancas do pedido/i)).toBeInTheDocument();
  });

  it("can discard bank edits without changing the saved public profile", () => {
    render(<App />);
    loginAs("feirante");
    fireEvent.click(screen.getByRole("button", { name: /minha banca/i }));
    fireEvent.click(screen.getByRole("button", { name: /editar banca/i }));

    fireEvent.change(screen.getByLabelText(/nome da banca/i), {
      target: { value: "Nome que não deve salvar" },
    });
    fireEvent.click(screen.getByRole("button", { name: /cancelar alterações/i }));

    expect(screen.getByRole("heading", { name: /sítio da vó/i })).toBeInTheDocument();
    expect(screen.queryByText(/nome que não deve salvar/i)).not.toBeInTheDocument();
  });

  it("opens real bank editing instead of inert cards", () => {
    render(<App />);
    loginAs("feirante");
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
    fireEvent.click(screen.getByRole("button", { name: /entrega\/retirada/i }));

    expect(screen.queryByText(/até 20 kg para moto/i)).not.toBeInTheDocument();
    expect(screen.getByText(/capacidade real disponível/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /frete grátis pago pela banca/i })).toBeInTheDocument();
  });

  it("explains vendor receiving status and keeps real fees unconfigured", () => {
    render(<App />);
    loginAs("feirante");
    fireEvent.click(screen.getByRole("button", { name: /^financeiro$/i }));

    expect(screen.getByText(/taxa feiraê/i)).toBeInTheDocument();
    expect(screen.getAllByText(/não configurada/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/valor bruto antes de taxas\/repasses reais/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /cadastrar destino de recebimento/i })).toBeInTheDocument();
  });

  it("keeps document uploads under review instead of treating upload as approval", () => {
    render(<App />);
    loginAs("feirante");
    fireEvent.click(screen.getByRole("button", { name: /^documentos$/i }));

    expect(screen.getByText(/enviar arquivo não aprova o cadastro/i)).toBeInTheDocument();
    expect(screen.getByText(/permissão\/autorização da banca ou box/i)).toBeInTheDocument();
    expect(screen.getAllByText(/pendente de envio/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/enquanto os documentos obrigatórios não estiverem aprovados/i),
    ).toBeInTheDocument();
  });

  it("does not auto-approve a real vendor when document storage is missing", () => {
    const email = "feirante.auditoria@feirae.app";
    window.localStorage.removeItem("feirae:session");
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /^criar conta$/i }));
    fireEvent.click(screen.getByRole("radio", { name: /feirante/i }));
    fireEvent.change(screen.getByLabelText(/nome completo/i), {
      target: { value: "Feirante Auditoria" },
    });
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: email } });
    fireEvent.change(screen.getByPlaceholderText(/digite sua senha/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /criar conta como feirante/i }));

    fireEvent.click(screen.getByRole("button", { name: /sair/i }));
    window.localStorage.removeItem(`feirae:vendor-documents:${email}`);

    fireEvent.click(screen.getByRole("radio", { name: /feirante/i }));
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: email } });
    fireEvent.change(screen.getByPlaceholderText(/digite sua senha/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /entrar como feirante/i }));
    fireEvent.click(screen.getByRole("button", { name: /^documentos$/i }));

    expect(screen.getByText(/status: documentação pendente/i)).toBeInTheDocument();
  });

  it("opens the delivery experience selected at login", () => {
    render(<App />);
    loginAs("entregador");
    expect(screen.getByRole("heading", { name: /central do entregador/i })).toBeInTheDocument();
  });

  it("does not expose demo delivery offers to a newly created real account", () => {
    window.localStorage.removeItem("feirae:session");
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /^criar conta$/i }));
    fireEvent.click(screen.getByRole("radio", { name: /entregador/i }));
    fireEvent.change(screen.getByLabelText(/nome completo/i), {
      target: { value: "Entregador Auditoria" },
    });
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: "entregador.auditoria@feirae.app" },
    });
    fireEvent.change(screen.getByPlaceholderText(/digite sua senha/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /criar conta como entregador/i }));

    fireEvent.click(screen.getByRole("button", { name: /^entregas$/i }));
    expect(screen.queryByText("FE-1024")).not.toBeInTheDocument();
    expect(screen.getByText(/nenhuma corrida dentro dos seus filtros/i)).toBeInTheDocument();
  });

  it("lets the delivery person complete all delivery stages", () => {
    render(<App />);
    loginAs("entregador");
    fireEvent.click(screen.getByRole("button", { name: /^entregas$/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /aceitar/i })[0]);
    expect(screen.getByText(/entrega em andamento/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /ir para a banca/i }));
    expect(screen.getByRole("button", { name: /confirmar coleta/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /confirmar coleta/i }));
    expect(screen.getByRole("button", { name: /iniciar entrega/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /iniciar entrega/i }));
    expect(screen.getByRole("button", { name: /confirmar entrega/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /confirmar entrega/i }));
    expect(screen.getByText(/nenhuma entrega ativa/i)).toBeInTheDocument();
  });

  it("clears a stale active-delivery lock after the shared order is cancelled", () => {
    window.localStorage.removeItem("feirae:session");
    upsertUnifiedOrder({
      id: "FE-CANCELLED-AUDIT",
      createdAt: "2026-09-26T09:00:00-03:00",
      updatedAt: "2026-09-26T09:05:00-03:00",
      customerKey: "cliente@feirae.test",
      fairName: "Feira do Produtor Rural",
      customerName: "Cliente",
      customerCity: "Planaltina",
      customerAddress: "Planaltina, DF",
      fulfillment: "delivery",
      paymentMethod: "Pix",
      paymentStatus: "refunded",
      subtotal: 40,
      calculatedDeliveryFee: 10,
      deliverySubsidy: 0,
      customerDeliveryFee: 10,
      total: 50,
      items: [],
      vendors: [],
      status: "cancelled",
      driver: {
        driverKey: "entregador@feirae.test",
        name: "Entregador",
        vehicle: "Moto",
      },
      events: [],
    });
    window.localStorage.setItem(
      "feirae:delivery-active:entregador@feirae.test",
      JSON.stringify("FE-CANCELLED-AUDIT"),
    );
    window.localStorage.setItem("feirae:delivery-stage:entregador@feirae.test", JSON.stringify(1));

    render(<App />);
    loginAs("entregador");
    fireEvent.click(screen.getByRole("button", { name: /^entregas$/i }));

    expect(screen.getAllByRole("button", { name: /aceitar/i })[0]).toBeEnabled();
  });

  it("offers all delivery vehicle types with editable carrying capacity", () => {
    render(<App />);
    loginAs("entregador");
    fireEvent.click(screen.getByRole("button", { name: /^veículos$/i }));
    fireEvent.click(screen.getByRole("button", { name: /cadastrar veículo/i }));

    const vehicleType = screen.getByLabelText(/tipo de veículo/i);
    expect(
      within(vehicleType).getByRole("option", { name: /bicicleta · referência 10 kg/i }),
    ).toBeInTheDocument();
    expect(
      within(vehicleType).getByRole("option", { name: /moto com baú · referência 20 kg/i }),
    ).toBeInTheDocument();
    expect(
      within(vehicleType).getByRole("option", { name: /carro · referência 80 kg/i }),
    ).toBeInTheDocument();
    expect(
      within(vehicleType).getByRole("option", { name: /utilitário\/pickup · referência 250 kg/i }),
    ).toBeInTheDocument();
    expect(within(vehicleType).getByRole("option", { name: /van · referência 500 kg/i })).toBeInTheDocument();

    fireEvent.change(vehicleType, { target: { value: "Carro" } });
    expect(screen.getByLabelText(/capacidade máxima deste veículo/i)).toHaveValue(80);
  });

  it("gives the delivery person a personal account with CPF and CNH fields", () => {
    render(<App />);
    loginAs("entregador");
    fireEvent.click(screen.getByRole("button", { name: /^conta$/i }));

    expect(screen.getByRole("heading", { name: /^minha conta$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^cpf$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^cnh$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/categoria da cnh/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/chave pix/i)).toBeInTheDocument();
  });

  it("persists the typed delivery support detail in a real local protocol", () => {
    render(<App />);
    loginAs("entregador");
    fireEvent.click(screen.getByRole("button", { name: /^ajuda$/i }));

    const detail = screen.getByLabelText(/detalhe do atendimento/i);
    fireEvent.change(detail, { target: { value: "Minha mensagem específica de suporte" } });
    fireEvent.click(screen.getByRole("button", { name: /abrir atendimento/i }));

    expect(screen.getByText(/minha mensagem específica de suporte/i)).toBeInTheDocument();
    expect(screen.getAllByText(/SUP-0001/i).length).toBeGreaterThan(0);
  });

  it("lets the delivery person choose Pix or bank account for payouts", () => {
    render(<App />);
    loginAs("entregador");
    fireEvent.click(screen.getByRole("button", { name: /^conta$/i }));

    const receivingMethod = screen.getByLabelText(/forma de recebimento/i);
    expect(receivingMethod).toHaveValue("Pix");
    fireEvent.change(receivingMethod, { target: { value: "Conta bancária" } });

    expect(screen.getByLabelText(/^banco$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^agência$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^conta$/i)).toBeInTheDocument();
  });

  it("shows delivery payout states instead of a fixed Friday payout", () => {
    render(<App />);
    loginAs("entregador");
    fireEvent.click(screen.getByRole("button", { name: /^financeiro$/i }));

    expect(screen.getByText(/pendente até concluir entrega/i)).toBeInTheDocument();
    expect(screen.getByText(/disponível para saque\/repasse/i)).toBeInTheDocument();
    expect(screen.getByText(/depende do provedor/i)).toBeInTheDocument();
    expect(screen.queryByText(/sexta-feira/i)).not.toBeInTheDocument();
  });

  it("requires delivery document approval before real operation", () => {
    render(<App />);
    loginAs("entregador");
    fireEvent.click(screen.getByRole("button", { name: /^documentos$/i }));

    expect(screen.getByRole("heading", { name: /documentação e aprovação/i })).toBeInTheDocument();
    expect(screen.getByText(/criar conta ou enviar documentos não libera corridas/i)).toBeInTheDocument();
    expect(screen.getByText(/curso\/autorização de motofrete/i)).toBeInTheDocument();
    expect(screen.getByText(/cnh compatível e válida/i)).toBeInTheDocument();
    expect(screen.getByText(/crlv-e do veículo/i)).toBeInTheDocument();
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
