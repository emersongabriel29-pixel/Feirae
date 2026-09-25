import { FormEvent, ReactNode, useState } from "react";
import {
  Bell,
  Bike,
  Check,
  ChevronRight,
  CreditCard,
  Edit3,
  Heart,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  Plus,
  Settings,
  Star,
  Store,
  Trash2,
  Truck,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import { categories, fairs, products, vendorMetrics } from "../../data";
import { fairHoursForName } from "../../domain/fairHours";
import type { Address, CustomerTab, DemoOrder, DemoSession, Product, Screen } from "../../types";
import { money, sortFairsByDistance } from "../../utils";
import { usePersistentState } from "../../usePersistentState";
import {
  cartWeight,
  metricForVendor,
  minutesLabel,
  productWeight,
  ratingLabel,
  vehicleForWeight,
  vendorSummaries,
} from "../../domain/marketplace";
import {
  Choice,
  Empty,
  PageHeading,
  Panel,
  QuickAction,
  SectionHeading,
  Step,
  Toggle,
} from "../../components/AppComponents";

export function HomePage({
  onTab,
  onFair,
  onVendors,
  onTracking,
}: {
  onTab: (tab: CustomerTab) => void;
  onFair: (name: string) => void;
  onVendors: () => void;
  onTracking: () => void;
}) {
  return (
    <div className="space-y-12">
      <section className="hero">
        <div className="relative z-10 max-w-2xl">
          <span className="eyebrow light">Marketplace de feiras locais</span>
          <h1>A feira que você gosta, agora mais perto.</h1>
          <p>
            Descubra produtos locais, apoie feirantes e escolha entre receber em casa ou retirar na feira.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={() => onTab("products")} className="primary-action amber">
              Explorar produtos <ChevronRight size={18} />
            </button>
            <button onClick={() => onTab("fairs")} className="secondary-action light">
              Encontrar uma feira
            </button>
          </div>
        </div>
        <div className="hero-illustration" aria-hidden="true">
          <span>🥕</span>
          <span>🥖</span>
          <span>🧀</span>
          <strong>🧺</strong>
        </div>
      </section>
      <section>
        <SectionHeading eyebrow="Atalhos" title="O que você quer fazer?" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <QuickAction
            icon="🧺"
            title="Feiras próximas"
            text="Estado, cidade e feira"
            onClick={() => onFair(fairs[0].name)}
          />
          <QuickAction icon="🏪" title="Bancas" text="Escolher feirantes" onClick={onVendors} />
          <QuickAction icon="🛵" title="Meu pedido" text="Acompanhar a entrega" onClick={onTracking} />
          <QuickAction icon="✨" title="Promoções" text="Ofertas do dia" onClick={() => onTab("products")} />
        </div>
      </section>
      <section>
        <SectionHeading
          eyebrow="Escolha com calma"
          title="Destaques da feira"
          action="Ver catálogo"
          onAction={() => onTab("products")}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products
            .filter((product) => product.featured)
            .map((product) => (
              <article key={product.id} className="mini-product">
                <span>{product.emoji}</span>
                <small>{product.feirante}</small>
                <b>{product.name}</b>
                <strong>
                  {money(product.price)} <em>/{product.unit}</em>
                </strong>
              </article>
            ))}
        </div>
      </section>
    </div>
  );
}

