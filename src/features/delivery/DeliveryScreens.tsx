import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  Bike,
  Check,
  ChevronRight,
  Info,
  MapPin,
  Star,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import { deliveryModuleDetails, Empty, ModuleHeader, OperationsMenu, Panel } from "../../components/AppComponents";

export function DeliveryOperations({ onBack, onMap }: { onBack: () => void; onMap: () => void }) {
  const modules = [
    "Painel",
    "Entregas",
    "Em andamento",
    "Financeiro",
    "Veículos",
    "Forma de entrega",
    "Desempenho",
    "Notificações",
    "Ajuda",
    "Guia inicial",
    "Alertas graves",
    "Conta",
    "Vantagens",
    "Avaliações",
  ];
  const [online, setOnline] = useState(true);
  const [accepted, setAccepted] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const [cancelReason, setCancelReason] = useState("");
  const [active, setActive] = useState("Central");
  const [helpTopic, setHelpTopic] = useState("Falar com suporte");
  const [helpProtocol, setHelpProtocol] = useState("");
  const deliveries = [
    {
      id: "FE-1024",
      route: "Feira do Produtor → Planaltina",
      distance: "4,2 km",
      fee: "R$ 12,80",
      weight: 8.4,
      vehicle: "Moto",
    },
    {
      id: "FE-1025",
      route: "Feira Central → Asa Norte",
      distance: "6,8 km",
      fee: "R$ 17,40",
      weight: 16.8,
      vehicle: "Moto com baú",
    },
    {
      id: "FE-1026",
      route: "Feira da Torre → Sudoeste",
      distance: "5,1 km",
      fee: "R$ 24,20",
      weight: 31.5,
      vehicle: "Carro",
    },
  ];
  const deliveryStages = ["Ir para a banca", "Confirmar coleta", "Iniciar entrega", "Confirmar entrega"];
  const activeDelivery = deliveries.find((delivery) => delivery.id === accepted);
  const activeDeliverySection = activeDelivery ? (
    <section className="active-delivery">
      <span className="eyebrow">Entrega em andamento</span>
      <h3>{activeDelivery.id}</h3>
      <p>{activeDelivery.route}</p>
      <small>
        {activeDelivery.weight} kg · veículo indicado: {activeDelivery.vehicle}
      </small>
      <div className="delivery-progress" aria-label={`Etapa ${stage + 1} de 4`}>
        {deliveryStages.map((label, index) => (
          <span className={index <= stage ? "done" : ""} key={label}>
            {index + 1}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={onMap} className="secondary-action">
          <MapPin size={17} /> Abrir rota
        </button>
        <button
          className="primary-action"
          onClick={() => {
            if (stage === deliveryStages.length - 1) {
              setAccepted(null);
              setStage(0);
            } else setStage((value) => value + 1);
          }}
        >
          {deliveryStages[stage]} <ChevronRight size={17} />
        </button>
      </div>
      <div className="cancel-panel">
        <b>Cancelar entrega</b>
        <select value={cancelReason} onChange={(event) => setCancelReason(event.target.value)}>
          <option value="">Motivo do cancelamento</option>
          <option>Veículo com problema</option>
          <option>Peso/volume incompatível</option>
          <option>Banca atrasou a retirada</option>
          <option>Endereço inseguro ou incorreto</option>
          <option>Cliente não responde</option>
        </select>
        <button
          className="secondary-action"
          onClick={() => {
            setAccepted(null);
            setStage(0);
          }}
        >
          <XCircle size={17} /> Cancelar corrida
        </button>
      </div>
    </section>
  ) : (
    <Empty title="Nenhuma entrega ativa" text="Aceite uma entrega disponível para acompanhar as etapas." />
  );
  const deliveryList = (
    <div className="mt-6 space-y-3">
      <span className="eyebrow">Entregas disponíveis</span>
      {deliveries
        .filter((delivery) => delivery.id !== accepted)
        .map((delivery) => (
          <article className="delivery-row" key={delivery.id}>
            <span>
              <Bike />
            </span>
            <div>
              <b>
                {delivery.id} · {delivery.route}
              </b>
              <small>
                {delivery.distance} · {delivery.weight} kg · {delivery.vehicle} · ganho {delivery.fee}
              </small>
            </div>
            <button
              disabled={!online || accepted !== null}
              onClick={() => {
                setAccepted(delivery.id);
                setStage(0);
                setActive("Em andamento");
              }}
            >
              Aceitar
            </button>
          </article>
        ))}
    </div>
  );
  return (
    <Panel title="Central do entregador" subtitle="Entregas locais demonstrativas" onBack={onBack}>
      {active === "Central" ? (
        <div className="ops-home">
          <div className="ops-summary">
            <div>
              <span className="eyebrow">Central</span>
              <h2>Escolha sua próxima ação</h2>
              <p>Entregas, rota ativa, veículo, ganhos, alertas e avaliações ficam em telas próprias.</p>
            </div>
            <div className="operation-metrics">
              <article>
                <strong>{online ? "Online" : "Offline"}</strong>
                <span>disponibilidade atual</span>
              </article>
              <article>
                <strong>3</strong>
                <span>corridas disponíveis</span>
              </article>
              <article>
                <strong>R$ 54,40</strong>
                <span>ganhos previstos</span>
              </article>
            </div>
          </div>
          <OperationsMenu modules={modules} details={deliveryModuleDetails} onOpen={setActive} />
        </div>
      ) : (
        <div className="module-screen">
          <button className="back-button" onClick={() => setActive("Central")}>
            <ArrowLeft size={17} /> Voltar para central
          </button>
          <div className="surface-card operation-card">
            <span className="eyebrow">{active}</span>
            {active === "Painel" ? (
              <>
                <div className="delivery-hero">
                  <span aria-hidden="true">🛵</span>
                  <div>
                    <b>Rotas com capacidade compatível</b>
                    <p>O Feiraê só oferece corridas dentro do peso/volume aceito pelo veículo cadastrado.</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="eyebrow">Disponibilidade</span>
                    <h2>{online ? "Você está online" : "Você está offline"}</h2>
                  </div>
                  <button
                    onClick={() => setOnline((value) => !value)}
                    className={online ? "status-button active" : "status-button"}
                  >
                    {online ? "Online" : "Offline"}
                  </button>
                </div>
                <div className="operation-metrics">
                  <article>
                    <strong>3</strong>
                    <span>corridas disponíveis</span>
                  </article>
                  <article>
                    <strong>R$ 54,40</strong>
                    <span>ganhos previstos</span>
                  </article>
                  <article>
                    <strong>4,9 ★</strong>
                    <span>média após entregas</span>
                  </article>
                </div>
                {activeDelivery && activeDeliverySection}
                {deliveryList}
              </>
            ) : active === "Entregas" ? (
              <>
                <ModuleHeader
                  badge="Corridas liberadas"
                  title="Entregas compatíveis"
                  description="Cada corrida mostra rota, peso, veículo indicado e ganho antes do aceite."
                />
                {deliveryList}
              </>
            ) : active === "Em andamento" ? (
              activeDeliverySection
            ) : active === "Financeiro" ? (
              <>
                <ModuleHeader
                  badge="Repasses"
                  title="Financeiro do entregador"
                  description="Acompanhe ganhos por rota, taxa administrativa e previsão de pagamento."
                />
                <div className="operation-metrics">
                  <article>
                    <strong>R$ 186,20</strong>
                    <span>ganhos hoje</span>
                  </article>
                  <article>
                    <strong>R$ 42,50</strong>
                    <span>taxas administrativas demonstrativas</span>
                  </article>
                  <article>
                    <strong>12</strong>
                    <span>corridas concluídas na semana</span>
                  </article>
                </div>
                <div className="finance-breakdown">
                  {[
                    ["FE-1022 · Feira Central", "R$ 18,90"],
                    ["FE-1023 · Torre", "R$ 24,20"],
                    ["FE-1024 · Produtor", "R$ 12,80"],
                    ["Próximo repasse", "sexta-feira"],
                  ].map(([label, value]) => (
                    <p key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </p>
                  ))}
                </div>
              </>
            ) : active === "Veículos" || active === "Forma de entrega" ? (
              <>
                <ModuleHeader
                  badge={active === "Veículos" ? "Capacidade" : "Preferências"}
                  title={active === "Veículos" ? "Veículos cadastrados" : "Forma de entrega"}
                  description="O app filtra corridas por peso, volume, raio de atuação e tipo de veículo."
                />
                <div className="operation-list detailed">
                  {[
                    ["Moto cadastrada", "Até 12 kg · documentos em análise · baú pequeno"],
                    ["Moto com baú", "Até 20 kg · ideal para compras médias de feira"],
                    ["Carro", "Até 80 kg · compras pesadas, caixas e múltiplas bancas"],
                  ].map(([title, text]) => (
                    <article key={title}>
                      <Truck />
                      <div>
                        <b>{title}</b>
                        <small>{text}</small>
                      </div>
                      <span className="document-status">
                        {title === "Moto cadastrada" ? "Ativo" : "Opcional"}
                      </span>
                    </article>
                  ))}
                </div>
              </>
            ) : active === "Desempenho" ? (
              <>
                <ModuleHeader
                  badge="Qualidade"
                  title="Desempenho"
                  description="Indicadores que afetam prioridade de corridas, suporte e campanhas."
                />
                <div className="operation-metrics">
                  <article>
                    <strong>96%</strong>
                    <span>entregas no prazo</span>
                  </article>
                  <article>
                    <strong>4,9 ★</strong>
                    <span>avaliação média</span>
                  </article>
                  <article>
                    <strong>1</strong>
                    <span>cancelamento na semana</span>
                  </article>
                </div>
                <div className="operation-list detailed">
                  {[
                    "Pontualidade ótima",
                    "Cuidado com embalagens aprovado",
                    "Comunicação com cliente dentro do esperado",
                  ].map((item) => (
                    <article key={item}>
                      <Check />
                      <div>
                        <b>{item}</b>
                        <small>Baseado nas últimas entregas demonstrativas.</small>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : active === "Avaliações" ? (
              <>
                <ModuleHeader
                  badge="Após cada etapa"
                  title="Avaliações cruzadas"
                  description="Cliente, entregador e banca se avaliam nos momentos certos, sem poluir a tela inicial."
                />
                <div className="operation-list detailed">
                  {[
                    ["Depois da entrega", "Cliente avalia entregador e entrega."],
                    ["Depois da entrega", "Entregador avalia cliente."],
                    [
                      "Depois da coleta",
                      "Entregador avalia banca quando houver problema de preparo, embalagem ou peso.",
                    ],
                    ["Mensalmente", "Usuário pode avaliar o app uma vez por mês."],
                  ].map(([title, text]) => (
                    <article key={`${title}-${text}`}>
                      <Star />
                      <div>
                        <b>{title}</b>
                        <small>{text}</small>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : active === "Alertas graves" ? (
              <>
                <ModuleHeader
                  badge="Prioridade"
                  title="Alertas graves"
                  description="Ocorrências que precisam travar a corrida, avisar suporte ou proteger entregador e cliente."
                />
                <div className="operation-list detailed">
                  {[
                    "Acidente ou pane",
                    "Endereço inseguro",
                    "Cliente não localizado",
                    "Pedido violado ou danificado",
                  ].map((item) => (
                    <article key={item}>
                      <XCircle />
                      <div>
                        <b>{item}</b>
                        <small>Abre suporte prioritário e registra ocorrência da corrida.</small>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : active === "Notificações" ? (
              <>
                <ModuleHeader
                  badge="Avisos"
                  title="Notificações operacionais"
                  description="Central para corridas novas, alteração de rota, pagamento e mensagens do suporte."
                />
                <div className="operation-list detailed">
                  {[
                    ["Nova corrida compatível", "Feira do Produtor → Planaltina · 8,4 kg · R$ 12,80"],
                    ["Pagamento previsto", "Repasse de R$ 186,20 programado para sexta."],
                    ["Suporte respondeu", "Atualização sobre ocorrência FE-1019."],
                  ].map(([title, text]) => (
                    <article key={title}>
                      <Bell />
                      <div>
                        <b>{title}</b>
                        <small>{text}</small>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : active === "Ajuda" ? (
              <>
                <ModuleHeader
                  badge="Suporte"
                  title="Ajuda do entregador"
                  description="Atalhos para resolver problema de rota, pedido, pagamento ou segurança."
                />
                <div className="module-action-row">
                  {["Falar com suporte", "Problema no pedido", "Dúvida de repasse"].map((item) => (
                    <button
                      key={item}
                      className={helpTopic === item ? "status-button active" : "status-button"}
                      onClick={() => {
                        setHelpTopic(item);
                        setHelpProtocol("");
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <form className="form-card compact">
                  <label>
                    Assunto selecionado
                    <input value={helpTopic} readOnly />
                  </label>
                  <label>
                    Detalhe do atendimento
                    <input
                      defaultValue={
                        helpTopic === "Problema no pedido"
                          ? "Pedido com embalagem ou peso divergente"
                          : helpTopic === "Dúvida de repasse"
                            ? "Conferir taxa e data do próximo pagamento"
                            : "Preciso falar com o suporte da rota"
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="primary-action"
                    onClick={() => setHelpProtocol(`SUP-${Math.floor(1000 + Math.random() * 8000)}`)}
                  >
                    Abrir atendimento
                  </button>
                  {helpProtocol && (
                    <p className="inline-success">
                      Protocolo {helpProtocol} aberto para {helpTopic}.
                    </p>
                  )}
                </form>
                <div className="operation-list detailed">
                  {[
                    "Como confirmar coleta",
                    "O que fazer quando cliente não responde",
                    "Quando cancelar sem prejudicar desempenho",
                  ].map((item) => (
                    <article key={item}>
                      <Info />
                      <div>
                        <b>{item}</b>
                        <small>Guia rápido para atendimento em campo.</small>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : active === "Guia inicial" ? (
              <>
                <ModuleHeader
                  badge="Primeiros passos"
                  title="Começar a entregar"
                  description="Fluxo de cadastro, validação, primeira corrida e boas práticas."
                />
                <div className="timeline-list">
                  {[
                    "Criar conta e enviar documentos",
                    "Cadastrar veículo e capacidade",
                    "Ficar online e aceitar corrida compatível",
                    "Coletar, entregar e receber avaliação",
                  ].map((step, index) => (
                    <article key={step}>
                      <span>{index + 1}</span>
                      <div>
                        <b>{step}</b>
                        <small>Etapa demonstrativa para orientar o entregador.</small>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : active === "Conta" ? (
              <>
                <ModuleHeader
                  badge="Perfil validado"
                  title="Conta do entregador"
                  description="Dados pessoais, foto, telefone, documentos e status de validação."
                />
                <div className="vendor-profile-card">
                  <span>👤</span>
                  <div>
                    <b>Entregador Feiraê</b>
                    <small>Foto obrigatória · CNH/documento · telefone confirmado</small>
                  </div>
                  <span className="document-status">Em análise</span>
                </div>
                <div className="operation-list detailed">
                  {[
                    "Editar foto de perfil",
                    "Atualizar telefone e Pix de repasse",
                    "Enviar documento do veículo",
                  ].map((item) => (
                    <article key={item}>
                      <User />
                      <div>
                        <b>{item}</b>
                        <small>Essas informações impactam segurança, pagamento e suporte.</small>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : active === "Vantagens" ? (
              <>
                <ModuleHeader
                  badge="Campanhas"
                  title="Vantagens do entregador"
                  description="Benefícios, metas e comunicações especiais para quem mantém boa avaliação."
                />
                <div className="promo-card">
                  <span>🎁</span>
                  <div>
                    <b>Bônus por horário de feira</b>
                    <small>Complete 5 entregas entre 7h e 11h para liberar bônus demonstrativo.</small>
                  </div>
                  <span className="document-status">Novo</span>
                </div>
              </>
            ) : (
              <div className="operation-list">
                {[
                  `${active} do entregador`,
                  "Checklist de documentação, preferências e histórico da conta.",
                  "Próximo passo: revisar dados, salvar alterações e acompanhar status.",
                ].map((item) => (
                  <article key={item}>
                    <Info />
                    <div>
                      <b>{item}</b>
                      <small>Área operacional do entregador</small>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}
