import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { fairs, initialOrders, products } from "./data";
import type { DemoOrder, Role } from "./types";
import { filterProducts, sortFairsByDistance } from "./utils";
import { usePersistentState } from "./usePersistentState";
import { CartDrawer, Header, LoginPage, MobileNavigation, RoleDashboard } from "./components/AppComponents";
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
import { useAppNavigation } from "./hooks/useAppNavigation";
import { useDemoCart } from "./hooks/useDemoCart";
import { useDemoSession } from "./hooks/useDemoSession";
import { useToast } from "./hooks/useToast";

export default function App() {
  const { session, role, startSession, clearSession } = useDemoSession();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [favorites, setFavorites] = usePersistentState<number[]>("feirae:favorites", [2]);
  const [orders, setOrders] = usePersistentState<DemoOrder[]>("feirae:orders", initialOrders);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [notifications, setNotifications] = useState(2);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState("Planaltina, DF");
  const [locationLoading, setLocationLoading] = useState(false);
  const { toast, notify } = useToast();
  const { cart, setCart, cartProducts, subtotal, itemCount, addToCart, removeFromCart, restoreDemoBasket } =
    useDemoCart(notify);
  const {
    tab,
    screen,
    selectedFair,
    selectedVendor,
    setSelectedFair,
    openCustomerTab,
    openScreen,
    openFair,
    openVendor,
    resetForRole,
    resetForLogout,
    openRoleRoot,
  } = useAppNavigation(role, () => setCartOpen(false));

  const visibleProducts = useMemo(() => filterProducts(products, query, category), [query, category]);
  const fairsWithDistance = useMemo(() => sortFairsByDistance(fairs, coords), [coords]);
  const trackedOrder =
    orders.find((order) => order.id === selectedOrderId) ??
    orders.find((order) => !["Entregue", "Cancelado"].includes(order.status)) ??
    orders[0];

  function login(nextRole: Role, email: string) {
    startSession(nextRole, email);
    resetForRole(nextRole);
  }

  function logout() {
    clearSession();
    resetForLogout();
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
  function openMap(destination: number | string, lng?: number) {
    const target =
      typeof destination === "number" && typeof lng === "number"
        ? `${destination},${lng}`
        : String(destination);
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(target)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }
  function confirmOrder(total: number) {
    const id = `FE-${String(1025 + orders.length).padStart(4, "0")}`;
    const date = new Intl.DateTimeFormat("pt-BR").format(new Date());
    setOrders((current) => [{ id, date, status: "Recebido", value: total }, ...current]);
    setSelectedOrderId(id);
    setCart({});
    openCustomerTab("orders");
    notify(`Pedido ${id} criado no modo demonstração.`);
  }

  function openOrderTracking(orderId?: string) {
    const target =
      (orderId && orders.find((order) => order.id === orderId)) ??
      orders.find((order) => !["Entregue", "Cancelado"].includes(order.status)) ??
      orders[0];
    if (!target) {
      notify("Nenhum pedido disponível para acompanhar.");
      return;
    }
    setSelectedOrderId(target.id);
    openScreen("tracking");
  }
  function buyAgain(orderId?: string) {
    restoreDemoBasket();
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
          else openRoleRoot(role);
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
                onFair={openFair}
                onVendors={() => openScreen("vendors")}
                onTracking={() => openOrderTracking()}
              />
            )}
            {tab === "fairs" && <FairsPage fairItems={fairsWithDistance} onFair={openFair} onMap={openMap} />}
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
              <OrdersPage orders={orders} onTracking={openOrderTracking} onBuyAgain={buyAgain} />
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
        {screen === "vendors" && <VendorsPage onBack={() => openCustomerTab("home")} onVendor={openVendor} />}
        {screen === "tracking" && trackedOrder && (
          <DeliveryTracking order={trackedOrder} onBack={() => openCustomerTab("orders")} />
        )}
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
        {screen === "feiranteOps" && session && (
          <FeiranteOperations session={session} onBack={() => openRoleRoot("feirante")} />
        )}
        {screen === "deliveryOps" && session && (
          <DeliveryOperations
            session={session}
            onBack={() => openRoleRoot("delivery")}
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
