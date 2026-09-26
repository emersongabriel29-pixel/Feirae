import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { fairs, initialOrders, products } from "./data";
import type { DemoOrder, Role } from "./types";
import { filterProducts, sortFairsByDistance } from "./utils";
import { usePersistentState } from "./usePersistentState";
import { CartDrawer, Header, LoginPage, MobileNavigation } from "./components/AppComponents";
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
import { useUnifiedOrderRevision } from "./hooks/useUnifiedOrderRevision";
import {
  eventNow,
  migrateUnifiedOrderAccountKey,
  patchUnifiedOrder,
  readUnifiedOrders,
  upsertUnifiedOrder,
} from "./domain/orderBridge";
import {
  marketplaceProducts,
  migrateMarketplaceAccountKey,
  readSharedStores,
  readStoreByIdentity,
  registerPromotionUsage,
} from "./domain/marketplaceBridge";
import { scopedStorageKey } from "./domain/storage";
import { storeIdFor, vendorIdFor } from "./domain/identity";
import { consumeWallet } from "./domain/walletBridge";
import {
  getRuntimeConfiguration,
  mergeRuntimeFairs,
  refreshRuntimeConfiguration,
  runtimePaymentMethods,
  runtimeStates,
} from "./domain/runtimeConfig";
import { releaseInventory, reserveInventory } from "./domain/inventoryBridge";
import {
  authenticateLocalAccount,
  scrubLegacyPlaintextPasswords,
  updateLocalAccount,
} from "./domain/localAuth";

