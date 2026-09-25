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
  onAdd,
}: {
  onTab: (tab: CustomerTab) => void;
  onFair: (name: string) => void;
  onVendors: () => void;
  onTracking: () => void;
  onAdd: (id: number) => void;
}) {
  return (
    <div className="space-y-12">
      <section className="hero">
        <div className="relative z-10 max-w-2xl">
          <span className="eyebrow light">Marketplace de feiras locais</span>
          <h1>A feira que você gosta, agora mais perto.</h1>
          <p>Descubra produtos locais, apoie feirantes e escolha entre receber em casa ou retirar na feira.</p>
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
          <span>🥕</span><span>🥖</span><span>🧀</span><strong>🧺</strong>
        </div>
      </section>
      <section>
        <SectionHeading eyebrow="Atalhos" title="O que você quer fazer?" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <QuickAction icon="🧺" title="Feiras próximas" text="Estado, cidade e feira" onClick={() => onFair(fairs[0].name)} />
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
          {products.filter((product) => product.featured).map((product) => (
            <article key={product.id} className="mini-product">
              <span>{product.emoji}</span>
              <small>{product.feirante}</small>
              <b>{product.name}</b>
              <strong>{money(product.price)} <em>/{product.unit}</em></strong>
              <button className="mini-toggle active" onClick={() => onAdd(product.id)}>
                <Plus size={15} /> Adicionar
              </button>
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
  const ordered = [...orders].sort((a, b) => {
    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
    if (aTime !== bTime) return bTime - aTime;
    return b.id.localeCompare(a.id, "pt-BR", { numeric: true });
  });
  return (
    <section className="mx-auto max-w-3xl">
      <PageHeading title="Meus pedidos" subtitle="Ordenados por data e hora mais recentes." />
      <div className="mt-6 space-y-3">
        {ordered.map((order) => (
          <article key={order.id} className="order-card">
            <div>
              <small>{order.date}</small>
              <h3>{order.id}</h3>
              <p>{order.fairName ?? "Compra em múltiplas bancas"}</p>
              {order.paymentMethod && <small>{order.paymentMethod}</small>}
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
  vendorFavorites,
  onVendorFavorite,
}: {
  fairName: string;
  onBack: () => void;
  onVendor: (name: string) => void;
  vendorFavorites: string[];
  onVendorFavorite: (name: string) => void;
}) {
  const fair = fairs.find((item) => item.name === fairName);
  const fairProducts = products.filter((product) => product.fair === fairName);
  const vendors = vendorSummaries(fairProducts, vendorMetrics);
  return (
    <Panel title="Bancas e feirantes" subtitle={"Bancas cadastradas na " + fairName + ". A compra permanece dentro desta feira."} onBack={onBack}>
      <div className="region-strip">
        <MapPin size={18} />
        <div>
          <b>Contexto da compra</b>
          <p>Distrito Federal · {fair?.place ?? "Região a confirmar"} · {fairName}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => {
          const favorite = vendorFavorites.includes(vendor.name);
          return (
            <article key={vendor.name} className="vendor-card">
              <span aria-hidden="true">{vendor.name.includes("Pescados") ? "🐟" : "🏪"}</span>
              <div>
                <small>{vendor.fair}</small>
                <h3>{vendor.name}</h3>
                <p>{vendor.categories.join(" · ")}</p>
                <div className="market-meta">
                  <span><Star size={13} /> {ratingLabel(vendor.rating)} ({vendor.reviewCount})</span>
                  <span>{minutesLabel(vendor.deliveryMinutes)}</span>
                  <span>{money(vendor.deliveryFee)}</span>
                </div>
                <b>{vendor.products} produtos</b>
              </div>
              <div className="item-actions">
                <button
                  className={favorite ? "mini-toggle active" : "mini-toggle"}
                  onClick={() => onVendorFavorite(vendor.name)}
                  aria-label={(favorite ? "Remover " : "Favoritar ") + vendor.name}
                >
                  <Heart size={15} /> {favorite ? "Favorita" : "Favoritar"}
                </button>
                <button onClick={() => onVendor(vendor.name)}>
                  Ver banca <ChevronRight size={16} />
                </button>
              </div>
            </article>
          );
        })}
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
  storeFavorite,
  onStoreFavorite,
}: {
  vendorName: string;
  fairName: string;
  onBack: () => void;
  onAdd: (id: number) => void;
  favorites: number[];
  onFavorite: (id: number) => void;
  storeFavorite: boolean;
  onStoreFavorite: () => void;
}) {
  const vendorProducts = products.filter(
    (product) => product.feirante === vendorName && product.fair === fairName,
  );
  const metrics = metricForVendor(vendorName, vendorMetrics);
  return (
    <Panel title={vendorName} subtitle={fairName + " · loja do feirante"} onBack={onBack}>
      <div className="detail-banner">
        <div>
          <Store size={30} />
          <h2>{vendorName}</h2>
          <p>
            Produtos selecionados direto da feira · {ratingLabel(metrics.rating)} ★ ({metrics.reviewCount}) ·{" "}
            {minutesLabel(metrics.deliveryMinutes)} · entrega {money(metrics.deliveryFee)}
          </p>
        </div>
        <button className={storeFavorite ? "secondary-action light active" : "secondary-action light"} onClick={onStoreFavorite}>
          <Heart size={17} className={storeFavorite ? "fill-red-500 text-red-500" : ""} />
          {storeFavorite ? "Banca favorita" : "Favoritar banca"}
        </button>
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
export function DeliveryTracking({
  order,
  onBack,
  onCancel,
}: {
  order: DemoOrder;
  onBack: () => void;
  onCancel: (orderId: string, reason: string, details: string) => void;
}) {
  const [cancelReason, setCancelReason] = useState("");
  const [cancelDetails, setCancelDetails] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const statusConfig: Record<DemoOrder["status"], { title: string; description: string; activeStep: number }> = {
    Recebido: {
      title: "Pedido recebido",
      description: "Aguardando a banca confirmar e iniciar a preparação.",
      activeStep: 0,
    },
    Preparando: {
      title: "Seu pedido está sendo preparado",
      description: "A banca confirmou e está separando os produtos.",
      activeStep: 2,
    },
    Coleta: {
      title: "Pedido pronto para coleta",
      description: "A corrida pode ser aceita por um entregador compatível.",
      activeStep: 3,
    },
    "Em rota": {
      title: "Seu pedido está a caminho",
      description: "O pedido já foi coletado e segue para o endereço de entrega.",
      activeStep: 6,
    },
    Entregue: {
      title: "Pedido entregue",
      description: "A entrega foi concluída.",
      activeStep: 7,
    },
    Cancelado: {
      title: "Pedido cancelado",
      description: order.cancelReason ? "Motivo: " + order.cancelReason : "Este pedido não seguirá para entrega.",
      activeStep: -1,
    },
  };

  const timeline = [
    "Pedido recebido",
    "Confirmado pela banca",
    "Em separação",
    "Pronto para coleta",
    "Entregador a caminho da banca",
    "Pedido coletado",
    "A caminho do cliente",
    "Entregue",
  ];
  const config = statusConfig[order.status];
  const needsSupport = ["Coleta", "Em rota"].includes(order.status);
  const otherSelected = cancelReason === "Outro";
  const canSubmit = Boolean(cancelReason && (!otherSelected || cancelDetails.trim()));

  return (
    <Panel
      title="Acompanhar entrega"
      subtitle={"Pedido " + order.id + " · " + (order.fairName ?? "Feiraê") + " · " + order.status}
      onBack={onBack}
    >
      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <div className="tracking-map">
          <span aria-hidden="true">{order.status === "Entregue" ? "✅" : order.status === "Cancelado" ? "✕" : "🛵"}</span>
          <div className="route-line">
            {timeline.map((step, index) => (
              <i key={step} className={config.activeStep >= index || order.status === "Entregue" ? "done" : undefined} />
            ))}
          </div>
          <h2>{config.title}</h2>
          <p>{config.description}</p>
          {["Coleta", "Em rota", "Entregue"].includes(order.status) && (
            <div className="surface-card">
              <span className="eyebrow">Entrega</span>
              {order.driver ? (
                <>
                  <h3>{order.driver.name}</h3>
                  <p>
                    {order.driver.vehicle}
                    {order.driver.plateMasked ? " · placa " + order.driver.plateMasked : ""}
                  </p>
                  <div className="market-meta">
                    {typeof order.driver.distanceKm === "number" && <span>{order.driver.distanceKm.toLocaleString("pt-BR")} km</span>}
                    {typeof order.driver.etaMinutes === "number" && <span>{order.driver.etaMinutes} min</span>}
                    <span>Suporte disponível</span>
                  </div>
                </>
              ) : (
                <p>Os dados do entregador aparecem aqui assim que a corrida for aceita.</p>
              )}
            </div>
          )}
        </div>
        <div className="surface-card">
          <h2>Linha do pedido</h2>
          {timeline.map((text, index) => {
            const completed = order.status === "Entregue" || config.activeStep > index;
            const current = config.activeStep === index;
            const event = order.events?.find((item) => item.label === text);
            return (
              <div className="timeline-item" key={text}>
                <span>{completed ? <Check size={15} /> : current ? <Bike size={15} /> : index + 1}</span>
                <div>
                  <b>{text}</b>
                  <small>
                    {order.status === "Cancelado"
                      ? "Interrompido"
                      : completed
                        ? event?.at ?? "Concluído"
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
              <b>{needsSupport ? "Pedir ajuda com este pedido" : "Cancelar pedido"}</b>
              <p>
                {needsSupport
                  ? "Depois que a coleta começou, o cancelamento vira uma ocorrência de suporte."
                  : "Antes da coleta, escolha o motivo do cancelamento."}
              </p>
              <select value={cancelReason} onChange={(event) => { setCancelReason(event.target.value); setRequestSent(false); }}>
                <option value="">Escolha um motivo</option>
                {needsSupport ? (
                  <>
                    <option>Endereço incorreto</option>
                    <option>Pedido chegou com problema</option>
                    <option>Não consigo receber agora</option>
                    <option>Outro</option>
                  </>
                ) : (
                  <>
                    <option>Pedi por engano</option>
                    <option>Endereço incorreto</option>
                    <option>Demora no atendimento</option>
                    <option>Quero alterar o pedido</option>
                    <option>Problema com pagamento</option>
                    <option>Não preciso mais</option>
                    <option>Outro</option>
                  </>
                )}
              </select>
              {otherSelected && (
                <label>
                  Descreva o motivo
                  <textarea
                    rows={3}
                    value={cancelDetails}
                    onChange={(event) => setCancelDetails(event.target.value)}
                    placeholder="Conte o que aconteceu"
                    required
                  />
                </label>
              )}
              <button
                className="secondary-action"
                disabled={!canSubmit}
                onClick={() => {
                  if (needsSupport) setRequestSent(true);
                  else {
                    onCancel(order.id, cancelReason, cancelDetails.trim());
                    setRequestSent(true);
                  }
                }}
              >
                <XCircle size={17} /> {needsSupport ? "Abrir solicitação de suporte" : "Confirmar cancelamento"}
              </button>
              {requestSent && (
                <p className="inline-success">
                  {needsSupport ? "Solicitação registrada com motivo, data e hora." : "Cancelamento registrado no histórico do pedido."}
                </p>
              )}
            </div>
          )}

          {order.status === "Cancelado" && order.cancelReason && (
            <div className="region-strip">
              <XCircle size={18} />
              <div>
                <b>{order.cancelReason}</b>
                {order.cancelDetails && <p>{order.cancelDetails}</p>}
              </div>
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
  onConfirm: (
    total: number,
    details: { fulfillment: "delivery" | "pickup"; paymentMethod: string; fairName: string },
  ) => void;
}) {
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [payment, setPayment] = useState("Pix");
  const [needsChange, setNeedsChange] = useState(false);
  const [changeFor, setChangeFor] = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [addresses] = usePersistentState<Address[]>("feirae:addresses", []);
  const [cards] = usePersistentState<
    { id: string; holder: string; last4: string; expiry: string; type: string; brand?: string }[]
  >("feirae:cards-v3", []);
  const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];
  const totalWeight = cartWeight(items, cart);
  const hasVariableWeight = items.some((product) => ["kg", "g"].includes(product.unit));
  const fairName = items[0]?.fair ?? "Feiraê";
  const calculatedDeliveryFee = fulfillment === "delivery" ? 8.9 : 0;
  const deliverySubsidy = fulfillment === "delivery" && subtotal >= 80 ? calculatedDeliveryFee : 0;
  const customerDeliveryFee = Math.max(0, calculatedDeliveryFee - deliverySubsidy);
  const total = subtotal + customerDeliveryFee;
  const cardPayment = payment === "Cartão";
  const cashPayment = payment === "Dinheiro na entrega";
  const canConfirm = fulfillment === "pickup" || Boolean(defaultAddress);

  if (!items.length)
    return (
      <Panel title="Sua sacola está vazia" subtitle="Adicione produtos antes de finalizar." onBack={onBack}>
        <Empty title="Nenhum item" text="Volte ao catálogo para começar sua feira." />
      </Panel>
    );

  return (
    <Panel title="Finalizar pedido" subtitle={fairName + " · confira tudo antes de confirmar"} onBack={onBack}>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Step title="1. Como deseja receber?">
            <div className="grid grid-cols-2 gap-3">
              <Choice active={fulfillment === "delivery"} onClick={() => setFulfillment("delivery")} icon={<Truck />} title="Entrega" text="Receba em casa" />
              <Choice active={fulfillment === "pickup"} onClick={() => setFulfillment("pickup")} icon={<Store />} title="Retirada" text="Busque na feira" />
            </div>
          </Step>

          {fulfillment === "delivery" && (
            <Step title="2. Endereço">
              {defaultAddress ? (
                <div className="address-preview">
                  <MapPin />
                  <div>
                    <b>{defaultAddress.label}{defaultAddress.isDefault ? " · principal" : ""}</b>
                    <p>{defaultAddress.details}</p>
                  </div>
                </div>
              ) : (
                <div className="region-strip">
                  <MapPin size={18} />
                  <div>
                    <b>Cadastre um endereço antes de confirmar</b>
                    <p>Use Meus endereços para informar o local manualmente ou pelo GPS.</p>
                  </div>
                </div>
              )}
              <div className="logistics-box">
                <Package size={18} />
                <div>
                  <b>Peso estimado da compra</b>
                  <p>
                    {totalWeight.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg. O peso filtra apenas veículos que não suportam a carga; ele não escolhe o veículo para o cliente.
                  </p>
                </div>
              </div>
            </Step>
          )}

          <Step title={fulfillment === "delivery" ? "3. Pagamento" : "2. Pagamento"}>
            <p className="operation-footnote">Pagar agora</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Choice active={payment === "Pix"} onClick={() => setPayment("Pix")} icon={<Wallet />} title="Pix" text="QR Code e copia e cola" />
              <Choice active={payment === "Cartão"} onClick={() => setPayment("Cartão")} icon={<CreditCard />} title="Cartão" text="Crédito ou débito salvo" />
            </div>
            {fulfillment === "delivery" && (
              <>
                <p className="operation-footnote">Pagar na entrega</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Choice active={payment === "Dinheiro na entrega"} onClick={() => setPayment("Dinheiro na entrega")} icon={<Wallet />} title="Dinheiro" text="Pagamento ao receber" />
                  <Choice active={payment === "Cartão na entrega"} onClick={() => setPayment("Cartão na entrega")} icon={<CreditCard />} title="Cartão na maquininha" text="Se disponível na operação" />
                </div>
              </>
            )}

            {cardPayment && (
              <label>
                Cartão salvo
                <select value={selectedCardId} onChange={(event) => setSelectedCardId(event.target.value)}>
                  <option value="">Escolha um cartão</option>
                  {cards.map((card) => (
                    <option value={card.id} key={card.id}>
                      {(card.brand ?? "Cartão") + " · " + card.type + " · final " + card.last4}
                    </option>
                  ))}
                </select>
                {!cards.length && <small>Cadastre um cartão em Pagamentos e carteira.</small>}
              </label>
            )}

            {cashPayment && (
              <div className="form-card compact">
                <Toggle
                  label="Precisa de troco?"
                  description="Informe apenas se for pagar em dinheiro na entrega."
                  checked={needsChange}
                  onChange={setNeedsChange}
                />
                {needsChange && (
                  <label>
                    Troco para quanto?
                    <input value={changeFor} onChange={(event) => setChangeFor(event.target.value)} placeholder="Ex.: R$ 150,00" />
                  </label>
                )}
              </div>
            )}
          </Step>

          {hasVariableWeight && (
            <div className="region-strip">
              <Package size={18} />
              <div>
                <b>Há produtos vendidos por peso</b>
                <p>Peso e valor são estimados até a separação e ficam registrados no mesmo pedido.</p>
              </div>
            </div>
          )}

          <Step title="Itens do pedido">
            {items.map((product) => (
              <div className="checkout-item" key={product.id}>
                <span>{product.emoji}</span>
                <div>
                  <b>{cart[product.id]}× {product.name}</b>
                  <small>{product.feirante}</small>
                  <small>
                    {productWeight(product, cart[product.id]).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg estimados
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
            <p><span>Feira</span><b>{fairName}</b></p>
            <p><span>Subtotal</span><b>{money(subtotal)}</b></p>
            <p><span>Peso estimado</span><b>{totalWeight.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg</b></p>
            {fulfillment === "delivery" && (
              <>
                <p><span>Frete calculado</span><b>{money(calculatedDeliveryFee)}</b></p>
                {deliverySubsidy > 0 && <p><span>Desconto da banca</span><b>−{money(deliverySubsidy)}</b></p>}
                <p><span>Você paga de entrega</span><b>{customerDeliveryFee ? money(customerDeliveryFee) : "Grátis"}</b></p>
              </>
            )}
            <p><span>Pagamento</span><b>{payment}</b></p>
            <p className="total"><span>{hasVariableWeight ? "Total estimado" : "Total"}</span><b>{money(total)}</b></p>
          </div>
          <button
            disabled={!canConfirm || (cardPayment && !selectedCardId && cards.length > 0)}
            onClick={() => onConfirm(total, { fulfillment, paymentMethod: payment, fairName })}
            className="primary-action w-full"
          >
            Confirmar pedido
          </button>
          {!canConfirm && <small>Cadastre um endereço para entrega antes de confirmar.</small>}
        </aside>
      </div>
    </Panel>
  );
}
export function FavoritesPage({
  ids,
  vendorFavorites,
  onAdd,
  onFavorite,
  onVendorFavorite,
  onVendor,
  onBack,
  onExplore,
}: {
  ids: number[];
  vendorFavorites: string[];
  onAdd: (id: number) => void;
  onFavorite: (id: number) => void;
  onVendorFavorite: (name: string) => void;
  onVendor: (name: string) => void;
  onBack: () => void;
  onExplore: () => void;
}) {
  const favoriteProducts = products.filter((product) => ids.includes(product.id));
  const favoriteVendors = vendorFavorites
    .map((name) => {
      const vendorProducts = products.filter((product) => product.feirante === name);
      return vendorProducts.length ? { name, fair: vendorProducts[0].fair, count: vendorProducts.length } : null;
    })
    .filter(Boolean) as { name: string; fair: string; count: number }[];

  return (
    <Panel title="Favoritos" subtitle="Produtos e bancas que você quer encontrar de novo." onBack={onBack}>
      <SectionHeading eyebrow="Produtos" title="Produtos favoritos" />
      {favoriteProducts.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {favoriteProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={onAdd} favorite onFavorite={onFavorite} />
          ))}
        </div>
      ) : (
        <p className="operation-footnote">Nenhum produto favorito ainda.</p>
      )}

      <SectionHeading eyebrow="Lojas" title="Bancas favoritas" />
      {favoriteVendors.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteVendors.map((vendor) => (
            <article className="vendor-card" key={vendor.name}>
              <Store />
              <div>
                <small>{vendor.fair}</small>
                <h3>{vendor.name}</h3>
                <p>{vendor.count} produto(s) no catálogo.</p>
              </div>
              <div className="item-actions">
                <button className="mini-toggle active" onClick={() => onVendorFavorite(vendor.name)}>
                  <Heart size={15} /> Remover
                </button>
                <button onClick={() => onVendor(vendor.name)}>Ver banca <ChevronRight size={16} /></button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="Nenhuma banca favorita"
          text="Abra uma banca e toque no coração para salvá-la aqui."
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
      source: "manual",
    },
  ]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [label, setLabel] = useState("");
  const [cep, setCep] = useState("");
  const [state, setState] = useState("DF");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [reference, setReference] = useState("");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  function resetForm() {
    setLabel("");
    setCep("");
    setState("DF");
    setCity("");
    setNeighborhood("");
    setStreet("");
    setNumber("");
    setComplement("");
    setReference("");
    setGpsCoords(null);
    setEditingId(null);
    setLocationMessage("");
  }

  function beginEdit(address: Address) {
    setEditingId(address.id);
    setAdding(true);
    setLabel(address.label);
    setCep(address.cep ?? "");
    setState(address.state ?? "DF");
    setCity(address.city ?? "");
    setNeighborhood(address.neighborhood ?? "");
    setStreet(address.street ?? "");
    setNumber(address.number ?? "");
    setComplement(address.complement ?? "");
    setReference(address.reference ?? "");
    setGpsCoords(typeof address.lat === "number" && typeof address.lng === "number" ? { lat: address.lat, lng: address.lng } : null);
    setLocationMessage(address.source === "gps" ? "Endereço obtido por GPS." : "");
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Seu navegador não oferece localização por GPS.");
      return;
    }
    setLocationLoading(true);
    setLocationMessage("Buscando sua localização...");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const nextCoords = { lat: coords.latitude, lng: coords.longitude };
        setGpsCoords(nextCoords);
        if (!label.trim()) setLabel("Localização atual");
        try {
          const response = await fetch(
            "https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=" +
              encodeURIComponent(String(coords.latitude)) +
              "&lon=" +
              encodeURIComponent(String(coords.longitude)),
            { headers: { "Accept-Language": "pt-BR,pt" } },
          );
          if (!response.ok) throw new Error("reverse-geocode");
          const data = (await response.json()) as {
            address?: Record<string, string>;
            display_name?: string;
          };
          const address = data.address ?? {};
          setCep(address.postcode ?? "");
          setState((address.state_code ?? address.state ?? "DF").replace("BR-", "").slice(0, 2).toUpperCase());
          setCity(address.city ?? address.town ?? address.municipality ?? address.village ?? address.county ?? "");
          setNeighborhood(address.suburb ?? address.neighbourhood ?? address.city_district ?? "");
          setStreet(address.road ?? address.pedestrian ?? address.residential ?? "");
          setLocationMessage("GPS localizado. Confira os campos e complete número, complemento e referência.");
        } catch {
          setLocationMessage("GPS localizado, mas o endereço automático não respondeu. Complete os campos restantes.");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        setLocationMessage("Não foi possível acessar o GPS. Você pode preencher o endereço manualmente.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 },
    );
  }

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
    ].filter(Boolean).join(" · ");

    const nextAddress: Address = {
      id: editingId ?? Date.now(),
      label: label.trim(),
      details,
      isDefault: editingId
        ? Boolean(addresses.find((address) => address.id === editingId)?.isDefault)
        : addresses.length === 0,
      cep: cep.trim(),
      state: state.trim(),
      city: city.trim(),
      neighborhood: neighborhood.trim(),
      street: street.trim(),
      number: number.trim(),
      complement: complement.trim(),
      reference: reference.trim(),
      lat: gpsCoords?.lat,
      lng: gpsCoords?.lng,
      source: gpsCoords ? "gps" : "manual",
    };

    setAddresses((current) =>
      editingId
        ? current.map((address) => (address.id === editingId ? nextAddress : address))
        : [...current, nextAddress],
    );
    resetForm();
    setAdding(false);
  }

  const minimumAddressFilled = Boolean(cep.trim() && city.trim() && street.trim() && number.trim());

  return (
    <Panel title="Meus endereços" subtitle="Use o GPS para preencher automaticamente ou informe os dados manualmente." onBack={onBack}>
      <div className="space-y-3">
        {addresses.map((address) => (
          <article className="address-card" key={address.id}>
            <MapPin />
            <div>
              <b>{address.label}</b>
              <p>{address.details}</p>
              <small>{address.source === "gps" ? "Salvo com localização GPS" : "Endereço informado manualmente"}</small>
            </div>
            {address.isDefault && <span>Principal</span>}
            <div className="item-actions">
              {!address.isDefault && (
                <button
                  className="mini-toggle"
                  onClick={() =>
                    setAddresses((current) =>
                      current.map((item) => ({ ...item, isDefault: item.id === address.id })),
                    )
                  }
                >
                  Tornar principal
                </button>
              )}
              <button className="mini-toggle" onClick={() => beginEdit(address)}><Edit3 size={15} /> Editar</button>
              <button
                className="mini-toggle"
                onClick={() => {
                  setAddresses((current) => {
                    const next = current.filter((item) => item.id !== address.id);
                    if (address.isDefault && next.length) next[0] = { ...next[0], isDefault: true };
                    return next;
                  });
                }}
                aria-label={"Excluir endereço " + address.label}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>

      {adding ? (
        <form onSubmit={submit} className="form-card">
          <button type="button" className="secondary-action" onClick={useCurrentLocation} disabled={locationLoading}>
            <MapPin size={17} /> {locationLoading ? "Localizando..." : "Usar minha localização atual"}
          </button>
          {locationMessage && <p className="operation-footnote">{locationMessage}</p>}

          <label>
            Apelido do endereço
            <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Casa, trabalho, outro" required />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label>CEP<input value={cep} onChange={(event) => setCep(event.target.value)} placeholder="00000-000" inputMode="numeric" required /></label>
            <label>Estado<input value={state} onChange={(event) => setState(event.target.value.toUpperCase())} maxLength={2} placeholder="DF" required /></label>
            <label>Cidade/região<input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ex.: Planaltina" required /></label>
            <label>Bairro/setor<input value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} placeholder="Bairro, setor ou condomínio" /></label>
          </div>

          <label>Rua/quadra<input value={street} onChange={(event) => setStreet(event.target.value)} placeholder="Rua, avenida, quadra ou conjunto" required /></label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label>Número/lote<input value={number} onChange={(event) => setNumber(event.target.value)} placeholder="Número, lote ou casa" required /></label>
            <label>Complemento<input value={complement} onChange={(event) => setComplement(event.target.value)} placeholder="Apto., bloco, fundos..." /></label>
          </div>

          <label>Ponto de referência<input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Ex.: portão amarelo" /></label>

          <div className="region-strip">
            <MapPin size={18} />
            <div>
              <b>{minimumAddressFilled ? "Endereço pronto para salvar" : "Complete o endereço"}</b>
              <p>{minimumAddressFilled ? "No checkout, a rota e o frete usam este endereço." : "Informe CEP, cidade/região, rua/quadra e número."}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="primary-action">{editingId ? "Salvar alterações" : "Salvar endereço"}</button>
            <button type="button" onClick={() => { resetForm(); setAdding(false); }} className="secondary-action">Cancelar</button>
          </div>
        </form>
      ) : (
        <button onClick={() => { resetForm(); setAdding(true); }} className="dashed-action"><Plus /> Adicionar endereço</button>
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
    { id: string; holder: string; last4: string; expiry: string; type: string; brand?: string }[]
  >("feirae:cards-v3", [
    { id: "demo-card", holder: "Cliente Feiraê", last4: "4821", expiry: "12/29", type: "Crédito", brand: "Visa" },
  ]);
  const [mode, setMode] = useState<"card" | null>(null);
  const [holder, setHolder] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardType, setCardType] = useState("Crédito");

  function detectBrand(value: string) {
    const digits = value.replace(/\D/g, "");
    if (/^4/.test(digits)) return "Visa";
    if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
    if (/^3[47]/.test(digits)) return "American Express";
    if (/^(606282|3841)/.test(digits)) return "Hipercard";
    if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(digits)) return "Elo";
    return "Bandeira";
  }

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
        brand: detectBrand(digits),
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
    <Panel title="Pagamentos e carteira" subtitle="Escolha como pagar agora ou na entrega, conforme disponibilidade da banca." onBack={onBack}>
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
                    ? cards.map((card) => (card.brand ?? "Cartão") + " · " + card.type + " final " + card.last4 + " · " + card.expiry).join(" · ")
                    : "Nenhum cartão salvo"}
                </small>
                <small>Bandeiras: Visa · Mastercard · Elo · Hipercard · American Express</small>
              </div>
              <button onClick={() => setMode("card")}>Adicionar</button>
            </article>
            <article>
              <Wallet />
              <div>
                <b>Pix</b>
                <small>QR Code e copia e cola são gerados no checkout.</small>
              </div>
            </article>
            <article>
              <Wallet />
              <div>
                <b>Dinheiro</b>
                <small>Disponível como pagamento na entrega. O checkout pergunta se precisa de troco.</small>
              </div>
            </article>
            <article>
              <CreditCard />
              <div>
                <b>Pagamento na entrega</b>
                <small>Dinheiro ou cartão na maquininha quando a operação da banca permitir.</small>
              </div>
            </article>
          </div>

          {cards.length > 0 && (
            <div className="operation-list detailed">
              {cards.map((card) => (
                <article key={card.id}>
                  <CreditCard />
                  <div>
                    <b>{card.brand ?? "Cartão"} · {card.type}</b>
                    <small>Final {card.last4} · validade {card.expiry}</small>
                  </div>
                  <button className="mini-toggle" onClick={() => setCards((current) => current.filter((item) => item.id !== card.id))}>
                    <Trash2 size={15} /> Excluir
                  </button>
                </article>
              ))}
            </div>
          )}

          {mode === "card" && (
            <form className="form-card compact" onSubmit={submit}>
              <label>Nome no cartão<input value={holder} onChange={(event) => setHolder(event.target.value)} autoComplete="cc-name" required /></label>
              <label>
                Número do cartão
                <input value={number} onChange={(event) => setNumber(event.target.value)} placeholder="0000 0000 0000 0000" inputMode="numeric" autoComplete="cc-number" required />
                <small>{detectBrand(number)}</small>
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                <label>Validade<input value={expiry} onChange={(event) => setExpiry(event.target.value)} placeholder="MM/AA" autoComplete="cc-exp" required /></label>
                <label>CVV<input value={cvv} onChange={(event) => setCvv(event.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" autoComplete="cc-csc" placeholder="123" required /></label>
                <label>
                  Tipo
                  <select value={cardType} onChange={(event) => setCardType(event.target.value)}>
                    <option>Crédito</option><option>Débito</option>
                  </select>
                </label>
              </div>
              <p className="operation-footnote">Por segurança, o CVV não é salvo.</p>
              <div className="module-action-row">
                <button className="primary-action" type="submit">Salvar cartão</button>
                <button className="secondary-action" type="button" onClick={() => setMode(null)}>Cancelar</button>
              </div>
            </form>
          )}
        </div>

        <div className="surface-card wallet-card">
          <span className="eyebrow">Carteira</span>
          <h2>R$ 18,90</h2>
          <p>Crédito de reembolso disponível para a próxima compra.</p>
          <div className="finance-breakdown">
            <p><span>Reembolso</span><strong>R$ 18,90</strong></p>
            <p><span>Uso</span><strong>Próxima compra</strong></p>
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
