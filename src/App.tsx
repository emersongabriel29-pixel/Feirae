import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Bike,
  CalendarClock,
  Check,
  ChevronRight,
  CreditCard,
  Edit3,
  Eye,
  EyeOff,
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
  Star,
  Store,
  Trash2,
  Truck,
  User,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { categories, fairs, initialOrders, products, vendorMetrics } from "./data";
import type { Address, CustomerTab, DemoOrder, DemoSession, Product, Role, Screen } from "./types";
import { cartSubtotal, filterProducts, money, sortFairsByDistance } from "./utils";
import { usePersistentState } from "./usePersistentState";

const roleLabels: Record<Role, string> = {
  customer: "Cliente",
  feirante: "Feirante",
  delivery: "Entregador",
};

const vehicleRules = [
  { name: "Bicicleta", maxKg: 5, note: "pedidos leves e próximos" },
  { name: "Moto", maxKg: 12, note: "sacola pequena ou média" },
  { name: "Moto com baú", maxKg: 20, note: "compras médias com volume controlado" },
  { name: "Carro", maxKg: 80, note: "compras pesadas, caixas e várias bancas" },
];

function productWeight(product: Product, quantity: number) {
  return product.weightKg * quantity;
}

function cartWeight(items: Product[], cart: Record<number, number>) {
  return items.reduce((sum, product) => sum + productWeight(product, cart[product.id] ?? 0), 0);
}

function vehicleForWeight(weight: number) {
  return vehicleRules.find((rule) => weight <= rule.maxKg) ?? vehicleRules[vehicleRules.length - 1];
}

function ratingLabel(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function minutesLabel(range: [number, number]) {
  return `${range[0]}-${range[1]} min`;
}

function metricForVendor(name: string) {
  return vendorMetrics[name] ?? { rating: 4.8, reviewCount: 100, deliveryMinutes: [40, 60], deliveryFee: 9.9 };
}

function vendorSummaries() {
  return Array.from(new Set(products.map((product) => product.feirante))).map((name) => {
    const vendorProducts = products.filter((product) => product.feirante === name);
    const metrics = metricForVendor(name);
    return {
      name,
      fair: vendorProducts[0]?.fair ?? "Feira",
      categories: Array.from(new Set(vendorProducts.map((product) => product.category))).slice(0, 3),
      products: vendorProducts.length,
      ...metrics,
    };
  });
}

function isRole(value: unknown): value is Role {
  return value === "customer" || value === "feirante" || value === "delivery";
}

function readSession(value: unknown): DemoSession | null {
  if (isRole(value)) return { role: value, email: "demo@feirae.app", name: "Conta de teste" };
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<DemoSession>;
  if (!isRole(candidate.role) || typeof candidate.email !== "string" || typeof candidate.name !== "string") {
    return null;
  }
  return { role: candidate.role, email: candidate.email, name: candidate.name };
}

function nameFromEmail(email: string) {
  const rawName = email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim();
  if (!rawName) return "Conta de teste";
  return rawName.replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase("pt-BR"));
}

