import { FormEvent, ReactNode, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Bike,
  Check,
  ChevronRight,
  CreditCard,
  Heart,
  Home,
  LocateFixed,
  LogOut,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
  User,
  X,
} from "lucide-react";
import { categories, fairs, initialOrders, products } from "./data";
import type { Address, CustomerTab, DemoOrder, Product, Role, Screen } from "./types";
import { cartSubtotal, filterProducts, money, sortFairsByDistance } from "./utils";
import { usePersistentState } from "./usePersistentState";

const roleLabels: Record<Role, string> = {
  customer: "Cliente",
  feirante: "Feirante",
  delivery: "Entregador",
};

function isRole(value: unknown): value is Role {
  return value === "customer" || value === "feirante" || value === "delivery";
}

export default function App() {
  const [storedRole, setStoredRole] = usePersistentState<unknown>("feirae:session-role", null);
  const role = isRole(storedRole) ? storedRole : null;
  const [tab, setTab] = useState<CustomerTab>("home");
  const [screen, setScreen] = useState<Screen>("main");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [cart, setCart] = usePersistentState<Record<number, number>>("feirae:cart", {});
  const [favorites, setFavorites] = usePersistentState<number[]>("feirae:favorites", [2]);
  const [orders, setOrders] = usePersistentState<DemoOrder[]>("feirae:orders", initialOrders);
  const [cartOpen, setCartOpen] = useState(false);
  const [notifications, setNotifications] = useState(2);
  const [selectedFair, setSelectedFair] = useState(fairs[0].name);
  const [selectedVendor, setSelectedVendor] = useState("Sítio da Vó");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState("Planaltina, DF");
  const [locationLoading, setLocationLoading] = useState(false);
  const [toast, setToast] = useState("");

  const visibleProducts = useMemo(() => filterProducts(products, query, category), [query, category]);
  const cartProducts = products.filter((product) => cart[product.id]);
  const subtotal = cartSubtotal(cartProducts, cart);
  const itemCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const fairsWithDistance = useMemo(() => sortFairsByDistance(fairs, coords), [coords]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }
  function openCustomerTab(nextTab: CustomerTab) {
    setScreen("main");
    setTab(nextTab);
    setCartOpen(false);
  }
  function openScreen(nextScreen: Screen) {
    setScreen(nextScreen);
    setCartOpen(false);
  }
  function login(nextRole: Role) {
    setStoredRole(nextRole);
    setScreen("main");
    setTab("home");
    setCartOpen(false);
  }
  function logout() {
    setStoredRole(null);
    setScreen("main");
    setTab("home");
    setCartOpen(false);
  }
  function addToCart(id: number) {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    setCart((current) => {
      const quantity = current[id] ?? 0;
      if (quantity >= product.stock) {
        notify("Você atingiu o estoque disponível deste produto.");
        return current;
      }
      return { ...current, [id]: quantity + 1 };
    });
  }
  function removeFromCart(id: number, removeAll = false) {
    setCart((current) => {
      const next = { ...current };
      if (removeAll || next[id] === 1) delete next[id];
      else if (next[id]) next[id] -= 1;
      return next;
    });
  }
  function toggleFavorite(id: number) {
    setFavorites((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }
  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationLabel("Localização indisponível");
      notify("Seu navegador não oferece geolocalização.");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: current }) => {
        setCoords({ lat: current.latitude, lng: current.longitude });
        setLocationLabel("Localização atual");
        setLocationLoading(false);
        notify("Feiras ordenadas pela sua proximidade.");
      },
      () => {
        setLocationLabel("Planaltina, DF");
        setLocationLoading(false);
        notify("Não foi possível acessar o GPS. Mantivemos a região informada.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }
  function openMap(lat: number, lng: number) {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      "_blank",
      "noopener,noreferrer",
    );
  }
  function confirmOrder(total: number) {
    const id = `FE-${String(1025 + orders.length).padStart(4, "0")}`;
    const date = new Intl.DateTimeFormat("pt-BR").format(new Date());
    setOrders((current) => [{ id, date, status: "Recebido", value: total }, ...current]);
    setCart({});
    openCustomerTab("orders");
    notify(`Pedido ${id} criado no modo demonstração.`);
  }

  if (!role) return <LoginPage onLogin={login} />;

  return (
    <div className="min-h-screen bg-[var(--fe-bg)] pb-24 text-slate-900 md:pb-8">
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <Header
        role={role}
        tab={tab}
        query={query}
        selectedFair={selectedFair}
        locationLabel={locationLabel}
        locationLoading={locationLoading}
        notifications={notifications}
        itemCount={itemCount}
        onHome={() => (role === "customer" ? openCustomerTab("home") : setScreen("main"))}
        onTab={openCustomerTab}
        onQuery={(value) => {
          setQuery(value);
          if (value) openCustomerTab("products");
        }}
        onFairChange={setSelectedFair}
        onOpenFair={() => openScreen("fair")}
        onLocation={requestLocation}
        onNotifications={() => openScreen("notifications")}
        onCart={() => setCartOpen(true)}
        onLogout={logout}
      />

      <div id="main-content">
        {role === "customer" && screen === "main" && (
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {tab === "home" && (
              <HomePage
                fairItems={fairsWithDistance}
                onTab={openCustomerTab}
                onFair={(name) => {
                  setSelectedFair(name);
                  openScreen("fair");
                }}
                onVendor={(name) => {
                  setSelectedVendor(name);
                  openScreen("feirante");
                }}
                onTracking={() => openScreen("tracking")}
                onMap={openMap}
              />
            )}
            {tab === "fairs" && (
              <FairsPage
                fairItems={fairsWithDistance}
                onFair={(name) => {
                  setSelectedFair(name);
                  openScreen("fair");
                }}
                onMap={openMap}
              />
            )}
            {tab === "products" && (
              <CatalogPage
                items={visibleProducts}
                category={category}
                onCategory={setCategory}
                onAdd={addToCart}
                favorites={favorites}
                onFavorite={toggleFavorite}
              />
            )}
            {tab === "orders" && <OrdersPage orders={orders} onTracking={() => openScreen("tracking")} />}
            {tab === "profile" && <ProfilePage onScreen={openScreen} onLogout={logout} />}
          </main>
        )}
        {role !== "customer" && screen === "main" && (
          <RoleDashboard
            role={role}
            onOpen={() => openScreen(role === "feirante" ? "feiranteOps" : "deliveryOps")}
          />
        )}
        {screen === "fair" && (
          <FairDetail
            fairName={selectedFair}
            onBack={() => openCustomerTab("fairs")}
            onMap={openMap}
            onAdd={addToCart}
          />
        )}
        {screen === "feirante" && (
          <VendorStore
            vendorName={selectedVendor}
            onBack={() => openCustomerTab("home")}
            onAdd={addToCart}
            favorites={favorites}
            onFavorite={toggleFavorite}
          />
        )}
        {screen === "tracking" && <DeliveryTracking onBack={() => openCustomerTab("orders")} />}
        {screen === "checkout" && (
          <Checkout
            items={cartProducts}
            cart={cart}
            subtotal={subtotal}
            onBack={() => setCartOpen(true)}
            onConfirm={confirmOrder}
          />
        )}
        {screen === "favorites" && (
          <FavoritesPage
            ids={favorites}
            onAdd={addToCart}
            onFavorite={toggleFavorite}
            onBack={() => openCustomerTab("profile")}
          />
        )}
        {screen === "notifications" && (
          <NotificationsPage
            onBack={() => openCustomerTab("home")}
            onClear={() => {
              setNotifications(0);
              notify("Notificações marcadas como lidas.");
            }}
          />
        )}
        {screen === "addresses" && <AddressesPage onBack={() => openCustomerTab("profile")} />}
        {screen === "chat" && <ChatPage onBack={() => openCustomerTab("profile")} />}
        {screen === "settings" && <SettingsPage onBack={() => openCustomerTab("profile")} />}
        {screen === "feiranteOps" && <FeiranteOperations onBack={() => setScreen("main")} />}
        {screen === "deliveryOps" && <DeliveryOperations onBack={() => setScreen("main")} />}
      </div>

      {role === "customer" && screen === "main" && <MobileNavigation active={tab} onTab={openCustomerTab} />}
      {cartOpen && (
        <CartDrawer
          items={cartProducts}
          cart={cart}
          subtotal={subtotal}
          onAdd={addToCart}
          onRemove={removeFromCart}
          onClose={() => setCartOpen(false)}
          onCheckout={() => openScreen("checkout")}
        />
      )}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <Check size={17} /> {toast}
        </div>
      )}
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: (role: Role) => void }) {
  const [selectedRole, setSelectedRole] = useState<Role>("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const options: Array<{ role: Role; title: string; text: string; icon: ReactNode }> = [
    {
      role: "customer",
      title: "Cliente",
      text: "Comprar produtos e acompanhar pedidos",
      icon: <ShoppingBag />,
    },
    {
      role: "feirante",
      title: "Feirante",
      text: "Gerenciar sua banca, produtos e vendas",
      icon: <Store />,
    },
    {
      role: "delivery",
      title: "Entregador",
      text: "Aceitar entregas, rotas e acompanhar ganhos",
      icon: <Bike />,
    },
  ];

  function submit(event: FormEvent) {
    event.preventDefault();
    onLogin(selectedRole);
  }

  return (
    <main className="login-page">
      <section className="login-showcase">
        <div className="login-brand">
          <span className="brand-mark">ê</span>
          <b>
            Feiraê<span>.</span>
          </b>
        </div>
        <div>
          <span className="eyebrow light">A feira do seu jeito</span>
          <h1>
            Um aplicativo.
            <br />
            Três experiências.
          </h1>
          <p>Cada pessoa acessa apenas as ferramentas necessárias para sua rotina.</p>
        </div>
        <div className="login-benefits">
          <span>Produtos locais</span>
          <span>Feiras do DF</span>
          <span>Entrega e retirada</span>
        </div>
      </section>
      <section className="login-content">
        <div className="login-form-wrap">
          <span className="eyebrow">Acesso ao Feiraê</span>
          <h2>Como você vai usar o aplicativo?</h2>
          <p className="login-intro">
            Escolha seu tipo de acesso. As telas serão preparadas para essa função.
          </p>
          <div className="role-options" role="radiogroup" aria-label="Tipo de acesso">
            {options.map((option) => (
              <button
                type="button"
                role="radio"
                aria-checked={selectedRole === option.role}
                key={option.role}
                onClick={() => setSelectedRole(option.role)}
                className={selectedRole === option.role ? "selected" : ""}
              >
                <span>{option.icon}</span>
                <span>
                  <b>{option.title}</b>
                  <small>{option.text}</small>
                </span>
                <i>{selectedRole === option.role && <Check size={15} />}</i>
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="login-form">
            <label>
              E-mail
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seuemail@exemplo.com"
                autoComplete="email"
                required
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                minLength={6}
                required
              />
            </label>
            <button type="submit" className="primary-action w-full">
              Entrar como {roleLabels[selectedRole]} <ChevronRight size={18} />
            </button>
          </form>
          <p className="demo-notice">
            Modo demonstração: as credenciais ainda não são validadas. O login real será ativado com o
            Supabase.
          </p>
        </div>
      </section>
    </main>
  );
}

type HeaderProps = {
  role: Role;
  tab: CustomerTab;
  query: string;
  selectedFair: string;
  locationLabel: string;
  locationLoading: boolean;
  notifications: number;
  itemCount: number;
  onHome: () => void;
  onTab: (tab: CustomerTab) => void;
  onQuery: (value: string) => void;
  onFairChange: (value: string) => void;
  onOpenFair: () => void;
  onLocation: () => void;
  onNotifications: () => void;
  onCart: () => void;
  onLogout: () => void;
};
function Header(props: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center gap-3 py-2">
          <button onClick={props.onHome} className="brand" aria-label="Ir para o início do Feiraê">
            <span className="brand-mark" aria-hidden="true">
              ê
            </span>
            <span>
              <b>
                Feiraê<i>.</i>
              </b>
              <small>A feira do seu jeito</small>
            </span>
          </button>
          {props.role === "customer" && (
            <nav className="ml-3 hidden items-center gap-1 lg:flex" aria-label="Navegação principal">
              {(["home", "fairs", "products", "orders"] as CustomerTab[]).map((item) => (
                <button
                  key={item}
                  onClick={() => props.onTab(item)}
                  className={props.tab === item ? "desktop-nav active" : "desktop-nav"}
                >
                  {item === "home"
                    ? "Início"
                    : item === "fairs"
                      ? "Feiras"
                      : item === "products"
                        ? "Produtos"
                        : "Pedidos"}
                </button>
              ))}
            </nav>
          )}
          {props.role === "customer" ? (
            <div className="ml-auto flex items-center gap-2">
              <button onClick={props.onNotifications} className="icon-button" aria-label="Abrir notificações">
                <Bell size={19} />
                {props.notifications > 0 && <span className="badge">{props.notifications}</span>}
              </button>
              <button
                onClick={props.onCart}
                className="cart-button"
                aria-label={`Abrir sacola com ${props.itemCount} itens`}
              >
                <ShoppingBag size={19} />
                <span className="hidden sm:inline">Minha feira</span>
                {props.itemCount > 0 && <span className="cart-count">{props.itemCount}</span>}
              </button>
            </div>
          ) : (
            <div className="ml-auto flex items-center gap-2">
              <span className="role-badge">{roleLabels[props.role]}</span>
              <button onClick={props.onLogout} className="logout-button">
                <LogOut size={17} /> Sair
              </button>
            </div>
          )}
        </div>
        {props.role === "customer" && (
          <div className="grid gap-2 pb-3 md:grid-cols-[minmax(260px,1fr)_auto_auto]">
            <label className="search-field">
              <Search size={18} aria-hidden="true" />
              <span className="sr-only">Buscar produtos, feirantes ou feiras</span>
              <input
                value={props.query}
                onChange={(event) => props.onQuery(event.target.value)}
                placeholder="Busque produtos, feirantes ou feiras"
              />
              {props.query && (
                <button onClick={() => props.onQuery("")} aria-label="Limpar busca">
                  <X size={16} />
                </button>
              )}
            </label>
            <div className="fair-switcher">
              <label htmlFor="current-fair">Feira</label>
              <select
                id="current-fair"
                value={props.selectedFair}
                onChange={(event) => props.onFairChange(event.target.value)}
              >
                {fairs.map((fair) => (
                  <option key={fair.name}>{fair.name}</option>
                ))}
              </select>
              <button onClick={props.onOpenFair}>Abrir</button>
            </div>
            <button onClick={props.onLocation} className="location-button" disabled={props.locationLoading}>
              <LocateFixed size={17} />
              <span>{props.locationLoading ? "Localizando…" : props.locationLabel}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function HomePage({
  fairItems,
  onTab,
  onFair,
  onVendor,
  onTracking,
  onMap,
}: {
  fairItems: ReturnType<typeof sortFairsByDistance>;
  onTab: (tab: CustomerTab) => void;
  onFair: (name: string) => void;
  onVendor: (name: string) => void;
  onTracking: () => void;
  onMap: (lat: number, lng: number) => void;
}) {
  return (
    <div className="space-y-12">
      <section className="hero">
        <div className="relative z-10 max-w-2xl">
          <span className="eyebrow light">Marketplace das feiras do DF</span>
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
            title="Minha feira"
            text="Conhecer bancas e produtos"
            onClick={() => onFair(fairs[0].name)}
          />
          <QuickAction
            icon="🏪"
            title="Lojas"
            text="Comprar de um feirante"
            onClick={() => onVendor("Sítio da Vó")}
          />
          <QuickAction icon="🛵" title="Meu pedido" text="Acompanhar a entrega" onClick={onTracking} />
          <QuickAction
            icon="✨"
            title="Destaques"
            text="Ver produtos selecionados"
            onClick={() => onTab("products")}
          />
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
      <section>
        <SectionHeading
          eyebrow="Perto de você"
          title="Feiras em destaque"
          action="Ver todas"
          onAction={() => onTab("fairs")}
        />
        <div className="grid gap-4 md:grid-cols-3">
          {fairItems.slice(0, 3).map((fair, index) => (
            <FairCard key={fair.name} fair={fair} index={index} onFair={onFair} onMap={onMap} />
          ))}
        </div>
      </section>
    </div>
  );
}

function FairsPage({
  fairItems,
  onFair,
  onMap,
}: {
  fairItems: ReturnType<typeof sortFairsByDistance>;
  onFair: (name: string) => void;
  onMap: (lat: number, lng: number) => void;
}) {
  return (
    <section>
      <PageHeading
        title="Feiras do Distrito Federal"
        subtitle="Escolha onde comprar, retirar ou conhecer novos feirantes."
      />
      <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fairItems.map((fair, index) => (
          <FairCard key={fair.name} fair={fair} index={index} onFair={onFair} onMap={onMap} />
        ))}
      </div>
    </section>
  );
}
function FairCard({
  fair,
  index,
  onFair,
  onMap,
}: {
  fair: ReturnType<typeof sortFairsByDistance>[number];
  index: number;
  onFair: (name: string) => void;
  onMap: (lat: number, lng: number) => void;
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
        <p>
          <Store size={14} /> {fair.feirantes} feirantes{" "}
          {fair.distance !== null && `· ${fair.distance.toFixed(1)} km`}
        </p>
        <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
          <button onClick={() => onFair(fair.name)} className="primary-action">
            Ver feira
          </button>
          <button
            onClick={() => onMap(fair.lat, fair.lng)}
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

function CatalogPage({
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
function ProductCard({
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
  return (
    <article className="product-card">
      <button
        className="favorite-button"
        onClick={() => onFavorite(product.id)}
        aria-label={favorite ? `Remover ${product.name} dos favoritos` : `Favoritar ${product.name}`}
      >
        <Heart size={17} className={favorite ? "fill-red-500 text-red-500" : ""} />
      </button>
      <div className="product-art">
        <span aria-hidden="true">{product.emoji}</span>
        <small>{product.category}</small>
      </div>
      <div className="p-4">
        <small className="vendor-name">{product.feirante}</small>
        <h3>{product.name}</h3>
        <p>{product.fair}</p>
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
        <p className="stock">{product.stock} disponíveis</p>
      </div>
    </article>
  );
}

function OrdersPage({ orders, onTracking }: { orders: DemoOrder[]; onTracking: () => void }) {
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
              <button onClick={onTracking}>Ver detalhes</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
function ProfilePage({ onScreen, onLogout }: { onScreen: (screen: Screen) => void; onLogout: () => void }) {
  const links: Array<[string, string, ReactNode, Screen]> = [
    ["Meus endereços", "Gerencie locais de entrega", <MapPin />, "addresses"],
    ["Favoritos", "Produtos salvos", <Heart />, "favorites"],
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
          <small>CONTA DEMONSTRATIVA</small>
          <h1>Olá, visitante</h1>
          <p>Seus dados serão conectados quando o Supabase for implementado.</p>
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

function FairDetail({
  fairName,
  onBack,
  onMap,
  onAdd,
}: {
  fairName: string;
  onBack: () => void;
  onMap: (lat: number, lng: number) => void;
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
          <p>{fair.feirantes} feirantes cadastrados nesta feira.</p>
        </div>
        <button onClick={() => onMap(fair.lat, fair.lng)} className="secondary-action light">
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
function VendorStore({
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
  return (
    <Panel title={vendorName} subtitle="Loja do feirante" onBack={onBack}>
      <div className="detail-banner">
        <div>
          <Store size={30} />
          <h2>{vendorName}</h2>
          <p>Produtos selecionados direto da feira · avaliação demonstrativa 4,9 ★</p>
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
function DeliveryTracking({ onBack }: { onBack: () => void }) {
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
        </div>
      </div>
    </Panel>
  );
}

function Checkout({
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

function FavoritesPage({
  ids,
  onAdd,
  onFavorite,
  onBack,
}: {
  ids: number[];
  onAdd: (id: number) => void;
  onFavorite: (id: number) => void;
  onBack: () => void;
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
        <Empty title="Nenhum favorito" text="Toque no coração de um produto para salvá-lo aqui." />
      )}
    </Panel>
  );
}
function NotificationsPage({ onBack, onClear }: { onBack: () => void; onClear: () => void }) {
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

function AddressesPage({ onBack }: { onBack: () => void }) {
  const [addresses, setAddresses] = usePersistentState<Address[]>("feirae:addresses", [
    { id: 1, label: "Casa", details: "Planaltina, DF · endereço demonstrativo", isDefault: true },
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
    <Panel title="Meus endereços" subtitle="Locais salvos apenas neste dispositivo." onBack={onBack}>
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
            Nome do endereço
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Ex.: Trabalho"
              required
            />
          </label>
          <label>
            Endereço completo
            <input
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Região, rua e número"
              required
            />
          </label>
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
function ChatPage({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState(["Olá! Como podemos ajudar com seu pedido?"]);
  const [message, setMessage] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;
    setMessages((current) => [
      ...current,
      message.trim(),
      "Mensagem recebida. O suporte real será conectado na próxima fase.",
    ]);
    setMessage("");
  }
  return (
    <Panel title="Suporte Feiraê" subtitle="Atendimento local demonstrativo" onBack={onBack}>
      <div className="chat-card">
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
function SettingsPage({ onBack }: { onBack: () => void }) {
  const [offers, setOffers] = usePersistentState("feirae:offers", true);
  const [orderUpdates, setOrderUpdates] = usePersistentState("feirae:order-updates", true);
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
      </div>
    </Panel>
  );
}

function RoleDashboard({ role, onOpen }: { role: Role; onOpen: () => void }) {
  const config =
    role === "feirante"
      ? {
          icon: <Store />,
          title: "Painel do feirante",
          subtitle: "Pedidos, produtos e operação da sua banca",
          metrics: [
            ["24", "pedidos"],
            ["R$ 1.842", "vendas"],
            ["3", "estoque baixo"],
            ["4,9", "avaliação"],
          ],
        }
      : {
          icon: <Bike />,
          title: "Central do entregador",
          subtitle: "Entregas, rotas e ganhos",
          metrics: [
            ["8", "disponíveis"],
            ["2", "em rota"],
            ["R$ 186", "ganhos hoje"],
            ["4,9", "avaliação"],
          ],
        };
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="role-heading">
        <span>{config.icon}</span>
        <div>
          <small>MODO DEMONSTRAÇÃO</small>
          <h1>{config.title}</h1>
          <p>{config.subtitle}</p>
        </div>
      </div>
      <div className="metrics">
        {config.metrics.map(([value, label]) => (
          <article key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </div>
      <button onClick={onOpen} className="primary-action mt-6">
        Abrir central operacional <ChevronRight size={18} />
      </button>
    </main>
  );
}
function FeiranteOperations({ onBack }: { onBack: () => void }) {
  const modules = [
    "Pedidos",
    "Produtos",
    "Estoque",
    "Minha loja",
    "Promoções",
    "Financeiro",
    "Avaliações",
    "Horários",
  ];
  const [active, setActive] = useState("Pedidos");
  const [status, setStatus] = useState("Recebido");
  return (
    <Panel title="Operação do feirante" subtitle="Dados locais demonstrativos" onBack={onBack}>
      <ModuleTabs modules={modules} active={active} onActive={setActive} />
      <div className="surface-card">
        <span className="eyebrow">{active}</span>
        <h2>{active === "Pedidos" ? "Pedido FE-1027" : `Gerenciar ${active.toLocaleLowerCase("pt-BR")}`}</h2>
        {active === "Pedidos" ? (
          <>
            <p>3 itens · R$ 86,80 · Cliente de Planaltina</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Recebido", "Preparando", "Pronto para coleta"].map((item) => (
                <button
                  key={item}
                  onClick={() => setStatus(item)}
                  className={status === item ? "status-button active" : "status-button"}
                >
                  {item}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p>O conteúdo real deste módulo será sincronizado com o Supabase na próxima fase.</p>
        )}
      </div>
    </Panel>
  );
}
function DeliveryOperations({ onBack }: { onBack: () => void }) {
  const [online, setOnline] = useState(true);
  const [accepted, setAccepted] = useState<string[]>([]);
  const deliveries = [
    "FE-1024 · Feira do Produtor → Planaltina",
    "FE-1025 · Feira Central → Asa Norte",
    "FE-1026 · Feira da Torre → Sudoeste",
  ];
  return (
    <Panel title="Central do entregador" subtitle="Entregas locais demonstrativas" onBack={onBack}>
      <div className="surface-card">
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
        <div className="mt-6 space-y-3">
          {deliveries.map((delivery) => (
            <article className="delivery-row" key={delivery}>
              <span>
                <Bike />
              </span>
              <b>{delivery}</b>
              <button
                disabled={!online || accepted.includes(delivery)}
                onClick={() => setAccepted((current) => [...current, delivery])}
              >
                {accepted.includes(delivery) ? "Aceita" : "Aceitar"}
              </button>
            </article>
          ))}
        </div>
      </div>
    </Panel>
  );
}
function CartDrawer({
  items,
  cart,
  subtotal,
  onAdd,
  onRemove,
  onClose,
  onCheckout,
}: {
  items: Product[];
  cart: Record<number, number>;
  subtotal: number;
  onAdd: (id: number) => void;
  onRemove: (id: number, all?: boolean) => void;
  onClose: () => void;
  onCheckout: () => void;
}) {
  return (
    <div
      className="drawer-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div className="drawer-header">
          <div>
            <small>SUA COMPRA</small>
            <h2 id="cart-title">Minha Feira</h2>
          </div>
          <button onClick={onClose} aria-label="Fechar sacola">
            <X />
          </button>
        </div>
        <div className="drawer-body">
          {items.length ? (
            items.map((product) => (
              <article className="cart-item" key={product.id}>
                <span>{product.emoji}</span>
                <div>
                  <b>{product.name}</b>
                  <small>{product.feirante}</small>
                  <strong>{money(product.price * cart[product.id])}</strong>
                  <div>
                    <button
                      onClick={() => onRemove(product.id)}
                      aria-label={`Remover uma unidade de ${product.name}`}
                    >
                      <Minus size={15} />
                    </button>
                    <span>{cart[product.id]}</span>
                    <button
                      onClick={() => onAdd(product.id)}
                      aria-label={`Adicionar uma unidade de ${product.name}`}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(product.id, true)}
                  aria-label={`Excluir ${product.name} da sacola`}
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))
          ) : (
            <Empty title="Sua sacola está vazia" text="Adicione produtos para começar sua feira." />
          )}
        </div>
        {items.length > 0 && (
          <div className="drawer-footer">
            <p>
              <span>Subtotal</span>
              <b>{money(subtotal)}</b>
            </p>
            <button onClick={onCheckout} className="primary-action w-full">
              Continuar para checkout
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
function MobileNavigation({ active, onTab }: { active: CustomerTab; onTab: (tab: CustomerTab) => void }) {
  const items: Array<[CustomerTab, string, ReactNode]> = [
    ["home", "Início", <Home />],
    ["fairs", "Feiras", <Store />],
    ["orders", "Pedidos", <Package />],
    ["profile", "Perfil", <User />],
  ];
  return (
    <nav className="mobile-nav" aria-label="Navegação móvel">
      {items.map(([item, label, icon]) => (
        <button key={item} onClick={() => onTab(item)} className={active === item ? "active" : ""}>
          {icon}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
function Panel({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <button onClick={onBack} className="back-button">
        <ArrowLeft size={17} /> Voltar
      </button>
      <PageHeading title={title} subtitle={subtitle} />
      <div className="mt-6">{children}</div>
    </main>
  );
}
function PageHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="page-heading">
      <span className="eyebrow">Feiraê</span>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}
function SectionHeading({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action && (
        <button onClick={onAction}>
          {action} <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}
function QuickAction({
  icon,
  title,
  text,
  onClick,
}: {
  icon: string;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="quick-action">
      <span aria-hidden="true">{icon}</span>
      <b>{title}</b>
      <small>{text}</small>
      <ChevronRight />
    </button>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <ShoppingBag size={34} />
      <b>{title}</b>
      <p>{text}</p>
    </div>
  );
}
function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="surface-card">
      <h2>{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
function Choice({
  active,
  onClick,
  icon,
  title,
  text,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <button onClick={onClick} className={active ? "choice active" : "choice"}>
      <span>{icon}</span>
      <b>{title}</b>
      <small>{text}</small>
    </button>
  );
}
function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <span>
        <b>{label}</b>
        <small>{description}</small>
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}
function ModuleTabs({
  modules,
  active,
  onActive,
}: {
  modules: string[];
  active: string;
  onActive: (module: string) => void;
}) {
  return (
    <div className="module-tabs">
      {modules.map((module) => (
        <button key={module} onClick={() => onActive(module)} className={active === module ? "active" : ""}>
          {module}
        </button>
      ))}
    </div>
  );
}