export function FairsPage({
  fairItems,
  onFair,
  onMap,
}: {
  fairItems: ReturnType<typeof sortFairsByDistance>;
  onFair: (name: string) => void;
  onMap: (destination: number | string, lng?: number) => void;
}) {
  const officialItems = fairItems.filter((fair) => fair.source !== "demo");
  const regions = Array.from(new Set(officialItems.map((fair) => fair.place))).sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
  const [selectedRegion, setSelectedRegion] = useState("");
  const filteredItems = selectedRegion
    ? officialItems.filter((fair) => fair.place === selectedRegion)
    : officialItems;
  const featuredItems = filteredItems.slice(0, 3);
  const otherItems = filteredItems.slice(3);

  return (
    <section>
      <PageHeading
        title="Escolha sua feira"
        subtitle="Escolha a região para ver somente as feiras disponíveis naquele local."
      />
      <div className="region-selector">
        <label>
          Estado
          <select value="Distrito Federal" aria-label="Estado" disabled>
            <option>Distrito Federal</option>
          </select>
        </label>
        <label>
          Cidade/região
          <select
            value={selectedRegion}
            onChange={(event) => setSelectedRegion(event.target.value)}
            aria-label="Cidade/região"
          >
            <option value="">Todas as regiões</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-7">
        <SectionHeading
          eyebrow={selectedRegion ? "Região selecionada" : "Distrito Federal"}
          title={selectedRegion ? `Feiras em ${selectedRegion}` : "Feiras em destaque"}
        />
        {featuredItems.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {featuredItems.map((fair, index) => (
              <FairCard key={fair.name} fair={fair} index={index} onFair={onFair} onMap={onMap} />
            ))}
          </div>
        ) : (
          <Empty title="Nenhuma feira encontrada" text="Não há feira cadastrada para esta região." />
        )}
      </div>

      {otherItems.length > 0 && (
        <section className="mt-12">
          <SectionHeading
            eyebrow="Explore por região"
            title={selectedRegion ? `Mais feiras em ${selectedRegion}` : "Outras feiras"}
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {otherItems.map((fair, index) => (
              <FairCard key={fair.name} fair={fair} index={index + 3} onFair={onFair} onMap={onMap} />
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

export function FairCard({
  fair,
  index,
  onFair,
  onMap,
}: {
  fair: ReturnType<typeof sortFairsByDistance>[number];
  index: number;
  onFair: (name: string) => void;
  onMap: (destination: number | string, lng?: number) => void;
}) {
  return (
    <article className="fair-card">
      <div className={`fair-cover tone-${index % 3}`}>
        <span aria-hidden="true">🧺</span>
        <small>{fairHoursForName(fair.name).label}</small>
      </div>
      <div className="p-5">
        <h3>{fair.name}</h3>
        <p>
          <MapPin size={14} /> {fair.place}
        </p>
        {fair.address && <p>{fair.address}</p>}
        <p>
          <Store size={14} />{" "}
          {typeof fair.feirantes === "number" ? `${fair.feirantes} feirantes` : "Feirantes a cadastrar"}
          {fair.distance !== null && ` · ${fair.distance.toFixed(1)} km`}
        </p>
        <div className="market-meta">
          <span>
            <Star size={13} />{" "}
            {typeof fair.rating === "number" && typeof fair.reviewCount === "number"
              ? `${ratingLabel(fair.rating)} (${fair.reviewCount})`
              : "Sem avaliações"}
          </span>
          <span>{fair.deliveryMinutes ? minutesLabel(fair.deliveryMinutes) : "Entrega a configurar"}</span>
          <span>{typeof fair.deliveryFee === "number" ? money(fair.deliveryFee) : "Taxa a configurar"}</span>
        </div>
        <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
          <button onClick={() => onFair(fair.name)} className="primary-action">
            Ver feira
          </button>
          <button
            onClick={() =>
              typeof fair.lat === "number" && typeof fair.lng === "number"
                ? onMap(fair.lat, fair.lng)
                : onMap(fair.address ?? `${fair.name}, ${fair.place}, DF`)
            }
            className="icon-button large"
            aria-label={`Abrir rota para ${fair.name}`}
          >
            <MapPin size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}

export function CatalogPage({
  items,
  fairName,
  query,
  category,
  onCategory,
  onAdd,
  favorites,
  onFavorite,
}: {
  items: Product[];
  fairName: string;
  query: string;
  category: string;
  onCategory: (category: string) => void;
  onAdd: (id: number) => void;
  favorites: number[];
  onFavorite: (id: number) => void;
}) {
  return (
    <section>
      <PageHeading
        title={query.trim() ? "Resultados da busca" : "Produtos da feira"}
        subtitle={
          query.trim()
            ? `${items.length} resultado(s) em todas as feiras para “${query.trim()}”.`
            : `${items.length} produto(s) na ${fairName}.`
        }
      />
      <div className="category-list" aria-label="Categorias">
        {["Todos", ...categories].map((item) => (
          <button key={item} onClick={() => onCategory(item)} className={category === item ? "active" : ""}>
            {item}
          </button>
        ))}
      </div>
      {items.length ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={onAdd}
              favorite={favorites.includes(product.id)}
              onFavorite={onFavorite}
            />
          ))}
        </div>
      ) : (
        <Empty title="Nenhum produto encontrado" text="Tente outro termo ou remova o filtro de categoria." />
      )}
    </section>
  );
}
export function ProductCard({
  product,
  onAdd,
  favorite,
  onFavorite,
}: {
  product: Product;
  onAdd: (id: number) => void;
  favorite: boolean;
  onFavorite: (id: number) => void;
}) {
  const metrics = metricForVendor(product.feirante, vendorMetrics);
  const variableWeight = ["kg", "g"].includes(product.unit);
  return (
    <article className="product-card">
      <button
        className="favorite-button"
        onClick={() => onFavorite(product.id)}
        aria-label={favorite ? `Remover ${product.name} dos favoritos` : `Favoritar ${product.name}`}
      >
        <Heart size={17} className={favorite ? "fill-red-500 text-red-500" : ""} />
      </button>
      <div className="product-art" data-category={product.category}>
        <span aria-hidden="true">{product.emoji}</span>
        <small>{product.category}</small>
      </div>
      <div className="p-4">
        <small className="vendor-name">{product.feirante}</small>
        <h3>{product.name}</h3>
        <p>{product.fair}</p>
        <div className="market-meta compact">
          <span>
            <Star size={12} /> {ratingLabel(metrics.rating)} ({metrics.reviewCount})
          </span>
          <span>{minutesLabel(metrics.deliveryMinutes)}</span>
          <span>{money(metrics.deliveryFee)}</span>
        </div>
        <div className="product-meta">
          <span>
            {product.weightKg.toLocaleString("pt-BR")} kg/{product.unit}
          </span>
          <span>{product.volume}</span>
        </div>
        {variableWeight && <small className="stock">Peso e valor finais podem variar na separação.</small>}
        <div className="mt-4 flex items-end justify-between gap-2">
          <div>
            <strong>{money(product.price)}</strong>
            <small>/{product.unit}</small>
          </div>
          <button
            onClick={() => onAdd(product.id)}
            className="add-button"
            aria-label={`Adicionar ${product.name} à sacola`}
          >
            <Plus size={19} />
          </button>
        </div>
        <p className="stock">
          {product.stock} {product.unit}(s) disponíveis
        </p>
      </div>
    </article>
  );
}

export function OrdersPage({
  orders,
  onTracking,
  onBuyAgain,
}: {
  orders: DemoOrder[];
  onTracking: (orderId: string) => void;
  onBuyAgain: (orderId: string) => void;
}) {
  return (
    <section className="mx-auto max-w-3xl">
      <PageHeading title="Meus pedidos" subtitle="Acompanhe suas compras, retiradas e entregas." />
      <div className="mt-6 space-y-3">
        {orders.map((order) => (
          <article key={order.id} className="order-card">
            <div>
              <small>{order.date}</small>
              <h3>{order.id}</h3>
              <p>Compra em múltiplas bancas</p>
            </div>
            <div className="text-right">
              <span>{order.status}</span>
              <strong>{money(order.value)}</strong>
              <div className="order-actions">
                <button onClick={() => onTracking(order.id)}>Ver detalhes</button>
                <button onClick={() => onBuyAgain(order.id)}>Comprar novamente</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
export function ProfilePage({
  session,
  onScreen,
  onLogout,
}: {
  session: DemoSession;
  onScreen: (screen: Screen) => void;
  onLogout: () => void;
}) {
  const links: Array<[string, string, ReactNode, Screen]> = [
    ["Minha conta", "Editar nome, telefone, e-mail e senha", <User />, "account"],
    ["Meus endereços", "Gerencie locais de entrega", <MapPin />, "addresses"],
    ["Pagamentos e carteira", "Pix, cartões, cupons e reembolsos", <Wallet />, "payments"],
    ["Favoritos", "Produtos salvos", <Heart />, "favorites"],
    ["Minhas avaliações", "Produtos, bancas, entregas e app", <Star />, "ratings"],
    ["Notificações", "Pedidos e novidades", <Bell />, "notifications"],
    ["Falar com o suporte", "Atendimento demonstrativo", <MessageCircle />, "chat"],
    ["Configurações", "Preferências do aplicativo", <Settings />, "settings"],
  ];
  return (
    <section className="mx-auto max-w-3xl">
      <div className="profile-hero">
        <div className="avatar">
          <User />
        </div>
        <div>
          <small>CONTA DEMONSTRATIVA · CLIENTE</small>
          <h1>Olá, {session.name}</h1>
          <p>{session.email} · dados locais até a conexão com o Supabase.</p>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {links.map(([title, text, icon, target]) => (
          <button key={title} onClick={() => onScreen(target)} className="profile-link">
            <span>{icon}</span>
            <span>
              <b>{title}</b>
              <small>{text}</small>
            </span>
            <ChevronRight />
          </button>
        ))}
      </div>
      <button onClick={onLogout} className="profile-logout">
        <LogOut size={18} /> Sair da conta
      </button>
    </section>
  );
}

export function FairDetail({
  fairName,
  onBack,
  onMap,
  onAdd,
}: {
  fairName: string;
  onBack: () => void;
  onMap: (destination: number | string, lng?: number) => void;
  onAdd: (id: number) => void;
}) {
  const fair = fairs.find((item) => item.name === fairName) ?? fairs[0];
  const fairProducts = products.filter((product) => product.fair === fair.name);

  return (
    <Panel
      title={fair.name}
      subtitle={`${fair.place} · ${fairHoursForName(fair.name).label}`}
      onBack={onBack}
    >
      <div className="detail-banner">
        <div>
          <span className="eyebrow light">Feira selecionada</span>
          <h2>Compre de quem faz a cidade acontecer.</h2>
          <p>
            {typeof fair.feirantes === "number"
              ? `${fair.feirantes} feirantes cadastrados nesta feira.`
              : "Cadastro de feirantes em atualização."}
          </p>
          {fair.address && <p>{fair.address}</p>}
        </div>
        <button
          onClick={() =>
            typeof fair.lat === "number" && typeof fair.lng === "number"
              ? onMap(fair.lat, fair.lng)
              : onMap(fair.address ?? `${fair.name}, ${fair.place}, DF`)
          }
          className="secondary-action light"
        >
          <MapPin size={17} /> Abrir rota
        </button>
      </div>
      <SectionHeading eyebrow="Catálogo" title="Produtos desta feira" />
      {fairProducts.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {fairProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={onAdd}
              favorite={false}
              onFavorite={() => undefined}
            />
          ))}
        </div>
      ) : (
        <Empty
          title="Catálogo em preparação"
          text="Os feirantes desta unidade ainda cadastrarão seus produtos."
        />
      )}
    </Panel>
  );
}

export function VendorsPage({
  fairName,
  onBack,
  onVendor,
}: {
  fairName: string;
  onBack: () => void;
  onVendor: (name: string) => void;
}) {
  const fair = fairs.find((item) => item.name === fairName);
  const fairProducts = products.filter((product) => product.fair === fairName);
  const vendors = vendorSummaries(fairProducts, vendorMetrics);
  return (
    <Panel
      title="Bancas e feirantes"
      subtitle={`Bancas cadastradas na ${fairName}. A compra permanece dentro desta feira.`}
      onBack={onBack}
    >
      <div className="region-strip">
        <MapPin size={18} />
        <div>
          <b>Contexto da compra</b>
          <p>
            Distrito Federal · {fair?.place ?? "Região a confirmar"} · {fairName}
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => (
          <article key={vendor.name} className="vendor-card">
            <span aria-hidden="true">{vendor.name.includes("Pescados") ? "🐟" : "🏪"}</span>
            <div>
              <small>{vendor.fair}</small>
              <h3>{vendor.name}</h3>
              <p>{vendor.categories.join(" · ")}</p>
              <div className="market-meta">
                <span>
                  <Star size={13} /> {ratingLabel(vendor.rating)} ({vendor.reviewCount})
                </span>
                <span>{minutesLabel(vendor.deliveryMinutes)}</span>
                <span>{money(vendor.deliveryFee)}</span>
              </div>
              <b>{vendor.products} produtos</b>
            </div>
            <button onClick={() => onVendor(vendor.name)}>
              Ver banca <ChevronRight size={16} />
            </button>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function VendorStore({
  vendorName,
  fairName,
  onBack,
  onAdd,
  favorites,
  onFavorite,
}: {
  vendorName: string;
  fairName: string;
  onBack: () => void;
  onAdd: (id: number) => void;
  favorites: number[];
  onFavorite: (id: number) => void;
}) {
  const vendorProducts = products.filter(
    (product) => product.feirante === vendorName && product.fair === fairName,
  );
  const metrics = metricForVendor(vendorName, vendorMetrics);
  return (
    <Panel title={vendorName} subtitle={`${fairName} · loja do feirante`} onBack={onBack}>
      <div className="detail-banner">
        <div>
          <Store size={30} />
          <h2>{vendorName}</h2>
          <p>
            Produtos selecionados direto da feira · {ratingLabel(metrics.rating)} ★ ({metrics.reviewCount}) ·{" "}
            {minutesLabel(metrics.deliveryMinutes)} · entrega {money(metrics.deliveryFee)}
          </p>
        </div>
      </div>
      {vendorProducts.length ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {vendorProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={onAdd}
              favorite={favorites.includes(product.id)}
              onFavorite={onFavorite}
            />
          ))}
        </div>
      ) : (
        <Empty title="Loja sem produtos" text="Este feirante ainda não cadastrou produtos." />
      )}
    </Panel>
  );
}
export function DeliveryTracking({ order, onBack }: { order: DemoOrder; onBack: () => void }) {
  const [cancelReason, setCancelReason] = useState("");
  const [showReview, setShowReview] = useState(false);

  const statusConfig: Record<
    DemoOrder["status"],
    {
      title: string;
      description: string;
      activeStep: number;
    }
  > = {
    Recebido: {
      title: "Pedido recebido",
      description: "Aguardando a banca confirmar e iniciar a preparação.",
      activeStep: 0,
    },
    Preparando: {
      title: "Seu pedido está sendo preparado",
      description: "As bancas estão separando os produtos do seu pedido.",
      activeStep: 1,
    },
    Coleta: {
      title: "Pedido pronto para coleta",
      description: "O pedido está aguardando retirada pelo entregador.",
      activeStep: 2,
    },
    "Em rota": {
      title: "Seu pedido está a caminho",
      description: "Previsão estimada: 20–35 minutos.",
      activeStep: 3,
    },
    Entregue: {
      title: "Pedido entregue",
      description: "A entrega foi concluída.",
      activeStep: 4,
    },
    Cancelado: {
      title: "Pedido cancelado",
      description: "Este pedido não seguirá para entrega.",
      activeStep: -1,
    },
  };

  const config = statusConfig[order.status];
  const timeline = ["Pedido confirmado", "Produtos separados", "Coleta concluída", "Entregador em rota"];

  return (
    <Panel title="Acompanhar entrega" subtitle={`Pedido ${order.id} · ${order.status}`} onBack={onBack}>
      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <div className="tracking-map">
          <span aria-hidden="true">
            {order.status === "Entregue" ? "✅" : order.status === "Cancelado" ? "✕" : "🛵"}
          </span>
          <div className="route-line">
            {timeline.map((step, index) => (
              <i
                key={step}
                className={config.activeStep >= index || order.status === "Entregue" ? "done" : undefined}
              />
            ))}
          </div>
          <h2>{config.title}</h2>
          <p>{config.description}</p>
        </div>
        <div className="surface-card">
          <h2>Linha do pedido</h2>
          {timeline.map((text, index) => {
            const completed = order.status === "Entregue" || config.activeStep > index;
            const current = config.activeStep === index;
            return (
              <div className="timeline-item" key={text}>
                <span>{completed ? <Check size={15} /> : current ? <Bike size={15} /> : index + 1}</span>
                <div>
                  <b>{text}</b>
                  <small>
                    {order.status === "Cancelado"
                      ? "Interrompido"
                      : completed
                        ? "Concluído"
                        : current
                          ? "Etapa atual"
                          : "Aguardando"}
                  </small>
                </div>
              </div>
            );
          })}
          {order.status !== "Entregue" && order.status !== "Cancelado" && (
            <div className="cancel-panel">
              <b>
                {["Coleta", "Em rota"].includes(order.status)
                  ? "Pedir ajuda com este pedido"
                  : "Cancelar pedido"}
              </b>
              <p>
                {["Coleta", "Em rota"].includes(order.status)
                  ? "Depois que a coleta começou, o cliente não cancela sozinho. O caso segue para suporte."
                  : "Antes da coleta, escolha o motivo para solicitar o cancelamento."}
              </p>
              <select value={cancelReason} onChange={(event) => setCancelReason(event.target.value)}>
                <option value="">Escolha um motivo</option>
                {["Coleta", "Em rota"].includes(order.status) ? (
                  <>
                    <option>Endereço incorreto</option>
                    <option>Pedido chegou com problema</option>
                    <option>Não consigo receber agora</option>
                    <option>Outro problema com a entrega</option>
                  </>
                ) : (
                  <>
                    <option>Desisti da compra</option>
                    <option>Endereço incorreto</option>
                    <option>Pedido duplicado</option>
                    <option>Problema com os itens</option>
                    <option>Outro</option>
                  </>
                )}
              </select>
              <button className="secondary-action" disabled={!cancelReason}>
                <XCircle size={17} />{" "}
                {["Coleta", "Em rota"].includes(order.status)
                  ? "Abrir solicitação de suporte"
                  : "Solicitar cancelamento"}
              </button>
            </div>
          )}
          {order.status === "Entregue" && (
            <>
              <button className="primary-action w-full" onClick={() => setShowReview((value) => !value)}>
                Avaliar pedido, banca e entrega
              </button>
              {showReview && (
                <div className="review-grid compact">
                  {["Produto", "Banca", "Entrega"].map((item) => (
                    <article className="review-card" key={item}>
                      <strong>★ ★ ★ ★ ★</strong>
                      <div>
                        <b>{item}</b>
                        <small>Toque para registrar a nota do {item.toLocaleLowerCase("pt-BR")}.</small>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Panel>
  );
}

export function Checkout({
  items,
  cart,
  subtotal,
  onBack,
  onConfirm,
}: {
  items: Product[];
  cart: Record<number, number>;
  subtotal: number;
  onBack: () => void;
  onConfirm: (total: number) => void;
}) {
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [payment, setPayment] = useState("Pix");
  const totalWeight = cartWeight(items, cart);
  const hasVariableWeight = items.some((product) => ["kg", "g"].includes(product.unit));
  const vehicle = vehicleForWeight(totalWeight);
  const deliveryFee = fulfillment === "delivery" && subtotal < 80 ? 8.9 : 0;
  const total = subtotal + deliveryFee;
  if (!items.length)
    return (
      <Panel title="Sua sacola está vazia" subtitle="Adicione produtos antes de finalizar." onBack={onBack}>
        <Empty title="Nenhum item" text="Volte ao catálogo para começar sua feira." />
      </Panel>
    );
  return (
    <Panel title="Finalizar pedido" subtitle="Confira tudo antes de confirmar" onBack={onBack}>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Step title="1. Como deseja receber?">
            <div className="grid grid-cols-2 gap-3">
              <Choice
                active={fulfillment === "delivery"}
                onClick={() => setFulfillment("delivery")}
                icon={<Truck />}
                title="Entrega"
                text="Receba em casa"
              />
              <Choice
                active={fulfillment === "pickup"}
                onClick={() => setFulfillment("pickup")}
                icon={<Store />}
                title="Retirada"
                text="Busque na feira"
              />
            </div>
          </Step>
          {fulfillment === "delivery" && (
            <Step title="2. Endereço">
              <div className="address-preview">
                <MapPin />
                <div>
                  <b>Casa</b>
                  <p>Planaltina, DF · endereço demonstrativo</p>
                </div>
              </div>
              <div className="logistics-box">
                <Truck size={18} />
                <div>
                  <b>{vehicle.name} indicado para esta compra</b>
                  <p>
                    Peso estimado: {totalWeight.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg ·
                    limite sugerido: {vehicle.maxKg} kg · {vehicle.note}.
                  </p>
                </div>
              </div>
            </Step>
          )}
          <Step title={fulfillment === "delivery" ? "3. Pagamento" : "2. Pagamento"}>
            <div className="grid gap-2 sm:grid-cols-2">
              {["Pix", "Cartão"].map((method) => (
                <Choice
                  key={method}
                  active={payment === method}
                  onClick={() => setPayment(method)}
                  icon={<CreditCard />}
                  title={method}
                  text="Modo demonstração"
                />
              ))}
            </div>
          </Step>
          {hasVariableWeight && (
            <div className="region-strip">
              <Package size={18} />
              <div>
                <b>Há produtos vendidos por peso</b>
                <p>
                  Peso e valor são estimados até a separação. No MVP, a cobrança real só poderá ser ajustada
                  quando o provedor suportar autorização de diferença; caso contrário serão usadas porções
                  fechadas.
                </p>
              </div>
            </div>
          )}
          <Step title="Itens do pedido">
            {items.map((product) => (
              <div className="checkout-item" key={product.id}>
                <span>{product.emoji}</span>
                <div>
                  <b>
                    {cart[product.id]}× {product.name}
                  </b>
                  <small>{product.feirante}</small>
                  <small>
                    {productWeight(product, cart[product.id]).toLocaleString("pt-BR", {
                      maximumFractionDigits: 1,
                    })}{" "}
                    kg estimados
                  </small>
                </div>
                <strong>{money(product.price * cart[product.id])}</strong>
              </div>
            ))}
          </Step>
        </div>
        <aside className="summary-card">
          <span className="eyebrow">Resumo</span>
          <h2>Seu pedido</h2>
          <div>
            <p>
              <span>Subtotal</span>
              <b>{money(subtotal)}</b>
            </p>
            <p>
              <span>Peso estimado</span>
              <b>{totalWeight.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg</b>
            </p>
            <p>
              <span>Veículo indicado</span>
              <b>{vehicle.name}</b>
            </p>
            <p>
              <span>{fulfillment === "delivery" ? "Entrega" : "Retirada"}</span>
              <b>{deliveryFee ? money(deliveryFee) : "Grátis"}</b>
            </p>
            <p className="total">
              <span>{hasVariableWeight ? "Total estimado" : "Total"}</span>
              <b>{money(total)}</b>
            </p>
          </div>
          <button onClick={() => onConfirm(total)} className="primary-action w-full">
            Confirmar pedido
          </button>
          <small>Pedido local demonstrativo. Nenhuma cobrança será realizada.</small>
        </aside>
      </div>
    </Panel>
  );
}

export function FavoritesPage({
  ids,
  onAdd,
  onFavorite,
  onBack,
  onExplore,
}: {
  ids: number[];
  onAdd: (id: number) => void;
  onFavorite: (id: number) => void;
  onBack: () => void;
  onExplore: () => void;
}) {
  const favoriteProducts = products.filter((product) => ids.includes(product.id));
  return (
    <Panel title="Favoritos" subtitle="Produtos que você quer encontrar de novo." onBack={onBack}>
      {favoriteProducts.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {favoriteProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={onAdd} favorite onFavorite={onFavorite} />
          ))}
        </div>
      ) : (
        <Empty
          title="Nenhum favorito"
          text="Toque no coração de um produto para salvá-lo aqui."
          action="Explorar produtos"
          onAction={onExplore}
        />
      )}
    </Panel>
  );
}
export function NotificationsPage({
  orders,
  onBack,
  onClear,
}: {
  orders: DemoOrder[];
  onBack: () => void;
  onClear: () => void;
}) {
  const messages = orders.map((order) => {
    const textByStatus: Record<DemoOrder["status"], string> = {
      Recebido: `Pedido ${order.id} recebido e aguardando confirmação da banca.`,
      Preparando: `Pedido ${order.id} está sendo preparado.`,
      Coleta: `Pedido ${order.id} está pronto para coleta.`,
      "Em rota": `Pedido ${order.id} saiu para entrega.`,
      Entregue: `Pedido ${order.id} foi entregue. Você já pode avaliar.`,
      Cancelado: `Pedido ${order.id} foi cancelado.`,
    };
    return textByStatus[order.status];
  });

  return (
    <Panel title="Notificações" subtitle="Eventos reais da demonstração de pedidos." onBack={onBack}>
      <div className="mb-4 flex justify-end">
        <button onClick={onClear} className="text-button">
          Marcar todas como lidas
        </button>
      </div>
      {messages.length ? (
        messages.map((text, index) => (
          <article key={text} className={index < 2 ? "notification unread" : "notification"}>
            <span>
              <Bell size={18} />
            </span>
            <div>
              <b>{text}</b>
              <small>Gerado pelo estado atual do pedido</small>
            </div>
          </article>
        ))
      ) : (
        <Empty title="Sem notificações" text="Mudanças nos pedidos aparecerão aqui." />
      )}
    </Panel>
  );
}

export function AddressesPage({ onBack }: { onBack: () => void }) {
  const [addresses, setAddresses] = usePersistentState<Address[]>("feirae:addresses", [
    {
      id: 1,
      label: "Casa",
      details: "Planaltina - DF · próximo à Feira Permanente",
      isDefault: true,
      city: "Planaltina",
      state: "DF",
      reference: "Próximo à Feira Permanente",
    },
  ]);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [cep, setCep] = useState("");
  const [state, setState] = useState("DF");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [reference, setReference] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!label.trim() || !cep.trim() || !city.trim() || !street.trim() || !number.trim()) return;

    const details = [
      street.trim(),
      number.trim(),
      neighborhood.trim(),
      city.trim(),
      state.trim(),
      cep.trim(),
      complement.trim(),
      reference.trim(),
    ]
      .filter(Boolean)
      .join(" · ");

    setAddresses((current) => [
      ...current,
      {
        id: Date.now(),
        label: label.trim(),
        details,
        isDefault: false,
        cep: cep.trim(),
        state: state.trim(),
        city: city.trim(),
        neighborhood: neighborhood.trim(),
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim(),
        reference: reference.trim(),
      },
    ]);

    setLabel("");
    setCep("");
    setState("DF");
    setCity("");
    setNeighborhood("");
    setStreet("");
    setNumber("");
    setComplement("");
    setReference("");
    setAdding(false);
  }

  const minimumAddressFilled = Boolean(cep.trim() && city.trim() && street.trim() && number.trim());

  return (
    <Panel
      title="Meus endereços"
      subtitle="Usamos seu endereço para ordenar feiras próximas, calcular entrega e validar área atendida."
      onBack={onBack}
    >
      <div className="space-y-3">
        {addresses.map((address) => (
          <article className="address-card" key={address.id}>
            <MapPin />
            <div>
              <b>{address.label}</b>
              <p>{address.details}</p>
            </div>
            {address.isDefault && <span>Principal</span>}
            <button
              onClick={() => setAddresses((current) => current.filter((item) => item.id !== address.id))}
              aria-label={`Excluir endereço ${address.label}`}
            >
              <Trash2 size={17} />
            </button>
          </article>
        ))}
      </div>

      {adding ? (
        <form onSubmit={submit} className="form-card">
          <label>
            Apelido do endereço
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Casa, trabalho, mãe"
              required
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              CEP
              <input
                value={cep}
                onChange={(event) => setCep(event.target.value)}
                placeholder="00000-000"
                inputMode="numeric"
                required
              />
            </label>
            <label>
              Estado
              <input
                value={state}
                onChange={(event) => setState(event.target.value.toUpperCase())}
                maxLength={2}
                placeholder="DF"
                required
              />
            </label>
            <label>
              Cidade/região
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Ex.: Planaltina"
                required
              />
            </label>
            <label>
              Bairro/setor
              <input
                value={neighborhood}
                onChange={(event) => setNeighborhood(event.target.value)}
                placeholder="Bairro, setor ou condomínio"
              />
            </label>
          </div>

          <label>
            Rua/quadra
            <input
              value={street}
              onChange={(event) => setStreet(event.target.value)}
              placeholder="Rua, avenida, quadra ou conjunto"
              required
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              Número/lote
              <input
                value={number}
                onChange={(event) => setNumber(event.target.value)}
                placeholder="Número, lote ou casa"
                required
              />
            </label>
            <label>
              Complemento
              <input
                value={complement}
                onChange={(event) => setComplement(event.target.value)}
                placeholder="Apto., bloco, fundos..."
              />
            </label>
          </div>

          <label>
            Ponto de referência
            <input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Ex.: perto da Feira Permanente"
            />
          </label>

          <div className="region-strip">
            <MapPin size={18} />
            <div>
              <b>{minimumAddressFilled ? "Endereço pronto para validação" : "Complete o endereço"}</b>
              <p>
                {minimumAddressFilled
                  ? "A disponibilidade, a taxa e o prazo serão calculados no checkout com rota, peso e veículo compatível."
                  : "Informe CEP, cidade/região, rua/quadra e número para validar a entrega."}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="primary-action">
              Salvar endereço
            </button>
            <button type="button" onClick={() => setAdding(false)} className="secondary-action">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="dashed-action">
          <Plus /> Adicionar endereço
        </button>
      )}
    </Panel>
  );
}

export function AccountPage({ session, onBack }: { session: DemoSession; onBack: () => void }) {
  const [profile, setProfile] = usePersistentState(`feirae:account:${session.email}`, {
    name: session.name,
    cpf: "",
    birthDate: "",
    email: session.email,
    phone: "",
    cep: "",
    address: "",
    number: "",
    complement: "",
    city: "Planaltina",
    state: "DF",
    password: "",
  });
  const [saved, setSaved] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  return (
    <Panel
      title="Minha conta"
      subtitle="Dados pessoais, contato, endereço e segurança da sua conta."
      onBack={onBack}
    >
      <form className="form-card max-w-2xl" onSubmit={submit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            Nome completo
            <input
              value={profile.name}
              onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
              autoComplete="name"
            />
          </label>
          <label>
            CPF
            <input
              value={profile.cpf}
              onChange={(event) => setProfile((current) => ({ ...current, cpf: event.target.value }))}
              placeholder="000.000.000-00"
              inputMode="numeric"
            />
          </label>
          <label>
            Data de nascimento
            <input
              value={profile.birthDate}
              type="date"
              onChange={(event) => setProfile((current) => ({ ...current, birthDate: event.target.value }))}
            />
          </label>
          <label>
            Telefone
            <input
              value={profile.phone}
              onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
              placeholder="(61) 99999-9999"
              autoComplete="tel"
            />
          </label>
        </div>

        <label>
          E-mail
          <input
            value={profile.email}
            type="email"
            onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
            autoComplete="email"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-[.7fr_1.3fr]">
          <label>
            CEP
            <input
              value={profile.cep}
              onChange={(event) => setProfile((current) => ({ ...current, cep: event.target.value }))}
              placeholder="00000-000"
              inputMode="numeric"
            />
          </label>
          <label>
            Endereço
            <input
              value={profile.address}
              onChange={(event) => setProfile((current) => ({ ...current, address: event.target.value }))}
              placeholder="Rua, avenida, quadra..."
              autoComplete="street-address"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            Número
            <input
              value={profile.number}
              onChange={(event) => setProfile((current) => ({ ...current, number: event.target.value }))}
              placeholder="Número/lote"
            />
          </label>
          <label>
            Complemento
            <input
              value={profile.complement}
              onChange={(event) => setProfile((current) => ({ ...current, complement: event.target.value }))}
              placeholder="Apartamento, bloco, referência"
            />
          </label>
          <label>
            Cidade/região
            <input
              value={profile.city}
              onChange={(event) => setProfile((current) => ({ ...current, city: event.target.value }))}
            />
          </label>
          <label>
            Estado
            <input
              value={profile.state}
              onChange={(event) => setProfile((current) => ({ ...current, state: event.target.value }))}
              maxLength={2}
            />
          </label>
        </div>

        <label>
          Nova senha
          <input
            value={profile.password}
            onChange={(event) => setProfile((current) => ({ ...current, password: event.target.value }))}
            type="password"
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />
        </label>
        {saved && <p className="inline-success">Alterações salvas neste dispositivo.</p>}
        <button type="submit" className="primary-action">
          <Edit3 size={17} /> Salvar alterações
        </button>
      </form>
    </Panel>
  );
}

export function PaymentsPage({ onBack }: { onBack: () => void }) {
  const [cards, setCards] = usePersistentState<
    { id: string; holder: string; last4: string; expiry: string; type: string }[]
  >("feirae:cards-v2", [
    { id: "demo-card", holder: "Cliente Feiraê", last4: "4821", expiry: "12/29", type: "Crédito" },
  ]);
  const [mode, setMode] = useState<"card" | null>(null);
  const [holder, setHolder] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardType, setCardType] = useState("Crédito");

  function submit(event: FormEvent) {
    event.preventDefault();
    const digits = number.replace(/\D/g, "");
    if (!holder.trim() || digits.length < 12 || !expiry.trim() || cvv.length < 3) return;
    setCards((current) => [
      {
        id: String(Date.now()),
        holder: holder.trim(),
        last4: digits.slice(-4),
        expiry: expiry.trim(),
        type: cardType,
      },
      ...current,
    ]);
    setHolder("");
    setNumber("");
    setExpiry("");
    setCvv("");
    setMode(null);
  }

  return (
    <Panel
      title="Pagamentos e carteira"
      subtitle="Cartões são representados por token na arquitetura real; número completo e CVV não ficam salvos no Feiraê."
      onBack={onBack}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_.8fr]">
        <div className="surface-card">
          <span className="eyebrow">Métodos</span>
          <div className="payment-list">
            <article>
              <CreditCard />
              <div>
                <b>Cartão de crédito/débito</b>
                <small>
                  {cards.length
                    ? cards.map((card) => `${card.type} final ${card.last4} · ${card.expiry}`).join(" · ")
                    : "Nenhum cartão tokenizado"}
                </small>
              </div>
              <button onClick={() => setMode("card")}>Adicionar</button>
            </article>
            <article>
              <Wallet />
              <div>
                <b>Pix</b>
                <small>
                  O QR Code/copia e cola é gerado no checkout. Não é necessário cadastrar uma chave Pix do
                  cliente.
                </small>
              </div>
            </article>
          </div>
          {mode === "card" && (
            <form className="form-card compact" onSubmit={submit}>
              <label>
                Nome no cartão
                <input
                  value={holder}
                  onChange={(event) => setHolder(event.target.value)}
                  autoComplete="cc-name"
                  required
                />
              </label>
              <label>
                Número do cartão
                <input
                  value={number}
                  onChange={(event) => setNumber(event.target.value)}
                  placeholder="0000 0000 0000 0000"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  required
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                <label>
                  Validade
                  <input
                    value={expiry}
                    onChange={(event) => setExpiry(event.target.value)}
                    placeholder="MM/AA"
                    autoComplete="cc-exp"
                    required
                  />
                </label>
                <label>
                  CVV
                  <input
                    value={cvv}
                    onChange={(event) => setCvv(event.target.value.replace(/\D/g, "").slice(0, 4))}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="123"
                    required
                  />
                </label>
                <label>
                  Tipo
                  <select value={cardType} onChange={(event) => setCardType(event.target.value)}>
                    <option>Crédito</option>
                    <option>Débito</option>
                  </select>
                </label>
              </div>
              <p className="operation-footnote">
                Na integração real, esses dados serão enviados diretamente ao provedor para tokenização. O CVV
                nunca será armazenado.
              </p>
              <div className="module-action-row">
                <button className="primary-action" type="submit">
                  Tokenizar e salvar cartão
                </button>
                <button className="secondary-action" type="button" onClick={() => setMode(null)}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
        <div className="surface-card wallet-card">
          <span className="eyebrow">Carteira</span>
          <h2>R$ 18,90</h2>
          <p>Crédito demonstrativo de reembolso disponível para a próxima compra.</p>
          <div className="finance-breakdown">
            <p>
              <span>Reembolso</span>
              <strong>R$ 18,90</strong>
            </p>
            <p>
              <span>Origem</span>
              <strong>Pedido demonstrativo</strong>
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function RatingsPage({ orders, onBack }: { orders: DemoOrder[]; onBack: () => void }) {
  const [reviews] = usePersistentState("feirae:customer-reviews", [
    {
      id: "review-product-1",
      type: "Produto",
      target: "Cesta de frutas",
      orderId: "FE-1019",
      rating: 5,
      text: "Frutas bonitas e bem embaladas.",
    },
    {
      id: "review-vendor-1",
      type: "Banca",
      target: "Sítio da Vó",
      orderId: "FE-1019",
      rating: 4.9,
      text: "Atendimento rápido na separação.",
    },
    {
      id: "review-delivery-1",
      type: "Entrega",
      target: "Entregador do pedido",
      orderId: "FE-1019",
      rating: 4.8,
      text: "Entrega cuidadosa.",
    },
  ]);
  const reviewedOrderIds = new Set(reviews.map((review) => review.orderId));
  const pending = orders.filter((order) => order.status === "Entregue" && !reviewedOrderIds.has(order.id));

  return (
    <Panel
      title="Minhas avaliações"
      subtitle="Avaliações feitas ficam separadas dos pedidos que ainda aguardam sua nota."
      onBack={onBack}
    >
      <SectionHeading eyebrow="Pendentes" title="Pedidos para avaliar" />
      {pending.length ? (
        <div className="operation-list">
          {pending.map((order) => (
            <article key={order.id}>
              <Star />
              <div>
                <b>{order.id}</b>
                <small>Avalie produtos, banca e entrega deste pedido.</small>
              </div>
              <button className="mini-toggle">Avaliar</button>
            </article>
          ))}
        </div>
      ) : (
        <p className="operation-footnote">Nenhum pedido entregue aguardando avaliação.</p>
      )}

      <SectionHeading eyebrow="Histórico" title="Avaliações já enviadas" />
      <div className="review-grid">
        {reviews.map((review) => (
          <article className="review-card" key={review.id}>
            <strong>{review.rating.toLocaleString("pt-BR")} ★</strong>
            <div>
              <b>
                {review.type} · {review.target}
              </b>
              <small>{review.orderId}</small>
              <p>{review.text}</p>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function ChatPage({ onBack }: { onBack: () => void }) {
  const [topic, setTopic] = useState("Pedido em andamento");
  const [messages, setMessages] = useState(["Olá! Escolha o assunto e descreva o problema."]);
  const [message, setMessage] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;
    setMessages((current) => [
      ...current,
      message.trim(),
      `Protocolo FE-${Math.floor(2000 + Math.random() * 7000)} aberto em ${topic}. Nossa equipe acompanha por aqui.`,
    ]);
    setMessage("");
  }
  return (
    <Panel
      title="Suporte Feiraê"
      subtitle="Atendimento para pedido, pagamento, entrega e conta."
      onBack={onBack}
    >
      <div className="chat-card">
        <div className="support-topics">
          {["Pedido em andamento", "Pagamento", "Entrega", "Conta"].map((item) => (
            <button key={item} onClick={() => setTopic(item)} className={topic === item ? "active" : ""}>
              {item}
            </button>
          ))}
        </div>
        <div className="chat-messages">
          {messages.map((text, index) => (
            <p key={`${text}-${index}`} className={index % 2 ? "sent" : "received"}>
              {text}
            </p>
          ))}
        </div>
        <form onSubmit={submit}>
          <label className="sr-only" htmlFor="support-message">
            Digite sua mensagem
          </label>
          <input
            id="support-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Digite sua mensagem…"
          />
          <button type="submit" aria-label="Enviar mensagem">
            <MessageCircle />
          </button>
        </form>
      </div>
    </Panel>
  );
}
export function SettingsPage({ onBack }: { onBack: () => void }) {
  const [offers, setOffers] = usePersistentState("feirae:offers", true);
  const [orderUpdates, setOrderUpdates] = usePersistentState("feirae:order-updates", true);
  const [whatsapp, setWhatsapp] = usePersistentState("feirae:whatsapp", false);
  const [useGps, setUseGps] = usePersistentState("feirae:gps", true);
  const [compactCards, setCompactCards] = usePersistentState("feirae:compact-cards", false);
  return (
    <Panel title="Configurações" subtitle="Preferências salvas neste dispositivo." onBack={onBack}>
      <div className="surface-card max-w-2xl">
        <Toggle
          label="Ofertas e novidades"
          description="Receber novidades das feiras favoritas"
          checked={offers}
          onChange={setOffers}
        />
        <Toggle
          label="Atualizações dos pedidos"
          description="Acompanhar mudanças de status"
          checked={orderUpdates}
          onChange={setOrderUpdates}
        />
        <Toggle
          label="Autorizo receber mensagens do Feiraê via WhatsApp"
          description="Consentimento opcional para atualizações de pedidos e entregas; pode ser desativado a qualquer momento."
          checked={whatsapp}
          onChange={setWhatsapp}
        />
        <Toggle
          label="Usar localização aproximada"
          description="Ordenar feiras próximas e calcular entrega"
          checked={useGps}
          onChange={setUseGps}
        />
        <Toggle
          label="Cards compactos"
          description="Mostrar vitrines com menos altura quando houver muitos produtos"
          checked={compactCards}
          onChange={setCompactCards}
        />
      </div>
    </Panel>
  );
}