function resetViewport() {
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function updateHash(route: string, replace = false) {
  const url = `${window.location.pathname}${window.location.search}#${route}`;
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
}

export default function App() {
  const [storedSession, setStoredSession] = usePersistentState<unknown>("feirae:session", null);
  const session = readSession(storedSession);
  const role = session?.role ?? null;
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

  useEffect(() => {
    resetViewport();
  }, [role, screen, tab]);

  useEffect(() => {
    if (!role) {
      if (window.location.hash !== "#/entrar") updateHash("/entrar", true);
      return;
    }

    function syncFromUrl() {
      const route = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      if (role === "feirante") {
        setScreen(route === "/feirante/operacao" ? "feiranteOps" : "main");
        return;
      }
      if (role === "delivery") {
        setScreen(route === "/entregador/entregas" ? "deliveryOps" : "main");
        return;
      }
      const tabRoutes: Record<string, CustomerTab> = {
        "/cliente/inicio": "home",
        "/cliente/feiras": "fairs",
        "/cliente/produtos": "products",
        "/cliente/pedidos": "orders",
        "/cliente/perfil": "profile",
      };
      if (tabRoutes[route]) {
        setScreen("main");
        setTab(tabRoutes[route]);
        return;
      }
      const screenRoutes: Record<string, Screen> = {
        "/cliente/rastreamento": "tracking",
        "/cliente/checkout": "checkout",
        "/cliente/bancas": "vendors",
        "/cliente/favoritos": "favorites",
        "/cliente/notificacoes": "notifications",
        "/cliente/enderecos": "addresses",
        "/cliente/conta": "account",
        "/cliente/pagamentos": "payments",
        "/cliente/avaliacoes": "ratings",
        "/cliente/suporte": "chat",
        "/cliente/configuracoes": "settings",
      };
      if (screenRoutes[route]) {
        setScreen(screenRoutes[route]);
        return;
      }
      if (route.startsWith("/feiras/")) {
        const fairName = route.slice("/feiras/".length);
        if (fairs.some((fair) => fair.name === fairName)) setSelectedFair(fairName);
        setScreen("fair");
        return;
      }
      if (route.startsWith("/lojas/")) {
        setSelectedVendor(route.slice("/lojas/".length));
        setScreen("feirante");
        return;
      }
      setScreen("main");
      setTab("home");
      updateHash("/cliente/inicio", true);
    }

    if (!window.location.hash || window.location.hash === "#/entrar") {
      updateHash(
        role === "customer" ? "/cliente/inicio" : role === "feirante" ? "/feirante" : "/entregador",
        true,
      );
    }
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [role]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }
  function openCustomerTab(nextTab: CustomerTab) {
    setScreen("main");
    setTab(nextTab);
    setCartOpen(false);
    const routes: Record<CustomerTab, string> = {
      home: "/cliente/inicio",
      fairs: "/cliente/feiras",
      products: "/cliente/produtos",
      orders: "/cliente/pedidos",
      profile: "/cliente/perfil",
    };
    updateHash(routes[nextTab]);
  }
  function openScreen(nextScreen: Screen) {
    setScreen(nextScreen);
    setCartOpen(false);
    const routes: Partial<Record<Screen, string>> = {
      tracking: "/cliente/rastreamento",
      checkout: "/cliente/checkout",
      vendors: "/cliente/bancas",
      favorites: "/cliente/favoritos",
      notifications: "/cliente/notificacoes",
      addresses: "/cliente/enderecos",
      account: "/cliente/conta",
      payments: "/cliente/pagamentos",
      ratings: "/cliente/avaliacoes",
      chat: "/cliente/suporte",
      settings: "/cliente/configuracoes",
      feiranteOps: "/feirante/operacao",
      deliveryOps: "/entregador/entregas",
    };
    if (nextScreen === "fair") updateHash(`/feiras/${encodeURIComponent(selectedFair)}`);
    else if (nextScreen === "feirante") updateHash(`/lojas/${encodeURIComponent(selectedVendor)}`);
    else if (routes[nextScreen]) updateHash(routes[nextScreen]);
  }
  function login(nextRole: Role, email: string) {
    setStoredSession({ role: nextRole, email, name: nameFromEmail(email) });
    setScreen("main");
    setTab("home");
    setCartOpen(false);
    updateHash(
      nextRole === "customer" ? "/cliente/inicio" : nextRole === "feirante" ? "/feirante" : "/entregador",
      true,
    );
  }
  function logout() {
    setStoredSession(null);
    setScreen("main");
    setTab("home");
    setCartOpen(false);
    updateHash("/entrar", true);
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
  function buyAgain(orderId?: string) {
    const demoBasket: Record<number, number> = {
      1: 1,
      2: 1,
      9: 2,
    };
    setCart((current) => ({ ...current, ...demoBasket }));
    setCartOpen(true);
    notify(orderId ? `Itens do pedido ${orderId} voltaram para a sacola.` : "Última compra voltou para a sacola.");
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
        onHome={() => {
          if (role === "customer") openCustomerTab("home");
          else {
            setScreen("main");
            updateHash(role === "feirante" ? "/feirante" : "/entregador");
          }
        }}
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
                onTab={openCustomerTab}
                onFair={(name) => {
                  setSelectedFair(name);
                  setScreen("fair");
                  updateHash(`/feiras/${encodeURIComponent(name)}`);
                }}
                onVendors={() => openScreen("vendors")}
                onTracking={() => openScreen("tracking")}
              />
            )}
            {tab === "fairs" && (
              <FairsPage
                fairItems={fairsWithDistance}
                onFair={(name) => {
                  setSelectedFair(name);
                  setScreen("fair");
                  updateHash(`/feiras/${encodeURIComponent(name)}`);
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
            {tab === "orders" && (
              <OrdersPage
                orders={orders}
                onTracking={() => openScreen("tracking")}
                onBuyAgain={buyAgain}
              />
            )}
            {tab === "profile" && session && (
              <ProfilePage session={session} onScreen={openScreen} onLogout={logout} />
            )}
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
        {screen === "vendors" && (
          <VendorsPage
            onBack={() => openCustomerTab("home")}
            onVendor={(name) => {
              setSelectedVendor(name);
              setScreen("feirante");
              updateHash(`/lojas/${encodeURIComponent(name)}`);
            }}
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
            onExplore={() => openCustomerTab("products")}
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
        {screen === "account" && session && <AccountPage session={session} onBack={() => openCustomerTab("profile")} />}
        {screen === "payments" && <PaymentsPage onBack={() => openCustomerTab("profile")} />}
        {screen === "ratings" && <RatingsPage onBack={() => openCustomerTab("profile")} />}
        {screen === "chat" && <ChatPage onBack={() => openCustomerTab("profile")} />}
        {screen === "settings" && <SettingsPage onBack={() => openCustomerTab("profile")} />}
        {screen === "feiranteOps" && (
          <FeiranteOperations
            onBack={() => {
              setScreen("main");
              updateHash("/feirante");
            }}
          />
        )}
        {screen === "deliveryOps" && (
          <DeliveryOperations
            onBack={() => {
              setScreen("main");
              updateHash("/entregador");
            }}
            onMap={() => openMap(-15.621, -47.657)}
          />
        )}
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
          onBuyAgain={() => buyAgain()}
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

function LoginPage({ onLogin }: { onLogin: (role: Role, email: string) => void }) {
  const [selectedRole, setSelectedRole] = useState<Role>("customer");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    onLogin(selectedRole, email.trim());
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
          <div className="auth-switch" role="tablist" aria-label="Entrar ou criar conta">
            <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>
              Entrar
            </button>
            <button className={mode === "signup" ? "active" : ""} type="button" onClick={() => setMode("signup")}>
              Criar conta
            </button>
          </div>
          <h2>{mode === "login" ? "Como você vai usar o aplicativo?" : "Crie sua conta no Feiraê"}</h2>
          <p className="login-intro">
            {mode === "login"
              ? "Escolha seu tipo de acesso. As telas serão preparadas para essa função."
              : "Cliente entra rápido. Feirante e entregador passam por cadastro, documentos e validação."}
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
            {mode === "signup" && (
              <label>
                Nome completo
                <input placeholder="Seu nome" autoComplete="name" required />
              </label>
            )}
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
            <label className="password-field">
              Senha
              <span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            {mode === "signup" && selectedRole === "feirante" && (
              <div className="signup-requirements">
                <b>Cadastro de feirante</b>
                <span>Banca, feira, box, documentos, horários e validação antes de vender.</span>
              </div>
            )}
            {mode === "signup" && selectedRole === "delivery" && (
              <div className="signup-requirements">
                <b>Cadastro de entregador</b>
                <span>Veículo, capacidade, CNH/documentos, foto e validação antes de aceitar corridas.</span>
              </div>
            )}
            <button type="submit" className="primary-action w-full">
              {mode === "login" ? "Entrar" : "Criar conta"} como {roleLabels[selectedRole]}{" "}
              <ChevronRight size={18} />
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
  const [contextOpen, setContextOpen] = useState(false);
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
          <div className="customer-tools">
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
            <button
              type="button"
              className="context-toggle"
              onClick={() => setContextOpen((value) => !value)}
              aria-expanded={contextOpen}
            >
              <MapPin size={16} />
              <span>
                <b>{props.selectedFair}</b>
                <small>{props.locationLoading ? "Localizando…" : props.locationLabel}</small>
              </span>
              <ChevronRight size={17} />
            </button>
            <div className={contextOpen ? "header-context open" : "header-context"}>
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
          </div>
        )}
      </div>
    </header>
  );
}

function HomePage({
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
          <QuickAction
            icon="🏪"
            title="Bancas"
            text="Escolher feirantes"
            onClick={onVendors}
          />
          <QuickAction icon="🛵" title="Meu pedido" text="Acompanhar a entrega" onClick={onTracking} />
          <QuickAction
            icon="✨"
            title="Promoções"
            text="Ofertas do dia"
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
        title="Escolha sua feira"
        subtitle="Comece por estado, cidade e feira. No momento a operação demonstrativa está carregada no DF."
      />
      <div className="region-selector">
        <label>
          Estado
          <select defaultValue="Distrito Federal">
            <option>Distrito Federal</option>
            <option>Goiás</option>
            <option>São Paulo</option>
            <option>Minas Gerais</option>
          </select>
        </label>
        <label>
          Cidade/região
          <select defaultValue="Planaltina">
            <option>Planaltina</option>
            <option>Plano Piloto</option>
            <option>Guará</option>
            <option>Ceilândia</option>
          </select>
        </label>
      </div>
      <div className="mt-7">
        <SectionHeading eyebrow="Perto de você" title="Feiras em destaque" />
        <div className="grid gap-4 md:grid-cols-3">
          {fairItems.slice(0, 3).map((fair, index) => (
            <FairCard key={fair.name} fair={fair} index={index} onFair={onFair} onMap={onMap} />
          ))}
        </div>
      </div>
      <section className="mt-12">
        <SectionHeading eyebrow="Explore por região" title="Outras feiras" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {fairItems.slice(3).map((fair, index) => (
            <FairCard key={fair.name} fair={fair} index={index + 3} onFair={onFair} onMap={onMap} />
          ))}
        </div>
      </section>
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
        <div className="market-meta">
          <span>
            <Star size={13} /> {ratingLabel(fair.rating)} ({fair.reviewCount})
          </span>
          <span>{minutesLabel(fair.deliveryMinutes)}</span>
          <span>{money(fair.deliveryFee)}</span>
        </div>
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
  const metrics = metricForVendor(product.feirante);
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
          <span>{product.weightKg.toLocaleString("pt-BR")} kg/{product.unit}</span>
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
        <p className="stock">{product.stock} {product.unit}(s) disponíveis</p>
      </div>
    </article>
  );
}

function OrdersPage({
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
function ProfilePage({
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

function VendorsPage({ onBack, onVendor }: { onBack: () => void; onVendor: (name: string) => void }) {
  const vendors = vendorSummaries();
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
  const metrics = metricForVendor(vendorName);
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
function DeliveryTracking({ onBack }: { onBack: () => void }) {
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
            <p>Depois da coleta, o cancelamento precisa de suporte para proteger cliente, banca e entregador.</p>
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
                    Peso estimado: {totalWeight.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg · limite
                    sugerido: {vehicle.maxKg} kg · {vehicle.note}.
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

function FavoritesPage({
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

function AccountPage({ session, onBack }: { session: DemoSession; onBack: () => void }) {
  return (
    <Panel title="Minha conta" subtitle="Dados básicos para editar sua conta no Feiraê." onBack={onBack}>
      <form className="form-card max-w-2xl">
        <label>
          Nome
          <input defaultValue={session.name} />
        </label>
        <label>
          E-mail
          <input defaultValue={session.email} type="email" />
        </label>
        <label>
          Telefone
          <input placeholder="(61) 99999-9999" />
        </label>
        <label>
          Nova senha
          <input type="password" placeholder="Mínimo 6 caracteres" />
        </label>
        <button type="button" className="primary-action">
          <Edit3 size={17} /> Salvar alterações
        </button>
      </form>
    </Panel>
  );
}

function PaymentsPage({ onBack }: { onBack: () => void }) {
  return (
    <Panel title="Pagamentos e carteira" subtitle="O app mostra pagamento nativo, mesmo usando provedor externo por trás." onBack={onBack}>
      <div className="grid gap-4 lg:grid-cols-[1fr_.8fr]">
        <div className="surface-card">
          <span className="eyebrow">Métodos</span>
          <div className="payment-list">
            <article>
              <CreditCard />
              <div>
                <b>Cartão de crédito/débito</b>
                <small>Cadastrar cartão para pedidos futuros</small>
              </div>
              <button>Adicionar</button>
            </article>
            <article>
              <Wallet />
              <div>
                <b>Pix</b>
                <small>Gerar Pix no fechamento do pedido</small>
              </div>
              <button>Configurar</button>
            </article>
          </div>
        </div>
        <div className="surface-card wallet-card">
          <span className="eyebrow">Carteira</span>
          <h2>R$ 0,00</h2>
          <p>Cupons, reembolsos e créditos aparecerão aqui.</p>
        </div>
      </div>
    </Panel>
  );
}

function RatingsPage({ onBack }: { onBack: () => void }) {
  const reviews = [
    ["Produto", "Cesta de frutas", "5,0", "Frutas bonitas e bem embaladas."],
    ["Banca", "Sítio da Vó", "4,9", "Atendimento rápido na separação."],
    ["Entrega", "FE-1024", "4,8", "Entrega cuidadosa e dentro do prazo."],
    ["App", "Experiência mensal", "4,7", "Avaliação solicitada uma vez por mês."],
  ];
  return (
    <Panel title="Minhas avaliações" subtitle="Cliente, banca, entregador e app se avaliam no fluxo certo." onBack={onBack}>
      <div className="review-grid">
        {reviews.map(([type, target, rating, text]) => (
          <article className="review-card" key={`${type}-${target}`}>
            <strong>{rating} ★</strong>
            <div>
              <b>{type} · {target}</b>
              <small>{text}</small>
            </div>
          </article>
        ))}
      </div>
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
    "Documentos",
  ];
  const [active, setActive] = useState("Painel");
  const [status, setStatus] = useState("Recebido");
  const [storeOpen, setStoreOpen] = useState(true);
  const [promotionActive, setPromotionActive] = useState(false);
  const [customHours, setCustomHours] = useState(false);
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [productName, setProductName] = useState("");
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
      <div className="ops-layout">
        <aside className="vertical-menu" aria-label="Menu do feirante">
          {modules.map((module) => (
            <button key={module} className={active === module ? "active" : ""} onClick={() => setActive(module)}>
              {module}
            </button>
          ))}
        </aside>
        <div className="surface-card operation-card">
          <span className="eyebrow">{active}</span>
          <h2>{active === "Pedidos" ? "Pedido FE-1027" : `Gerenciar ${active.toLocaleLowerCase("pt-BR")}`}</h2>
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
            <p>3 itens · R$ 86,80 · Cliente de Planaltina</p>
            <div className="mt-5 flex flex-wrap gap-2">
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
                    <input value={productName} onChange={(event) => setProductName(event.target.value)} required />
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
            inventory
          ) : active === "Minha banca" ? (
          <div className="operation-summary">
            <div>
              <b>Sítio da Vó</b>
              <p>Feira do Produtor · Banca 18</p>
            </div>
            <button
              className={storeOpen ? "status-button active" : "status-button"}
              onClick={() => setStoreOpen((value) => !value)}
            >
              {storeOpen ? "Loja aberta" : "Loja fechada"}
            </button>
          </div>
          ) : active === "Horários" ? (
            <div className="space-y-3">
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
            <div className="operation-list">
              {["Entrega pelo Feiraê", "Retirada na banca", "Peso máximo aceito: 20 kg por pedido"].map((item) => (
                <article key={item}>
                  <Truck />
                  <div>
                    <b>{item}</b>
                    <small>Regra usada no fechamento do carrinho</small>
                  </div>
                </article>
              ))}
            </div>
          ) : active === "Promoções" ? (
          <div className="operation-summary">
            <div>
              <b>10% na cesta de frutas</b>
              <p>Oferta demonstrativa válida até domingo</p>
            </div>
            <button
              className={promotionActive ? "status-button active" : "status-button"}
              onClick={() => setPromotionActive((value) => !value)}
            >
              {promotionActive ? "Ativa" : "Ativar"}
            </button>
          </div>
        ) : active === "Financeiro" ? (
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
          ) : active === "Avaliações" ? (
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
          ) : active === "Documentos" ? (
            <div className="operation-list">
              {["Documento do responsável", "Comprovante da banca/box", "Validação de feirante"].map((doc) => (
                <article key={doc}>
                  <Check />
                  <div>
                    <b>{doc}</b>
                    <small>Necessário para vender e receber repasses</small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="operation-list">
              {["R$ 1.842,30 em vendas no mês", "R$ 286,40 a receber", "Custos e taxas serão detalhados"].map((item) => (
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
      <p className="operation-footnote">
        Alterações locais de demonstração. A sincronização real será feita pelo Supabase.
      </p>
    </Panel>
  );
}
function DeliveryOperations({ onBack, onMap }: { onBack: () => void; onMap: () => void }) {
  const [online, setOnline] = useState(true);
  const [accepted, setAccepted] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const [cancelReason, setCancelReason] = useState("");
  const deliveries = [
    { id: "FE-1024", route: "Feira do Produtor → Planaltina", distance: "4,2 km", fee: "R$ 12,80", weight: 8.4, vehicle: "Moto" },
    { id: "FE-1025", route: "Feira Central → Asa Norte", distance: "6,8 km", fee: "R$ 17,40", weight: 16.8, vehicle: "Moto com baú" },
    { id: "FE-1026", route: "Feira da Torre → Sudoeste", distance: "5,1 km", fee: "R$ 24,20", weight: 31.5, vehicle: "Carro" },
  ];
  const deliveryStages = ["Ir para a banca", "Confirmar coleta", "Iniciar entrega", "Confirmar entrega"];
  const activeDelivery = deliveries.find((delivery) => delivery.id === accepted);
  return (
    <Panel title="Central do entregador" subtitle="Entregas locais demonstrativas" onBack={onBack}>
      <div className="surface-card">
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
        {activeDelivery && (
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
        )}
        <div className="review-grid compact">
          {[
            ["Cliente avalia entregador", "pontualidade, cuidado e educação"],
            ["Entregador avalia cliente", "presença, endereço e comunicação"],
            ["Entregador avalia banca", "pedido pronto, embalagem e peso correto"],
          ].map(([title, text]) => (
            <article className="review-card" key={title}>
              <strong>★</strong>
              <div>
                <b>{title}</b>
                <small>{text}</small>
              </div>
            </article>
          ))}
        </div>
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
                  }}
                >
                  Aceitar
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
  onBuyAgain,
  onCheckout,
}: {
  items: Product[];
  cart: Record<number, number>;
  subtotal: number;
  onAdd: (id: number) => void;
  onRemove: (id: number, all?: boolean) => void;
  onClose: () => void;
  onBuyAgain: () => void;
  onCheckout: () => void;
}) {
  const totalWeight = cartWeight(items, cart);
  const vehicle = vehicleForWeight(totalWeight);
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
          <button className="repeat-order-button" onClick={onBuyAgain}>
            <ShoppingBag size={17} />
            Comprar novamente
            <small>Repetir itens da última feira</small>
          </button>
          {items.length ? (
            items.map((product) => (
              <article className="cart-item" key={product.id}>
                <span>{product.emoji}</span>
                <div>
                  <b>{product.name}</b>
                  <small>{product.feirante}</small>
                  <small>
                    {cart[product.id]} {product.unit}(s) ·{" "}
                    {productWeight(product, cart[product.id]).toLocaleString("pt-BR", {
                      maximumFractionDigits: 1,
                    })}{" "}
                    kg
                  </small>
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
              <span>Peso estimado</span>
              <b>{totalWeight.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg</b>
            </p>
            <p>
              <span>Entrega indicada</span>
              <b>{vehicle.name}</b>
            </p>
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
function Empty({
  title,
  text,
  action,
  onAction,
}: {
  title: string;
  text: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty-state">
      <ShoppingBag size={34} />
      <b>{title}</b>
      <p>{text}</p>
      {action && onAction && (
        <button onClick={onAction} className="secondary-action">
          {action} <ChevronRight size={16} />
        </button>
      )}
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
