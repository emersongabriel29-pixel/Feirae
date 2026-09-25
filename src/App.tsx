import { useEffect, useMemo, useState } from "react";
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
import { eventNow, patchUnifiedOrder, readUnifiedOrders, upsertUnifiedOrder } from "./domain/orderBridge";

export default function App() {
  const { session, role, startSession, clearSession } = useDemoSession();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [favorites, setFavorites] = usePersistentState<number[]>("feirae:favorites", [2]);
  const [vendorFavorites, setVendorFavorites] = usePersistentState<string[]>("feirae:vendor-favorites", []);
  const [orders, setOrders] = usePersistentState<DemoOrder[]>("feirae:orders", initialOrders);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [notifications, setNotifications] = useState(2);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState("Planaltina, DF");
  const [locationLoading, setLocationLoading] = useState(false);
  const { toast, notify } = useToast();
  const {
    cart,
    setCart,
    cartProducts,
    subtotal,
    itemCount,
    cartFairName,
    addToCart,
    removeFromCart,
    restoreDemoBasket,
  } = useDemoCart(notify);
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

  const visibleProducts = useMemo(() => {
    const matches = filterProducts(products, query, category);
    if (query.trim()) return matches;
    return matches.filter((product) => product.fair === selectedFair);
  }, [query, category, selectedFair]);
  const fairsWithDistance = useMemo(() => sortFairsByDistance(fairs, coords), [coords]);
  const trackedOrder =
    orders.find((order) => order.id === selectedOrderId) ??
    orders.find((order) => !["Entregue", "Cancelado"].includes(order.status)) ??
    orders[0];

  useEffect(() => {
    if (role !== "customer") return;
    const unified = readUnifiedOrders();
    if (!unified.length) return;
    const statusMap = {
      received: "Recebido",
      preparing: "Preparando",
      ready_for_pickup: "Coleta",
      driver_assigned: "Coleta",
      collected: "Em rota",
      out_for_delivery: "Em rota",
      delivered: "Entregue",
      cancelled: "Cancelado",
    } as const;
    setOrders((current) => {
      const byId = new Map(current.map((order) => [order.id, order]));
      unified.forEach((record) => {
        const existing = byId.get(record.id);
        const eventList = record.events.map((event) => ({
          key: event.key,
          label: event.label,
          at: event.at,
        }));
        byId.set(record.id, {
          id: record.id,
          date:
            existing?.date ??
            new Intl.DateTimeFormat("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            }).format(new Date(record.createdAt)),
          createdAt: record.createdAt,
          status: statusMap[record.status],
          value: record.total,
          fairName: record.fairName,
          fulfillment: record.fulfillment,
          paymentMethod: record.paymentMethod,
          cancelReason: record.cancelReason,
          cancelDetails: record.cancelDetails,
          driver: record.driver ?? existing?.driver,
          events: eventList.length ? eventList : existing?.events,
        });
      });
      return Array.from(byId.values());
    });
  }, [role, setOrders]);

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

  function toggleVendorFavorite(name: string) {
    setVendorFavorites((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
  }

  function openFavoriteVendor(name: string) {
    const product = products.find((item) => item.feirante === name);
    if (product) setSelectedFair(product.fair);
    openVendor(name);
  }
  function addProductToCart(id: number) {
    const product = products.find((item) => item.id === id);
    if (product && !cartFairName) setSelectedFair(product.fair);
    addToCart(id);
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
  function confirmOrder(
    total: number,
    details: {
      fulfillment: "delivery" | "pickup";
      paymentMethod: string;
      fairName: string;
      customerCity?: string;
      customerAddress?: string;
      customerLat?: number;
      customerLng?: number;
      calculatedDeliveryFee: number;
      deliverySubsidy: number;
      customerDeliveryFee: number;
    },
  ) {
    const id = `FE-${String(1025 + orders.length).padStart(4, "0")}`;
    const now = new Date();
    const date = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(now);
    setOrders((current) => [
      {
        id,
        date,
        createdAt: now.toISOString(),
        status: "Recebido",
        value: total,
        fairName: details.fairName,
        fulfillment: details.fulfillment,
        paymentMethod: details.paymentMethod,
        events: [{ key: "received", label: "Pedido recebido", at: date }],
      },
      ...current,
    ]);
    upsertUnifiedOrder({
      id,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      fairName: details.fairName,
      customerName: session?.name ?? "Cliente",
      customerCity: details.customerCity,
      customerAddress: details.customerAddress,
      customerLat: details.customerLat,
      customerLng: details.customerLng,
      fulfillment: details.fulfillment,
      paymentMethod: details.paymentMethod,
      subtotal,
      calculatedDeliveryFee: details.calculatedDeliveryFee,
      deliverySubsidy: details.deliverySubsidy,
      customerDeliveryFee: details.customerDeliveryFee,
      total,
      items: cartProducts.map((product) => ({
        productId: product.id,
        name: product.name,
        vendor: product.feirante,
        quantity: cart[product.id] ?? 0,
        unit: product.unit,
        unitPrice: product.price,
        weightKg: product.weightKg * (cart[product.id] ?? 0),
      })),
      status: "received",
      events: [
        {
          key: "received",
          label: "Pedido recebido",
          at: date,
          actor: "customer",
        },
      ],
    });
    setNotifications((current) => current + 1);
    setSelectedOrderId(id);
    setCart({});
    openCustomerTab("orders");
    notify(`Pedido ${id} criado e vinculado à ${details.fairName}.`);
  }

  function cancelOrder(orderId: string, reason: string, details: string) {
    const at = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date());
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "Cancelado" as const,
              cancelReason: reason,
              cancelDetails: details,
              events: [
                ...(order.events ?? []),
                { key: "cancelled", label: "Pedido cancelado", at },
              ],
            }
          : order,
      ),
    );
    patchUnifiedOrder(
      orderId,
      { status: "cancelled", cancelReason: reason, cancelDetails: details },
      eventNow("cancelled", "Pedido cancelado", "customer", { reason, details }),
    );
    notify(`Cancelamento do pedido ${orderId} registrado.`);
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
          if (value) {
            setCategory("Todos");
            openCustomerTab("products");
          }
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
                onAdd={addProductToCart}
              />
            )}
            {tab === "fairs" && <FairsPage fairItems={fairsWithDistance} onFair={openFair} onMap={openMap} />}
            {tab === "products" && (
              <CatalogPage
                items={visibleProducts}
                fairName={selectedFair}
                query={query}
                category={category}
                onCategory={setCategory}
                onAdd={addProductToCart}
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
            onAdd={addProductToCart}
          />
        )}
        {screen === "feirante" && (
          <VendorStore
            vendorName={selectedVendor}
            fairName={selectedFair}
            onBack={() => openScreen("vendors")}
            onAdd={addProductToCart}
            favorites={favorites}
            onFavorite={toggleFavorite}
            storeFavorite={vendorFavorites.includes(selectedVendor)}
            onStoreFavorite={() => toggleVendorFavorite(selectedVendor)}
          />
        )}
        {screen === "vendors" && (
          <VendorsPage
            fairName={selectedFair}
            onBack={() => openCustomerTab("fairs")}
            onVendor={openVendor}
            vendorFavorites={vendorFavorites}
            onVendorFavorite={toggleVendorFavorite}
          />
        )}
        {screen === "tracking" && trackedOrder && (
          <DeliveryTracking
            order={trackedOrder}
            onBack={() => openCustomerTab("orders")}
            onCancel={cancelOrder}
          />
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
            vendorFavorites={vendorFavorites}
            onAdd={addProductToCart}
            onFavorite={toggleFavorite}
            onVendorFavorite={toggleVendorFavorite}
            onVendor={openFavoriteVendor}
            onBack={() => openCustomerTab("profile")}
            onExplore={() => openCustomerTab("products")}
          />
        )}
        {screen === "notifications" && (
          <NotificationsPage
            orders={orders}
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
        {screen === "ratings" && <RatingsPage orders={orders} onBack={() => openCustomerTab("profile")} />}
        {screen === "chat" && <ChatPage onBack={() => openCustomerTab("profile")} />}
        {screen === "settings" && <SettingsPage onBack={() => openCustomerTab("profile")} />}
        {screen === "feiranteOps" && session && (
          <FeiranteOperations session={session} onBack={() => openRoleRoot("feirante")} />
        )}
        {screen === "deliveryOps" && session && (
          <DeliveryOperations
            session={session}
            onBack={() => openRoleRoot("delivery")}
            onMap={(destination) => openMap(destination ?? "-15.621,-47.657")}
          />
        )}
      </div>

      {role === "customer" && screen === "main" && <MobileNavigation active={tab} onTab={openCustomerTab} />}
      {cartOpen && (
        <CartDrawer
          items={cartProducts}
          cart={cart}
          subtotal={subtotal}
          onAdd={addProductToCart}
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
