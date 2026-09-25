import { FormEvent, useState } from "react";
import { ArrowLeft, CalendarClock, Check, Edit3, Package, Plus, Truck, Wallet } from "lucide-react";
import type { DemoSession } from "../../types";
import { money } from "../../utils";
import { usePersistentState } from "../../usePersistentState";
import { vendorModuleDetails } from "../../domain/operations";
import { ModuleHeader, OperationsMenu, Panel, Toggle } from "../../components/AppComponents";

export function FeiranteOperations({ session, onBack }: { session: DemoSession; onBack: () => void }) {
  const modules = [
    "Painel",
    "Pedidos",
    "Minha banca",
    "Produtos",
    "Estoque",
    "Horários",
    "Entrega/retirada",
    "Promoções",
    "Financeiro",
    "Avaliações",
    "Conta",
    "Documentos",
  ];
  const [active, setActive] = useState("Central");
  const [status, setStatus] = useState("Recebido");
  const [storeOpen, setStoreOpen] = useState(true);
  const [promotionActive, setPromotionActive] = useState(false);
  const [promotionTool, setPromotionTool] = useState<"combo" | "horario" | "cupom">("combo");
  const [customHours, setCustomHours] = useState(false);
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [accountSaved, setAccountSaved] = useState(false);
  const [vendorAccount, setVendorAccount] = usePersistentState(`feirae:vendor-account:${session.email}`, {
    name: session.name,
    cpf: "",
    birthDate: "",
    email: session.email,
    phone: "",
    pixKey: "",
    businessType: "Pessoa física",
    cnpj: "",
    responsibleDocument: "",
  });
  const [vendorItems, setVendorItems] = useState([
    { id: 1, name: "Cesta de frutas", stock: 30, active: true, price: 24.9, weightKg: 4, unit: "cesta" },
    { id: 9, name: "Tomate orgânico", stock: 4, active: true, price: 8.9, weightKg: 1, unit: "kg" },
    { id: 11, name: "Cheiro-verde", stock: 0, active: false, price: 4.5, weightKg: 0.2, unit: "maço" },
  ]);

  function updateItem(id: number, update: Partial<(typeof vendorItems)[number]>) {
    setVendorItems((current) => current.map((item) => (item.id === id ? { ...item, ...update } : item)));
  }
  function addVendorItem(event: FormEvent) {
    event.preventDefault();
    if (!productName.trim()) return;
    setVendorItems((current) => [
      ...current,
      {
        id: Date.now(),
        name: productName.trim(),
        stock: 1,
        active: true,
        price: 0,
        weightKg: 1,
        unit: "unidade",
      },
    ]);
    setProductName("");
    setNewProductOpen(false);
  }

  const inventory = (
    <div className="operation-list">
      {vendorItems.map((item) => (
        <article key={item.id}>
          <span className={item.stock <= 4 ? "inventory-dot warning" : "inventory-dot"} />
          <div>
            <b>{item.name}</b>
            <small>
              {item.stock
                ? `${item.stock} unidades disponíveis · ${item.stock} ${item.unit}(s) · ${money(item.price)} · ${item.weightKg} kg`
                : "Produto esgotado"}
            </small>
          </div>
          {active === "Estoque" ? (
            <div className="stock-controls">
              <button onClick={() => updateItem(item.id, { stock: Math.max(0, item.stock - 1) })}>−</button>
              <strong>{item.stock}</strong>
              <button onClick={() => updateItem(item.id, { stock: item.stock + 1, active: true })}>+</button>
            </div>
          ) : (
            <div className="item-actions">
              <button className="mini-toggle" onClick={() => updateItem(item.id, { price: item.price + 1 })}>
                Editar R$
              </button>
              <button
                className={item.active ? "mini-toggle active" : "mini-toggle"}
                onClick={() => updateItem(item.id, { active: !item.active })}
              >
                {item.active ? "À venda" : "Pausado"}
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
  return (
    <Panel title="Operação do feirante" subtitle="Dados locais demonstrativos" onBack={onBack}>
      {active === "Central" ? (
        <div className="ops-home">
          <div className="ops-summary">
            <div>
              <span className="eyebrow">Central</span>
              <h2>Escolha o que deseja gerenciar</h2>
              <p>Pedidos, produtos, horários, documentos e financeiro ficam em telas separadas.</p>
            </div>
            <div className="operation-metrics">
              <article>
                <strong>{storeOpen ? "Aberta" : "Fechada"}</strong>
                <span>Sítio da Vó · Banca 18</span>
              </article>
              <article>
                <strong>3</strong>
                <span>pedidos pendentes</span>
              </article>
              <article>
                <strong>4,9 ★</strong>
                <span>avaliação média</span>
              </article>
            </div>
          </div>
          <OperationsMenu modules={modules} details={vendorModuleDetails} onOpen={setActive} />
        </div>
      ) : (
        <div className="module-screen">
          <button className="back-button" onClick={() => setActive("Central")}>
            <ArrowLeft size={17} /> Voltar para central
          </button>
          <div className="surface-card operation-card">
            <span className="eyebrow">{active}</span>
            <h2>
              {active === "Pedidos" ? "Pedido FE-1027" : `Gerenciar ${active.toLocaleLowerCase("pt-BR")}`}
            </h2>
            {active === "Painel" ? (
              <div className="operation-metrics">
                <article>
                  <strong>{storeOpen ? "Aberta" : "Fechada"}</strong>
                  <span>Sítio da Vó · Banca 18</span>
                </article>
                <article>
                  <strong>4,9 ★</strong>
                  <span>média de 126 avaliações</span>
                </article>
                <article>
                  <strong>2</strong>
                  <span>produtos com estoque baixo</span>
                </article>
              </div>
            ) : active === "Pedidos" ? (
              <>
                <ModuleHeader
                  badge="Pedido em preparo"
                  title="FE-1027 · Dona Marta"
                  description="3 itens · R$ 86,80 · Planaltina · retirada prevista em 18 minutos"
                />
                <div className="module-kpi-strip">
                  <article>
                    <strong>8,4 kg</strong>
                    <span>peso estimado</span>
                  </article>
                  <article>
                    <strong>Moto</strong>
                    <span>veículo compatível</span>
                  </article>
                  <article>
                    <strong>R$ 12,80</strong>
                    <span>entrega prevista</span>
                  </article>
                </div>
                <div className="module-action-row">
                  {["Recebido", "Preparando", "Pronto para coleta", "Coletado"].map((item) => (
                    <button
                      key={item}
                      onClick={() => setStatus(item)}
                      className={status === item ? "status-button active" : "status-button"}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="operation-list detailed">
                  {[
                    "Cesta de frutas · 1 cesta · 4 kg",
                    "Tomate orgânico · 2 kg",
                    "Cheiro-verde · 2 maços",
                  ].map((item) => (
                    <article key={item}>
                      <Package />
                      <div>
                        <b>{item}</b>
                        <small>Separar, conferir peso e embalar antes da coleta.</small>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="cancel-panel">
                  <b>Cancelar pedido</b>
                  <select>
                    <option>Item indisponível</option>
                    <option>Banca fechou mais cedo</option>
                    <option>Peso acima do combinado</option>
                    <option>Cliente solicitou cancelamento</option>
                  </select>
                </div>
              </>
            ) : active === "Produtos" ? (
              <>
                <button className="primary-action" onClick={() => setNewProductOpen((value) => !value)}>
                  <Plus size={17} /> Adicionar produto
                </button>
                {newProductOpen && (
                  <form className="form-card" onSubmit={addVendorItem}>
                    <label>
                      Nome do produto
                      <input
                        value={productName}
                        onChange={(event) => setProductName(event.target.value)}
                        required
                      />
                    </label>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <label>
                        Preço
                        <input placeholder="R$ 0,00" />
                      </label>
                      <label>
                        Peso
                        <input placeholder="kg por unidade" />
                      </label>
                      <label>
                        Unidade
                        <input placeholder="kg, maço, cesta" />
                      </label>
                    </div>
                    <button className="primary-action" type="submit">
                      Salvar produto
                    </button>
                  </form>
                )}
                {inventory}
              </>
            ) : active === "Estoque" ? (
              <>
                <ModuleHeader
                  badge="Controle rápido"
                  title="Estoque da banca"
                  description="Ajuste quantidade, pause item esgotado e evite venda sem produto."
                />
                <div className="module-kpi-strip">
                  <article>
                    <strong>34</strong>
                    <span>itens disponíveis</span>
                  </article>
                  <article>
                    <strong>2</strong>
                    <span>alertas de baixo estoque</span>
                  </article>
                  <article>
                    <strong>1</strong>
                    <span>produto pausado</span>
                  </article>
                </div>
                {inventory}
              </>
            ) : active === "Minha banca" ? (
              <>
                <ModuleHeader
                  badge="Perfil público"
                  title="Sítio da Vó · Banca 18"
                  description="Feira do Produtor, Planaltina. Hortifruti, cestas e produtos selecionados."
                />
                <div className="vendor-profile-card">
                  <span>🥬</span>
                  <div>
                    <b>Banca verificada</b>
                    <small>Box 18 · abre seg., qua. e sáb. · avaliação 4,9</small>
                  </div>
                  <button
                    className={storeOpen ? "status-button active" : "status-button"}
                    onClick={() => setStoreOpen((value) => !value)}
                  >
                    {storeOpen ? "Aberta" : "Fechada"}
                  </button>
                </div>
                <div className="operation-list detailed">
                  {[
                    "Editar nome, logo e foto da banca",
                    "Atualizar feira, corredor, box e ponto de referência",
                    "Definir categorias: hortifruti, orgânicos e cestas",
                  ].map((item) => (
                    <article key={item}>
                      <Edit3 />
                      <div>
                        <b>{item}</b>
                        <small>Essas informações aparecem para o cliente antes da compra.</small>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : active === "Horários" ? (
              <div className="space-y-3">
                <ModuleHeader
                  badge="Agenda da banca"
                  title="Horários de venda"
                  description="Use o horário oficial da feira ou informe os dias que sua banca realmente estará aberta."
                />
                <Toggle
                  label="Usar horário padrão da feira"
                  description="Feira do Produtor · segunda e quinta · 19h-2h"
                  checked={!customHours}
                  onChange={(checked) => setCustomHours(!checked)}
                />
                <Toggle
                  label="Definir meu próprio horário"
                  description="Escolher dias, abertura, fechamento, pausas e exceções"
                  checked={customHours}
                  onChange={setCustomHours}
                />
                {customHours && (
                  <div className="operation-list">
                    {["Segunda · 8h-17h", "Quarta · 8h-17h", "Sábado · 7h-14h"].map((schedule) => (
                      <article key={schedule}>
                        <CalendarClock />
                        <div>
                          <b>{schedule}</b>
                          <small>Aberto com horário próprio da banca</small>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ) : active === "Entrega/retirada" ? (
              <>
                <ModuleHeader
                  badge="Logística"
                  title="Entrega e retirada"
                  description="Defina como o pedido sai da banca e quais limites entram no cálculo da corrida."
                />
                <div className="operation-list detailed">
                  {[
                    [
                      "Entrega Feiraê",
                      "Ativa · entregador recebe peso, volume, rota e ganho antes de aceitar.",
                    ],
                    ["Retirada na banca", "Cliente vê box, ponto de referência e horário de retirada."],
                    ["Limite por pedido", "Até 20 kg para moto com baú; acima disso, direciona para carro."],
                  ].map(([title, text]) => (
                    <article key={title}>
                      <Truck />
                      <div>
                        <b>{title}</b>
                        <small>{text}</small>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : active === "Promoções" ? (
              <>
                <ModuleHeader
                  badge="Campanhas"
                  title="Promoções da banca"
                  description="Monte ofertas simples para aparecer em destaques, vitrine e recompra."
                />
                <div className="promo-card">
                  <span>🍎</span>
                  <div>
                    <b>10% na cesta de frutas</b>
                    <small>Válida até domingo · aparece em Destaques da feira</small>
                  </div>
                  <button
                    className={promotionActive ? "status-button active" : "status-button"}
                    onClick={() => setPromotionActive((value) => !value)}
                  >
                    {promotionActive ? "Ativa" : "Ativar"}
                  </button>
                </div>
                <div className="module-action-row">
                  <button
                    className={promotionTool === "combo" ? "status-button active" : "status-button"}
                    onClick={() => setPromotionTool("combo")}
                  >
                    Criar combo
                  </button>
                  <button
                    className={promotionTool === "horario" ? "status-button active" : "status-button"}
                    onClick={() => setPromotionTool("horario")}
                  >
                    Oferta por horário
                  </button>
                  <button
                    className={promotionTool === "cupom" ? "status-button active" : "status-button"}
                    onClick={() => setPromotionTool("cupom")}
                  >
                    Cupom da banca
                  </button>
                </div>
                <form className="form-card compact">
                  {promotionTool === "combo" && (
                    <>
                      <label>
                        Nome do combo
                        <input defaultValue="Combo salada da semana" />
                      </label>
                      <label>
                        Itens
                        <input defaultValue="Tomate orgânico + cheiro-verde + alface" />
                      </label>
                    </>
                  )}
                  {promotionTool === "horario" && (
                    <>
                      <label>
                        Janela da oferta
                        <input defaultValue="Sábado · 7h às 10h" />
                      </label>
                      <label>
                        Desconto
                        <input defaultValue="15%" />
                      </label>
                    </>
                  )}
                  {promotionTool === "cupom" && (
                    <>
                      <label>
                        Código do cupom
                        <input defaultValue="SITIO10" />
                      </label>
                      <label>
                        Regra
                        <input defaultValue="10% acima de R$ 50,00" />
                      </label>
                    </>
                  )}
                  <button type="button" className="primary-action">
                    Salvar campanha
                  </button>
                </form>
              </>
            ) : active === "Financeiro" ? (
              <>
                <ModuleHeader
                  badge="Receitas e custos"
                  title="Financeiro da banca"
                  description="Visão de vendas, taxas, custos estimados e valores a receber."
                />
                <div className="operation-metrics">
                  <article>
                    <strong>R$ 1.842,30</strong>
                    <span>vendas no mês</span>
                  </article>
                  <article>
                    <strong>R$ 286,40</strong>
                    <span>a receber</span>
                  </article>
                  <article>
                    <strong>24</strong>
                    <span>pedidos concluídos</span>
                  </article>
                </div>
                <div className="finance-breakdown">
                  {[
                    ["Vendas brutas", "R$ 1.842,30"],
                    ["Taxa Feiraê demonstrativa", "R$ 92,10"],
                    ["Entrega repassada ao entregador", "R$ 214,60"],
                    ["Previsão de repasse", "R$ 1.535,60"],
                  ].map(([label, value]) => (
                    <p key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </p>
                  ))}
                </div>
              </>
            ) : active === "Avaliações" ? (
              <>
                <ModuleHeader
                  badge="Reputação"
                  title="Avaliações recebidas"
                  description="Média em cima, avaliações individuais embaixo, separadas por cliente, produto e entrega."
                />
                <div className="review-grid compact">
                  {[
                    ["Cliente", "4,9", "Produtos frescos e entrega cuidadosa."],
                    ["Entregador", "5,0", "Pedido pronto no horário combinado."],
                    ["Produto", "4,8", "Cesta bem montada e peso correto."],
                  ].map(([source, rating, text]) => (
                    <article className="review-card" key={source}>
                      <strong>{rating} ★</strong>
                      <div>
                        <b>{source}</b>
                        <small>{text}</small>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : active === "Conta" ? (
              <>
                <ModuleHeader
                  badge="Dados pessoais"
                  title="Minha conta"
                  description="Dados do responsável pela banca, contato, repasse e identificação."
                />
                <form
                  className="form-card"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setAccountSaved(true);
                    window.setTimeout(() => setAccountSaved(false), 2200);
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label>
                      Nome completo
                      <input
                        value={vendorAccount.name}
                        onChange={(event) =>
                          setVendorAccount((current) => ({ ...current, name: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      CPF
                      <input
                        value={vendorAccount.cpf}
                        onChange={(event) =>
                          setVendorAccount((current) => ({ ...current, cpf: event.target.value }))
                        }
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                      />
                    </label>
                    <label>
                      Data de nascimento
                      <input
                        type="date"
                        value={vendorAccount.birthDate}
                        onChange={(event) =>
                          setVendorAccount((current) => ({ ...current, birthDate: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Telefone
                      <input
                        value={vendorAccount.phone}
                        onChange={(event) =>
                          setVendorAccount((current) => ({ ...current, phone: event.target.value }))
                        }
                        placeholder="(61) 99999-9999"
                      />
                    </label>
                  </div>
                  <label>
                    E-mail
                    <input
                      type="email"
                      value={vendorAccount.email}
                      onChange={(event) =>
                        setVendorAccount((current) => ({ ...current, email: event.target.value }))
                      }
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label>
                      Tipo de cadastro
                      <select
                        value={vendorAccount.businessType}
                        onChange={(event) =>
                          setVendorAccount((current) => ({ ...current, businessType: event.target.value }))
                        }
                      >
                        <option>Pessoa física</option>
                        <option>Pessoa jurídica</option>
                      </select>
                    </label>
                    <label>
                      CNPJ (se houver)
                      <input
                        value={vendorAccount.cnpj}
                        onChange={(event) =>
                          setVendorAccount((current) => ({ ...current, cnpj: event.target.value }))
                        }
                        placeholder="00.000.000/0000-00"
                      />
                    </label>
                    <label>
                      Chave Pix para repasse
                      <input
                        value={vendorAccount.pixKey}
                        onChange={(event) =>
                          setVendorAccount((current) => ({ ...current, pixKey: event.target.value }))
                        }
                        placeholder="CPF, e-mail, telefone ou chave"
                      />
                    </label>
                    <label>
                      Documento do responsável
                      <input
                        value={vendorAccount.responsibleDocument}
                        onChange={(event) =>
                          setVendorAccount((current) => ({
                            ...current,
                            responsibleDocument: event.target.value,
                          }))
                        }
                        placeholder="RG/CNH"
                      />
                    </label>
                  </div>
                  {accountSaved && <p className="inline-success">Dados da conta salvos neste dispositivo.</p>}
                  <button className="primary-action" type="submit">
                    <Edit3 size={17} /> Salvar alterações
                  </button>
                </form>
              </>
            ) : active === "Documentos" ? (
              <>
                <ModuleHeader
                  badge="Cadastro"
                  title="Documentação e validação"
                  description="Antes de vender de verdade, a banca precisa passar pela conferência."
                />
                <div className="operation-list detailed">
                  {[
                    ["Documento do responsável", "Aprovado"],
                    ["Comprovante da banca/box", "Pendente de envio"],
                    ["Validação de feirante", "Em análise"],
                  ].map(([doc, statusText]) => (
                    <article key={doc}>
                      <Check />
                      <div>
                        <b>{doc}</b>
                        <small>Necessário para vender e receber repasses.</small>
                      </div>
                      <span className="document-status">{statusText}</span>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="operation-list">
                {[
                  "R$ 1.842,30 em vendas no mês",
                  "R$ 286,40 a receber",
                  "Custos e taxas serão detalhados",
                ].map((item) => (
                  <article key={item}>
                    <Wallet />
                    <div>
                      <b>{item}</b>
                      <small>Financeiro da banca</small>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <p className="operation-footnote">
        Alterações locais de demonstração. A sincronização real será feita pelo Supabase.
      </p>
    </Panel>
  );
}
