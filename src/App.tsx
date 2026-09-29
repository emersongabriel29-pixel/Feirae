import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { fairs, initialOrders, products } from "./data";
import type { DemoOrder, Role } from "./types";
import { filterProducts, money } from "./utils";
import { usePersistentState } from "./usePersistentState";
import { CartDrawer, Header, LoginPage, MobileNavigation } from "./components/AppComponents";
import { InAppNavigation } from "./components/InAppNavigation";
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
import { useMarketplaceRevision } from "./hooks/useMarketplaceRevision";
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
import {
  MULTI_VENDOR_EXTRA_STOP_FEE,
  allocatePromotionAcrossVendors,
  normalizeVendorMinimumOrder,
  vendorOrderSummaries,
} from "./domain/multiVendor";
import { sortFairsByProximity } from "./domain/fairMap";
import { consumeWallet } from "./domain/walletBridge";
import { releaseInventory, reserveInventory } from "./domain/inventoryBridge";
import {
  authenticateLocalAccount,
  resetLocalAccountPassword,
  scrubLegacyPlaintextPasswords,
  updateLocalAccount,
} from "./domain/localAuth";
import {
  customerPromotionNotification,
  orderEventNotification,
  showFeiraeNotification,
} from "./domain/feiraeNotifications";

export default function App() {
  const { session, role, startSession, updateSession, clearSession } = useDemoSession();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
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
  const [routeTarget, setRouteTarget] = useState<string | null>(null);
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
  const marketplaceRevision = useMarketplaceRevision();
  const seenCustomerOrderNotifications = useRef<Set<string> | null>(null);
  const seenCustomerOfferNotifications = useRef<Set<string> | null>(null);

  useEffect(() => {
    scrubLegacyPlaintextPasswords();
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

  const visibleProducts = useMemo(() => {
    const matches = filterProducts(catalog, query, category);
    if (query.trim()) return matches;
    return matches.filter((product) => product.fair === selectedFair);
  }, [catalog, query, category, selectedFair]);
  const fairsWithDistance = useMemo(
    () => sortFairsByProximity(fairs, coords, locationLabel),
    [coords, locationLabel],
  );
  const nearestOfficialFair = useMemo(
    () => fairsWithDistance.find((fair) => fair.source !== "demo") ?? null,
    [fairsWithDistance],
  );
  const autoSelectedLocationRef = useRef<string | null>(null);

  useEffect(() => {
    if (role !== "customer" || !nearestOfficialFair) return;
    const locationKey = coords ? `${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}` : locationLabel;
    if (autoSelectedLocationRef.current === locationKey) return;
    autoSelectedLocationRef.current = locationKey;
    setSelectedFair(nearestOfficialFair.name);
  }, [coords, locationLabel, nearestOfficialFair, role, setSelectedFair]);
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

  useEffect(() => {
    if (role !== "customer" || !session) return;
    const unifiedOrders = readUnifiedOrders(session.email);
    const currentKeys = new Set(
      unifiedOrders.flatMap((order) => order.events.map((event) => `${order.id}:${event.key}:${event.at}`)),
    );

    if (seenCustomerOrderNotifications.current === null) {
      seenCustomerOrderNotifications.current = currentKeys;
      return;
    }

    if (orderUpdatesEnabled) {
      unifiedOrders.forEach((order) => {
        order.events.forEach((event) => {
          const key = `${order.id}:${event.key}:${event.at}`;
          if (seenCustomerOrderNotifications.current?.has(key)) return;
          const message = orderEventNotification("customer", order, event);
          if (message) void showFeiraeNotification(message);
        });
      });
    }

    seenCustomerOrderNotifications.current = currentKeys;
  }, [orderUpdatesEnabled, role, session, unifiedOrderRevision]);

  useEffect(() => {
    if (role !== "customer") return;
    const activeOffers = readSharedStores().flatMap((store) =>
      store.promotions
        .filter((promotion) => promotion.active)
        .map((promotion) => ({
          key: `${store.storeId}:${promotion.id}`,
          message: customerPromotionNotification({
            storeId: store.storeId,
            storeName: store.name,
            fairName: store.fairName,
            promotionId: promotion.id,
            promotionName: promotion.name,
            rule: promotion.rule,
          }),
        })),
    );
    const currentKeys = new Set(activeOffers.map((offer) => offer.key));

    if (seenCustomerOfferNotifications.current === null) {
      seenCustomerOfferNotifications.current = currentKeys;
      return;
    }

    if (offersEnabled) {
      activeOffers.forEach((offer) => {
        if (!seenCustomerOfferNotifications.current?.has(offer.key)) {
          void showFeiraeNotification(offer.message);
        }
      });
    }

    seenCustomerOfferNotifications.current = currentKeys;
  }, [marketplaceRevision, offersEnabled, role]);

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

  function recoverPassword(nextRole: Role, email: string, newPassword: string) {
    const result = resetLocalAccountPassword({
      role: nextRole,
      email,
      newPassword,
    });
    return result.ok ? null : result.message;
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
  function clearCart() {
    if (!Object.keys(cart).length) return;
    setCart({});
    notify("Carrinho limpo.");
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
    setRouteTarget(target);
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
      vendorPromotionDiscounts: Record<string, number>;
      walletUsed: number;
      appliedPromotions: string[];
      whatsappConsent: boolean;
      changeFor?: number;
    },
  ) {
    const minimumByVendor = Object.fromEntries(
      Array.from(new Set(cartProducts.map((product) => product.feirante))).map((vendorName) => {
        const product = cartProducts.find((item) => item.feirante === vendorName);
        const store = product ? readStoreByIdentity(product.fair, vendorName) : undefined;
        return [vendorName, normalizeVendorMinimumOrder(store?.minimumOrderAmount ?? 0)];
      }),
    );
    const minimumSummaries = vendorOrderSummaries(
      cartProducts,
      cart,
      minimumByVendor,
      details.vendorPromotionDiscounts,
    );
    const blockedMinimum = minimumSummaries.find((summary) => !summary.meetsMinimum);
    if (blockedMinimum) {
      notify(
        `${blockedMinimum.vendorName}: faltam ${money(
          blockedMinimum.missingForMinimum,
        )} para o pedido mínimo de ${money(blockedMinimum.minimumOrderAmount)}.`,
      );
      return;
    }
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
      vendorFinancials: allocatePromotionAcrossVendors(cartProducts, cart, details.promotionDiscount).map(
        (summary) => {
          const product = cartProducts.find((item) => item.feirante === summary.vendorName)!;
          return {
            vendorId: product.vendorId ?? vendorIdFor(product.feirante),
            storeId: product.storeId ?? storeIdFor(product.fair, product.feirante),
            vendorName: summary.vendorName,
            merchandiseSubtotal: summary.subtotal,
            promotionDiscount: summary.promotionDiscount,
            netMerchandise: summary.netMerchandise,
          };
        },
      ),
      deliveryPricing: {
        baseFee: Math.max(
          0,
          details.calculatedDeliveryFee -
            Math.max(0, new Set(cartProducts.map((product) => product.feirante)).size - 1) *
              MULTI_VENDOR_EXTRA_STOP_FEE,
        ),
        extraStopFee: MULTI_VENDOR_EXTRA_STOP_FEE,
        originalVendorCount: new Set(cartProducts.map((product) => product.feirante)).size,
        currentVendorCount: new Set(cartProducts.map((product) => product.feirante)).size,
      },
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
    const externalRefund =
      unifiedOrder?.paymentStatus === "authorized" ||
      unifiedOrder?.paymentStatus === "partially_refunded" ||
      unifiedOrder?.paymentStatus === "refund_pending"
        ? (unifiedOrder.total ?? 0)
        : 0;
    const walletRestore = unifiedOrder?.walletUsed ?? 0;
    const refundAmount = Math.round((externalRefund + walletRestore) * 100) / 100;
    const refund =
      unifiedOrder && refundAmount > 0
        ? {
            id: `refund-${orderId}-full-${Date.now()}`,
            reason,
            merchandiseAmount: Math.max(
              0,
              Math.round((unifiedOrder.subtotal - (unifiedOrder.promotionDiscount ?? 0)) * 100) / 100,
            ),
            deliveryAmount: unifiedOrder.customerDeliveryFee,
            externalAmount: externalRefund,
            walletRestoreAmount: walletRestore,
            amount: refundAmount,
            status: externalRefund > 0 ? ("pending_choice" as const) : ("credited" as const),
            createdAt: new Date().toISOString(),
          }
        : null;
    patchUnifiedOrder(
      orderId,
      {
        status: "cancelled",
        cancelReason: reason,
        cancelDetails: details,
        total: 0,
        walletUsed: 0,
        paymentStatus:
          externalRefund > 0
            ? "refund_pending"
            : walletRestore > 0
              ? "refunded"
              : unifiedOrder?.paymentStatus,
        refundAmount: Math.round(((unifiedOrder?.refundAmount ?? 0) + refundAmount) * 100) / 100,
        refunds: refund ? [...(unifiedOrder?.refunds ?? []), refund] : unifiedOrder?.refunds,
      },
      eventNow(
        "cancelled",
        refund ? "Pedido cancelado · escolha o destino do reembolso" : "Pedido cancelado",
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

  if (!role) return <LoginPage onLogin={login} onResetPassword={recoverPassword} />;

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
        selectedFairPlace={fairs.find((fair) => fair.name === selectedFair)?.place ?? "Distrito Federal"}
        locationLabel={locationLabel}
        locationLoading={locationLoading}
        notifications={notifications}
        itemCount={itemCount}
        showCustomerTools={
          role === "customer" && screen === "main" && ["home", "fairs", "products"].includes(tab)
        }
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
                onRemove={removeFromCart}
                cart={cart}
                favorites={favorites}
                onFavorite={toggleFavorite}
                nearestFairName={nearestOfficialFair?.name ?? fairs[0].name}
              />
            )}
            {tab === "fairs" && (
              <FairsPage
                fairItems={fairsWithDistance}
                userCoords={coords}
                onRequestLocation={requestLocation}
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
                onRemove={removeFromCart}
                cart={cart}
                favorites={favorites}
                onFavorite={toggleFavorite}
              />
            )}
            {tab === "orders" && (
              <OrdersPage
                orders={orders}
                onTracking={openOrderTracking}
                onBuyAgain={buyAgain}
                onSupport={(orderId) => {
                  setSelectedOrderId(orderId);
                  openScreen("chat");
                }}
              />
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
            onBack={() => openCustomerTab("fairs")}
            onMap={openMap}
            onAdd={addProductToCart}
            onRemove={removeFromCart}
            cart={cart}
            favorites={favorites}
            onFavorite={toggleFavorite}
          />
        )}
        {screen === "feirante" && (
          <VendorStore
            vendorName={selectedVendor}
            fairName={selectedFair}
            onBack={() => openScreen("fair")}
            onAdd={addProductToCart}
            onRemove={removeFromCart}
            cart={cart}
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
            onRemove={removeFromCart}
            cart={cart}
            onFavorite={toggleFavorite}
            onVendorFavorite={toggleVendorFavorite}
            onVendor={openFavoriteVendor}
            onBack={() => openCustomerTab("profile")}
            onExplore={() => openCustomerTab("fairs")}
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
        {screen === "chat" && (
          <ChatPage
            orderId={selectedOrderId ?? undefined}
            onBack={() => (selectedOrderId ? openCustomerTab("orders") : openCustomerTab("profile"))}
          />
        )}
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
          onClear={clearCart}
          onCheckout={() => openScreen("checkout")}
        />
      )}
      {routeTarget && (
        <InAppNavigation
          destination={routeTarget}
          initialCoords={coords}
          onClose={() => setRouteTarget(null)}
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
