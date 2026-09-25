import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { fairs, initialOrders, products } from "./data";
import type { CustomerTab, DemoOrder, Role, Screen } from "./types";
import { cartSubtotal, filterProducts, sortFairsByDistance } from "./utils";
import { usePersistentState } from "./usePersistentState";
import { nameFromEmail, readSession, routeForRole } from "./domain/session";
import {
  CartDrawer,
  Header,
  LoginPage,
  MobileNavigation,
  RoleDashboard,
} from "./components/AppComponents";
import {
  AccountPage,
  AddressesPage,
  CatalogPage,
  ChatPage,
  Checkout,
  DeliveryTracking,
  FairDetail,
  FairsPage,
  FavoritesPage,
  HomePage,
  NotificationsPage,
  OrdersPage,
  PaymentsPage,
  ProfilePage,
  RatingsPage,
  SettingsPage,
  VendorStore,
  VendorsPage,
} from "./features/customer/CustomerScreens";
import { FeiranteOperations } from "./features/vendor/VendorScreens";
import { DeliveryOperations } from "./features/delivery/DeliveryScreens";

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
      updateHash(routeForRole(role), true);
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
    updateHash(routeForRole(nextRole), true);
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
    notify(
      orderId ? `Itens do pedido ${orderId} voltaram para a sacola.` : "Última compra voltou para a sacola.",
    );
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
              <OrdersPage orders={orders} onTracking={() => openScreen("tracking")} onBuyAgain={buyAgain} />
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
        {screen === "account" && session && (
          <AccountPage session={session} onBack={() => openCustomerTab("profile")} />
        )}
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
