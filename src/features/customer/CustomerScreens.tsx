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
        <small>{fair.status}</small>
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
  category,
  onCategory,
  onAdd,
  favorites,
  onFavorite,
}: {
  items: Product[];
  category: string;
  onCategory: (category: string) => void;
  onAdd: (id: number) => void;
  favorites: number[];
  onFavorite: (id: number) => void;
}) {
  return (
    <section>
      <PageHeading title="Produtos da feira" subtitle={`${items.length} produtos encontrados.`} />
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
  onTracking: () => void;
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
                <button onClick={onTracking}>Ver detalhes</button>
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
    <Panel title={fair.name} subtitle={`${fair.place} · ${fair.status}`} onBack={onBack}>
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

export function VendorsPage({ onBack, onVendor }: { onBack: () => void; onVendor: (name: string) => void }) {
  const vendors = vendorSummaries(products, vendorMetrics);
  return (
    <Panel
      title="Bancas e feirantes"
      subtitle="Escolha uma banca antes de ver os produtos. Lojas não abrem mais uma banca fixa."
      onBack={onBack}
    >
      <div className="region-strip">
        <MapPin size={18} />
        <div>
          <b>Região de compra</b>
          <p>Estado: Distrito Federal · Cidade: Planaltina · altere nas configurações quando expandir.</p>
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
  onBack,
  onAdd,
  favorites,
  onFavorite,
}: {
  vendorName: string;
  onBack: () => void;
  onAdd: (id: number) => void;
  favorites: number[];
  onFavorite: (id: number) => void;
}) {
  const vendorProducts = products.filter((product) => product.feirante === vendorName);
  const metrics = metricForVendor(vendorName, vendorMetrics);
  return (
    <Panel title={vendorName} subtitle="Loja do feirante" onBack={onBack}>
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
export function DeliveryTracking({ onBack }: { onBack: () => void }) {
  const [cancelReason, setCancelReason] = useState("");
  const [showReview, setShowReview] = useState(false);
  return (
    <Panel title="Acompanhar entrega" subtitle="Pedido demonstrativo FE-1024" onBack={onBack}>
      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <div className="tracking-map">
          <span aria-hidden="true">🛵</span>
          <div className="route-line">
            <i />
            <i />
            <i />
            <i />
          </div>
          <h2>Seu pedido está a caminho</h2>
          <p>Previsão estimada: 20–35 minutos.</p>
        </div>
        <div className="surface-card">
          <h2>Linha do pedido</h2>
          {["Pedido confirmado", "Produtos separados", "Coleta concluída", "Entregador em rota"].map(
            (text, index) => (
              <div className="timeline-item" key={text}>
                <span>{index < 3 ? <Check size={15} /> : <Bike size={15} />}</span>
                <div>
                  <b>{text}</b>
                  <small>{index < 3 ? "Concluído" : "Agora"}</small>
                </div>
              </div>
            ),
          )}
          <div className="cancel-panel">
            <b>Cancelar ou pedir ajuda</b>
            <p>
              Depois da coleta, o cancelamento precisa de suporte para proteger cliente, banca e entregador.
            </p>
            <select value={cancelReason} onChange={(event) => setCancelReason(event.target.value)}>
              <option value="">Escolha um motivo</option>
              <option>Desisti do pedido</option>
              <option>Endereço errado</option>
              <option>Cliente ausente</option>
              <option>Produto danificado</option>
              <option>Emergência na entrega</option>
            </select>
            <button className="secondary-action">
              <XCircle size={17} /> Solicitar cancelamento
            </button>
          </div>
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
            <div className="grid gap-2 sm:grid-cols-3">
              {["Pix", "Cartão", "Dinheiro"].map((method) => (
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
              <span>Total</span>
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
export function NotificationsPage({ onBack, onClear }: { onBack: () => void; onClear: () => void }) {
  return (
    <Panel title="Notificações" subtitle="Pedidos, ofertas e novidades." onBack={onBack}>
      <div className="mb-4 flex justify-end">
        <button onClick={onClear} className="text-button">
          Marcar todas como lidas
        </button>
      </div>
      {[
        "Seu pedido FE-1024 saiu para entrega.",
        "Novo desconto na Feira do Produtor.",
        "Sítio da Vó adicionou produtos ao catálogo.",
        "Seu pedido FE-1019 foi entregue.",
      ].map((text, index) => (
        <article key={text} className={index < 2 ? "notification unread" : "notification"}>
          <span>
            <Bell size={18} />
          </span>
          <div>
            <b>{text}</b>
            <small>{index + 1} h atrás</small>
          </div>
        </article>
      ))}
    </Panel>
  );
}

export function AddressesPage({ onBack }: { onBack: () => void }) {
  const [addresses, setAddresses] = usePersistentState<Address[]>("feirae:addresses", [
    {
      id: 1,
      label: "Casa",
      details: "Planaltina - DF · próximo à Feira Permanente · entrega disponível",
      isDefault: true,
    },
  ]);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [details, setDetails] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!label.trim() || !details.trim()) return;
    setAddresses((current) => [
      ...current,
      { id: Date.now(), label: label.trim(), details: details.trim(), isDefault: false },
    ]);
    setLabel("");
    setDetails("");
    setAdding(false);
  }
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
          <label>
            Endereço completo
            <input
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="CEP, estado, cidade, bairro, rua/quadra e número"
              required
            />
          </label>
          <label>
            Ponto de referência
            <input placeholder="Ex.: perto da Feira Permanente" />
          </label>
          <div className="region-strip">
            <MapPin size={18} />
            <div>
              <b>Entrega disponível para essa região</b>
              <p>Taxa estimada R$ 6,90 · 35-50 min · sujeito a peso e veículo.</p>
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
    email: session.email,
    phone: "",
    password: "",
  });
  const [saved, setSaved] = useState(false);
  function submit(event: FormEvent) {
    event.preventDefault();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }
  return (
    <Panel title="Minha conta" subtitle="Dados básicos para editar sua conta no Feiraê." onBack={onBack}>
      <form className="form-card max-w-2xl" onSubmit={submit}>
        <label>
          Nome
          <input
            value={profile.name}
            onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
          />
        </label>
        <label>
          E-mail
          <input
            value={profile.email}
            type="email"
            onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
          />
        </label>
        <label>
          Telefone
          <input
            value={profile.phone}
            onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
            placeholder="(61) 99999-9999"
          />
        </label>
        <label>
          Nova senha
          <input
            value={profile.password}
            onChange={(event) => setProfile((current) => ({ ...current, password: event.target.value }))}
            type="password"
            placeholder="Mínimo 6 caracteres"
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
  const [cards, setCards] = usePersistentState("feirae:cards", ["Cartão final 4821"]);
  const [pixKeys, setPixKeys] = usePersistentState("feirae:pix", ["fernanda@email.com"]);
  const [mode, setMode] = useState<"card" | "pix" | null>(null);
  const [field, setField] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!field.trim() || !mode) return;
    if (mode === "card") setCards((current) => [`Cartão final ${field.trim().slice(-4)}`, ...current]);
    else setPixKeys((current) => [field.trim(), ...current]);
    setField("");
    setMode(null);
  }
  return (
    <Panel
      title="Pagamentos e carteira"
      subtitle="O app mostra pagamento nativo, mesmo usando provedor externo por trás."
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
                <small>{cards.length ? cards.join(" · ") : "Cadastrar cartão para pedidos futuros"}</small>
              </div>
              <button onClick={() => setMode("card")}>Adicionar</button>
            </article>
            <article>
              <Wallet />
              <div>
                <b>Pix</b>
                <small>{pixKeys.length ? pixKeys.join(" · ") : "Gerar Pix no fechamento do pedido"}</small>
              </div>
              <button onClick={() => setMode("pix")}>Configurar</button>
            </article>
          </div>
          {mode && (
            <form className="form-card compact" onSubmit={submit}>
              <label>
                {mode === "card" ? "Número do cartão" : "Chave Pix"}
                <input
                  value={field}
                  onChange={(event) => setField(event.target.value)}
                  placeholder={
                    mode === "card" ? "0000 0000 0000 0000" : "CPF, e-mail, telefone ou chave aleatória"
                  }
                  required
                />
              </label>
              <div className="module-action-row">
                <button className="primary-action" type="submit">
                  Salvar {mode === "card" ? "cartão" : "Pix"}
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
          <p>Crédito de reembolso disponível para a próxima compra.</p>
          <div className="finance-breakdown">
            <p>
              <span>Cupom ativo</span>
              <strong>FEIRA10</strong>
            </p>
            <p>
              <span>Reembolso</span>
              <strong>R$ 18,90</strong>
            </p>
            <p>
              <span>Expira em</span>
              <strong>30 dias</strong>
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function RatingsPage({ onBack }: { onBack: () => void }) {
  const reviews = [
    ["Produto", "Cesta de frutas", "5,0", "Frutas bonitas e bem embaladas."],
    ["Banca", "Sítio da Vó", "4,9", "Atendimento rápido na separação."],
    ["Entrega", "FE-1024", "4,8", "Entrega cuidadosa e dentro do prazo."],
    ["App", "Experiência mensal", "4,7", "Avaliação solicitada uma vez por mês."],
  ];
  return (
    <Panel
      title="Minhas avaliações"
      subtitle="Cliente, banca, entregador e app se avaliam no fluxo certo."
      onBack={onBack}
    >
      <div className="review-grid">
        {reviews.map(([type, target, rating, text]) => (
          <article className="review-card" key={`${type}-${target}`}>
            <strong>{rating} ★</strong>
            <div>
              <b>
                {type} · {target}
              </b>
              <small>{text}</small>
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
  const [whatsapp, setWhatsapp] = usePersistentState("feirae:whatsapp", true);
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
          label="Avisos por WhatsApp"
          description="Receber resumo do pedido e mudança de entrega"
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