export default function App() {
  const { session, role, startSession, updateSession, clearSession } = useDemoSession();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [runtimeRevision, setRuntimeRevision] = useState(0);
  const accountKey = session?.email ?? "guest";
  const [gpsEnabled] = usePersistentState<boolean>(scopedStorageKey("feirae:gps", accountKey), true);
  const [orderUpdatesEnabled] = usePersistentState<boolean>(
    scopedStorageKey("feirae:order-updates", accountKey),
    true,
  );
  const [compactCards] = usePersistentState<boolean>(
    scopedStorageKey("feirae:compact-cards", accountKey),
    false,
  );
  const [offersEnabled] = usePersistentState<boolean>(scopedStorageKey("feirae:offers", accountKey), true);
  const catalog = marketplaceProducts(products);
  const [favorites, setFavorites] = usePersistentState<number[]>(
    scopedStorageKey("feirae:favorites", accountKey),
    [2],
  );
  const [vendorFavorites, setVendorFavorites] = usePersistentState<string[]>(
    scopedStorageKey("feirae:vendor-favorites", accountKey),
    [],
  );
  const customerSeedOrders =
    session?.role === "customer" && session.email.endsWith("@feirae.test") && !session.isNewAccount
      ? initialOrders
      : [];
  const [orders, setOrders] = usePersistentState<DemoOrder[]>(
    scopedStorageKey("feirae:orders", accountKey),
    customerSeedOrders,
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [readNotificationKeys, setReadNotificationKeys] = usePersistentState<string[]>(
    scopedStorageKey("feirae:notification-read", accountKey),
    [],
  );
  const orderNotificationKeys = orders.flatMap((order) =>
    (order.events ?? []).map((event) => `${order.id}:${event.key}:${event.at}`),
  );
  const offerNotificationKeys = offersEnabled
    ? readSharedStores().flatMap((store) =>
        store.promotions
          .filter((promotion) => promotion.active)
          .map((promotion) => `offer:${store.storeId}:${promotion.id}`),
      )
    : [];
  const notificationKeys = [...orderNotificationKeys, ...offerNotificationKeys];
  const notifications = orderUpdatesEnabled
    ? notificationKeys.filter((key) => !readNotificationKeys.includes(key)).length
    : 0;
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState("Planaltina, DF");
  const [locationLoading, setLocationLoading] = useState(false);
  const { toast, notify } = useToast();
  const unifiedOrderRevision = useUnifiedOrderRevision();

  useEffect(() => {
    scrubLegacyPlaintextPasswords();
  }, []);

  useEffect(() => {
    let active = true;
    refreshRuntimeConfiguration().finally(() => {
      if (active) setRuntimeRevision((current) => current + 1);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("compact-product-cards", compactCards);
    return () => document.documentElement.classList.remove("compact-product-cards");
  }, [compactCards]);
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

  // runtimeRevision força o rerender quando a configuração da Gestão muda.
  void runtimeRevision;
  const configuredFairs = mergeRuntimeFairs(fairs);
  const serviceStates = runtimeStates();
  const paymentMethods = runtimePaymentMethods();
  const runtimeManaged = getRuntimeConfiguration().source === "supabase";

  useEffect(() => {
    if (!configuredFairs.length) return;
    if (!configuredFairs.some((fair) => fair.name === selectedFair)) {
      setSelectedFair(configuredFairs[0].name);
    }
  }, [configuredFairs, selectedFair, setSelectedFair]);

  const visibleProducts = useMemo(() => {
    const matches = filterProducts(catalog, query, category);
    if (query.trim()) return matches;
    return matches.filter((product) => product.fair === selectedFair);
  }, [catalog, query, category, selectedFair]);
  const fairsWithDistance = useMemo(
    () => sortFairsByDistance(configuredFairs, coords),
    [configuredFairs, coords],
  );
  const trackedOrder =
    orders.find((order) => order.id === selectedOrderId) ??
    orders.find((order) => !["Entregue", "Cancelado"].includes(order.status)) ??
    orders[0];

  useEffect(() => {
    if (role !== "customer") return;
    const unified = readUnifiedOrders(session?.email);
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
  }, [role, session?.email, setOrders, unifiedOrderRevision]);

  function login(nextRole: Role, email: string, name: string, password: string, isNewAccount: boolean) {
    const result = authenticateLocalAccount({
      role: nextRole,
      email,
      name,
      password,
      signup: isNewAccount,
    });
    if (!result.ok) return result.message;
    startSession(nextRole, result.account.email, result.account.name, result.isNewAccount);
    resetForRole(nextRole);
    return null;
  }

  function updateAccountIdentity(name: string, email: string, newPassword?: string) {
    if (!session) return "Sessão indisponível.";
    const result = updateLocalAccount({
      oldEmail: session.email,
      role: session.role,
      name,
      email,
      newPassword: newPassword?.trim() || undefined,
    });
    if (!result.ok) return result.message;

    migrateUnifiedOrderAccountKey(session.email, result.account.email, session.role, result.account.name);
    if (session.role === "feirante") {
      migrateMarketplaceAccountKey(session.email, result.account.email);
    }
    updateSession({ email: result.account.email, name: result.account.name });
    notify(newPassword?.trim() ? "Conta e senha atualizadas." : "Dados da conta atualizados.");
    return null;
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
    const product = catalog.find((item) => item.feirante === name);
    if (product) setSelectedFair(product.fair);
    openVendor(name);
  }
  function addProductToCart(id: number) {
    const product = catalog.find((item) => item.id === id);
    if (!product) return;
    const store = readStoreByIdentity(product.fair, product.feirante);
    if (store && !store.isOpen) {
      notify("Esta banca está fechada no momento.");
      return;
    }
    if (!cartFairName) setSelectedFair(product.fair);
    addToCart(id);
  }
  function requestLocation() {
    if (!gpsEnabled) {
      notify("Ative o uso de localização nas Configurações para ordenar feiras próximas.");
      return;
    }
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
      promotionDiscount: number;
      walletUsed: number;
      appliedPromotions: string[];
      whatsappConsent: boolean;
      changeFor?: number;
    },
  ) {
    const id = `FE-${String(Date.now()).slice(-8)}`;
    const reservation = reserveInventory(id, products, cart);
    if (!reservation.ok) {
      notify(reservation.message);
      return;
    }
    const now = new Date();
    const date = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(now);
    const paymentOnDelivery = details.paymentMethod.toLocaleLowerCase("pt-BR").includes("entrega");
    const paymentEvent = {
      key: paymentOnDelivery ? "payment-on-delivery" : "payment-authorized",
      label: paymentOnDelivery ? "Pagamento na entrega selecionado" : "Pagamento confirmado",
      at: date,
    };
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
        events: [paymentEvent, { key: "received", label: "Pedido recebido", at: date }],
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
      customerKey: session?.email,
      paymentMethod: details.paymentMethod,
      paymentStatus: paymentOnDelivery ? "due_on_delivery" : "authorized",
      whatsappConsent: details.whatsappConsent,
      changeFor: details.changeFor,
      subtotal,
      promotionDiscount: details.promotionDiscount,
      walletUsed: details.walletUsed,
      calculatedDeliveryFee: details.calculatedDeliveryFee,
      deliverySubsidy: details.deliverySubsidy,
      customerDeliveryFee: details.customerDeliveryFee,
      total,
      items: cartProducts.map((product) => ({
        productId: product.id,
        name: product.name,
        vendor: product.feirante,
        vendorId: product.vendorId ?? vendorIdFor(product.feirante),
        storeId: product.storeId ?? storeIdFor(product.fair, product.feirante),
        quantity: cart[product.id] ?? 0,
        unit: product.unit,
        unitPrice: product.price,
        weightKg: product.weightKg * (cart[product.id] ?? 0),
        estimatedWeightKg: product.weightKg * (cart[product.id] ?? 0),
      })),
      vendors: Array.from(
        new Map(
          cartProducts.map((product) => {
            const vendorId = product.vendorId ?? vendorIdFor(product.feirante);
            const storeId = product.storeId ?? storeIdFor(product.fair, product.feirante);
            return [
              vendorId,
              {
                vendorId,
                storeId,
                vendorName: product.feirante,
                status: "pending" as const,
                productIds: cartProducts
                  .filter((item) => (item.vendorId ?? vendorIdFor(item.feirante)) === vendorId)
                  .map((item) => item.id),
              },
            ];
          }),
        ).values(),
      ),
      status: "received",
      events: [
        {
          key: paymentOnDelivery ? "payment-on-delivery" : "payment-authorized",
          label: paymentOnDelivery ? "Pagamento na entrega selecionado" : "Pagamento confirmado",
          at: date,
          actor: "system",
        },
        {
          key: "received",
          label: "Pedido recebido",
          at: date,
          actor: "customer",
        },
      ],
    });
    if (details.walletUsed > 0 && session?.email) {
      consumeWallet(session.email, id, details.walletUsed);
    }
    registerPromotionUsage(details.appliedPromotions);
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
              events: [...(order.events ?? []), { key: "cancelled", label: "Pedido cancelado", at }],
            }
          : order,
      ),
    );
    const unifiedOrder = readUnifiedOrders(session?.email).find((order) => order.id === orderId);
    releaseInventory(orderId);
    const shouldRefund = unifiedOrder?.paymentStatus === "authorized";
    patchUnifiedOrder(
      orderId,
      {
        status: "cancelled",
        cancelReason: reason,
        cancelDetails: details,
        paymentStatus: shouldRefund ? "refunded" : unifiedOrder?.paymentStatus,
        refundAmount: shouldRefund ? unifiedOrder?.total : unifiedOrder?.refundAmount,
      },
      eventNow(
        "cancelled",
        shouldRefund ? "Pedido cancelado · reembolso liberado" : "Pedido cancelado",
        "customer",
        { reason, details },
      ),
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
    const history = readUnifiedOrders(session?.email);
    const source =
      (orderId && history.find((order) => order.id === orderId)) ??
      history.find((order) => order.status === "delivered") ??
      history[0];
    if (!source) {
      notify("Nenhum pedido anterior disponível para repetir.");
      return;
    }
    restoreDemoBasket(source.items.map((item) => ({ productId: item.productId, quantity: item.quantity })));
    setSelectedFair(source.fairName);
    setCartOpen(true);
    notify(`Itens disponíveis do pedido ${source.id} voltaram para a sacola.`);
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
                firstFairName={fairsWithDistance[0]?.name}
                onTab={openCustomerTab}
                onFair={openFair}
                onVendors={() => openScreen("vendors")}
                onTracking={() => openOrderTracking()}
                onAdd={addProductToCart}
              />
            )}
            {tab === "fairs" && (
              <FairsPage
                fairItems={fairsWithDistance}
                serviceStates={serviceStates}
                runtimeManaged={runtimeManaged}
                onFair={openFair}
                onMap={openMap}
              />
            )}
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
        {role === "feirante" && screen === "main" && session && (
          <FeiranteOperations session={session} onAccountUpdate={updateAccountIdentity} />
        )}
        {role === "delivery" && screen === "main" && session && (
          <DeliveryOperations
            session={session}
            onMap={(destination) => openMap(destination ?? "-15.621,-47.657")}
            onAccountUpdate={updateAccountIdentity}
          />
        )}
        {screen === "fair" && (
          <FairDetail
            fairName={selectedFair}
            fairItems={configuredFairs}
            onBack={() => openCustomerTab("fairs")}
            onMap={openMap}
            onAdd={addProductToCart}
            favorites={favorites}
            onFavorite={toggleFavorite}
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
            fairItems={configuredFairs}
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
            paymentMethods={paymentMethods}
            runtimeManaged={runtimeManaged}
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
            readKeys={readNotificationKeys}
            onBack={() => openCustomerTab("home")}
            onClear={() => {
              setReadNotificationKeys(notificationKeys);
              notify("Notificações marcadas como lidas.");
            }}
          />
        )}
        {screen === "addresses" && <AddressesPage onBack={() => openCustomerTab("profile")} />}
        {screen === "account" && session && (
          <AccountPage
            session={session}
            onBack={() => openCustomerTab("profile")}
            onAccountUpdate={updateAccountIdentity}
          />
        )}
        {screen === "payments" && <PaymentsPage onBack={() => openCustomerTab("profile")} />}
        {screen === "ratings" && <RatingsPage orders={orders} onBack={() => openCustomerTab("profile")} />}
        {screen === "chat" && <ChatPage onBack={() => openCustomerTab("profile")} />}
        {screen === "settings" && <SettingsPage onBack={() => openCustomerTab("profile")} />}
        {role === "feirante" && screen === "feiranteOps" && session && (
          <FeiranteOperations session={session} onAccountUpdate={updateAccountIdentity} />
        )}
        {role === "delivery" && screen === "deliveryOps" && session && (
          <DeliveryOperations
            session={session}
            onMap={(destination) => openMap(destination ?? "-15.621,-47.657")}
            onAccountUpdate={updateAccountIdentity}
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
