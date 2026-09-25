import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  Edit3,
  Eye,
  Image,
  Package,
  Plus,
  Star,
  Truck,
  Trash2,
  Upload,
  Wallet,
  XCircle,
} from "lucide-react";
import { ModuleHeader, OperationsMenu, Panel, Toggle } from "../../components/AppComponents";
import { fairs } from "../../data";
import { fairHoursForName } from "../../domain/fairHours";
import { vehicleRules } from "../../domain/marketplace";
import { vendorModuleDetails } from "../../domain/operations";
import type { DemoSession } from "../../types";
import { usePersistentState } from "../../usePersistentState";
import { money } from "../../utils";
import {
  appendReview,
  eventNow,
  patchUnifiedOrder,
  patchUnifiedOrderItem,
  patchVendorStatus,
  readUnifiedOrders,
} from "../../domain/orderBridge";
import { syncVendorMarketplace } from "../../domain/marketplaceBridge";
import { vendorIdFor } from "../../domain/identity";
import { consumeInventory, releaseInventory } from "../../domain/inventoryBridge";
import {
  initialBankProfile,
  initialVendorDocuments,
  initialVendorOrders,
  initialVendorProducts,
  initialVendorPromotions,
  initialVendorReviews,
  initialVendorSchedule,
  productCategories,
  productSaleUnits,
  vendorDocumentStatusLabel,
  vendorOrderStatusLabel,
  type VendorBankProfile,
  type VendorDocument,
  type VendorOrder,
  type VendorProduct,
  type VendorPromotion,
  type VendorPromotionType,
  type VendorReview,
  type VendorScheduleDay,
} from "./vendorModel";

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
  "Conta",
  "Documentos",
];

function emptyProduct(): VendorProduct {
  return {
    id: 0,
    name: "",
    category: "Frutas",
    description: "",
    stock: 0,
    minStock: 3,
    active: false,
    price: 0,
    saleUnit: "un",
    packageSize: "1 un",
    weightKg: 0.5,
    photoDataUrl: "",
    photoName: "",
  };
}

function imageFileToDataUrl(file: File, onReady: (value: string) => void) {
  const reader = new FileReader();
  reader.onload = () => onReady(typeof reader.result === "string" ? reader.result : "");
  reader.readAsDataURL(file);
}

function orderWeight(order: VendorOrder) {
  return order.items.reduce((sum, item) => sum + (item.actualWeightKg || item.estimatedWeightKg), 0);
}

const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function minutesFromTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function vendorScheduleStatus(schedule: VendorScheduleDay[], now = new Date()) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todayIndex = now.getDay();
  const today = schedule.find((item) => item.day === dayNames[todayIndex]);
  const previous = schedule.find((item) => item.day === dayNames[(todayIndex + 6) % 7]);

  if (previous?.enabled && previous.open && previous.close) {
    const previousOpen = minutesFromTime(previous.open);
    const previousClose = minutesFromTime(previous.close);
    if (previousClose < previousOpen && currentMinutes < previousClose) {
      return { open: true, label: `Aberta agora · fecha às ${previous.close}` };
    }
  }

  if (today?.enabled && today.open && today.close) {
    const open = minutesFromTime(today.open);
    const close = minutesFromTime(today.close);
    const overnight = close < open;
    const isOpen = overnight ? currentMinutes >= open : currentMinutes >= open && currentMinutes < close;
    if (isOpen) {
      if (today.breakStart && today.breakEnd) {
        const breakStart = minutesFromTime(today.breakStart);
        const breakEnd = minutesFromTime(today.breakEnd);
        if (currentMinutes >= breakStart && currentMinutes < breakEnd) {
          return { open: false, label: `Em pausa · volta às ${today.breakEnd}` };
        }
      }
      return {
        open: true,
        label: overnight
          ? `Aberta agora · fecha às ${today.close} do dia seguinte`
          : `Aberta agora · fecha às ${today.close}`,
      };
    }
  }

  for (let offset = 0; offset < 7; offset += 1) {
    const index = (todayIndex + offset) % 7;
    const candidate = schedule.find((item) => item.day === dayNames[index] && item.enabled);
    if (!candidate?.open) continue;
    if (offset === 0 && currentMinutes < minutesFromTime(candidate.open)) {
      return { open: false, label: `Fechada · abre hoje às ${candidate.open}` };
    }
    if (offset > 0) {
      return {
        open: false,
        label: `Fechada · abre ${candidate.day.toLocaleLowerCase("pt-BR")} às ${candidate.open}`,
      };
    }
  }
  return { open: false, label: "Fechada · sem próximo horário configurado" };
}

function promotionStatus(promotion: VendorPromotion) {
  if (!promotion.active) return "Encerrada";
  const now = Date.now();
  const start = promotion.startsAt ? Date.parse(promotion.startsAt) : Number.NEGATIVE_INFINITY;
  const end = promotion.endsAt ? Date.parse(promotion.endsAt) : Number.POSITIVE_INFINITY;
  if (now < start) return "Agendada";
  if (now > end) return "Encerrada";
  if (promotion.usageLimit > 0 && promotion.usedCount >= promotion.usageLimit) return "Encerrada";
  return "Ativa";
}

export function FeiranteOperations({ session, onBack }: { session: DemoSession; onBack: () => void }) {
  const [active, setActive] = useState("Central");
  const [storeOpen, setStoreOpen] = usePersistentState<boolean>(
    `feirae:vendor-store-open:${session.email}`,
    true,
  );
  const [vendorItems, setVendorItems] = usePersistentState<VendorProduct[]>(
    `feirae:vendor-products:${session.email}`,
    initialVendorProducts,
  );
  const [orders, setOrders] = usePersistentState<VendorOrder[]>(
    `feirae:vendor-orders:${session.email}`,
    initialVendorOrders,
  );
  const [bankProfile, setBankProfile] = usePersistentState<VendorBankProfile>(
    `feirae:vendor-bank:${session.email}`,
    initialBankProfile,
  );
  const [useFairHours, setUseFairHours] = usePersistentState<boolean>(
    `feirae:vendor-use-fair-hours:${session.email}`,
    true,
  );
  const [schedule, setSchedule] = usePersistentState<VendorScheduleDay[]>(
    `feirae:vendor-schedule:${session.email}`,
    initialVendorSchedule,
  );
  const [deliverySettings, setDeliverySettings] = usePersistentState(
    `feirae:vendor-delivery-settings:${session.email}`,
    {
      deliveryEnabled: true,
      pickupEnabled: true,
      absorbDeliveryFee: false,
      acceptCashOnDelivery: true,
      acceptCardOnDelivery: true,
      pickupInstructions: "Retirada no box da banca após confirmação de pedido pronto.",
    },
  );
  const [promotions, setPromotions] = usePersistentState<VendorPromotion[]>(
    `feirae:vendor-promotions:${session.email}`,
    initialVendorPromotions,
  );
  const [reviews, setReviews] = usePersistentState<VendorReview[]>(
    `feirae:vendor-reviews:${session.email}`,
    initialVendorReviews,
  );
  const [documents, setDocuments] = usePersistentState<VendorDocument[]>(
    `feirae:vendor-documents:${session.email}`,
    session.isNewAccount
      ? initialVendorDocuments.map((document) => ({
          ...document,
          status: "pending" as const,
          fileName: "",
        }))
      : initialVendorDocuments,
  );
  const [stockHistory, setStockHistory] = usePersistentState<
    { id: string; product: string; delta: number; reason: string; createdAt: string }[]
  >(`feirae:vendor-stock-history:${session.email}`, []);
  const [vendorAccount, setVendorAccount] = usePersistentState(`feirae:vendor-account:${session.email}`, {
    name: session.name,
    cpf: "",
    birthDate: "",
    email: session.email,
    phone: "",
    pixKey: "",
    businessType: "Pessoa física",
    cnpj: "",
    responsibleDocument: "",
    receivingMethod: "Pix",
    bankName: "",
    agency: "",
    accountNumber: "",
  });

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("Item indisponível");
  const [productEditorId, setProductEditorId] = useState<number | "new" | null>(null);
  const [productDraft, setProductDraft] = useState<VendorProduct>(emptyProduct());
  const [bankEditing, setBankEditing] = useState(false);
  const [bankPreview, setBankPreview] = useState(false);
  const [promotionEditorOpen, setPromotionEditorOpen] = useState(false);
  const [promotionEditingId, setPromotionEditingId] = useState<string | null>(null);
  const [promotionDraft, setPromotionDraft] = useState<VendorPromotion>({
    id: "",
    type: "percentual",
    name: "",
    rule: "",
    startsAt: "",
    endsAt: "",
    active: true,
    vendorPaysDelivery: false,
    usageLimit: 0,
    usedCount: 0,
    minimumOrder: 0,
    discountValue: 0,
    target: "",
  });
  const [stockReason, setStockReason] = useState("Ajuste manual");
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [reviewReply, setReviewReply] = useState("");
  const [accountSaved, setAccountSaved] = useState(false);
  const [vendorReviewOrderId, setVendorReviewOrderId] = useState<string | null>(null);
  const [vendorReviewScore, setVendorReviewScore] = useState(5);
  const [vendorReviewComment, setVendorReviewComment] = useState("");
  const [settlementStatus, setSettlementStatus] = usePersistentState<
    Record<string, "requested" | "paid">
  >(`feirae:vendor-settlements:${session.email}`, {});
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setPromotions((current) =>
      current.filter(
        (promotion) => !/também quero/i.test(promotion.name) && !/isso funciona\??/i.test(promotion.rule),
      ),
    );
  }, [setPromotions]);

  useEffect(() => {
    const accountVendorId = vendorIdFor(session.email);
    const sharedOrders = readUnifiedOrders().filter(
      (order) =>
        order.fairName === bankProfile.fairName &&
        (order.vendors?.some(
          (vendor) => vendor.vendorId === accountVendorId || vendor.vendorName === bankProfile.name,
        ) ??
          order.items.some((item) => item.vendor === bankProfile.name)),
    );
    if (!sharedOrders.length) return;

    const statusMap = {
      received: "new",
      preparing: "preparing",
      ready_for_pickup: "ready_for_pickup",
      driver_assigned: "ready_for_pickup",
      collected: "collected",
      out_for_delivery: "collected",
      delivered: "delivered",
      cancelled: "rejected",
    } as const;

    setOrders((current) => {
      const byId = new Map(current.map((order) => [order.id, order]));
      sharedOrders.forEach((record) => {
        const vendorState = record.vendors?.find(
          (vendor) => vendor.vendorId === accountVendorId || vendor.vendorName === bankProfile.name,
        );
        const resolvedVendorId = vendorState?.vendorId ?? accountVendorId;
        const items = record.items.filter(
          (item) => item.vendorId === resolvedVendorId || item.vendor === bankProfile.name,
        );
        const currentOrder = byId.get(record.id);
        const localStatus =
          record.status === "delivered"
            ? "delivered"
            : record.status === "cancelled" || vendorState?.status === "rejected"
              ? "rejected"
              : ["collected", "out_for_delivery"].includes(record.status)
                ? "collected"
                : vendorState?.status === "ready"
                ? "ready_for_pickup"
                : vendorState?.status === "collected"
                  ? "collected"
                  : vendorState?.status === "accepted" || vendorState?.status === "preparing"
                    ? "preparing"
                    : statusMap[record.status];
        const alreadySeparated = ["ready_for_pickup", "collected", "delivered"].includes(localStatus);
        byId.set(record.id, {
          id: record.id,
          fulfillment: record.fulfillment,
          vendorId: resolvedVendorId,
          customer: record.customerName,
          createdAt: new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(new Date(record.createdAt)),
          status: localStatus,
          value: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
          deliveryFee: record.calculatedDeliveryFee,
          city: record.customerCity ?? (record.fulfillment === "pickup" ? "Retirada na feira" : "Entrega"),
          estimatedPickupMinutes: currentOrder?.estimatedPickupMinutes ?? 20,
          rejectReason: record.cancelReason ?? currentOrder?.rejectReason ?? "",
          driverName: record.driver?.name ?? currentOrder?.driverName ?? "",
          items: items.map((item) => {
            const oldItem = currentOrder?.items.find((old) => old.id === `${record.id}-${item.productId}`);
            return {
              id: `${record.id}-${item.productId}`,
              productId: item.productId,
              name: item.name,
              quantityLabel: `${item.quantity} ${item.unit}`,
              estimatedWeightKg: item.estimatedWeightKg ?? item.weightKg,
              actualWeightKg: item.actualWeightKg ?? oldItem?.actualWeightKg ?? item.weightKg,
              separated: oldItem?.separated ?? alreadySeparated,
              unavailable: item.unavailable ?? oldItem?.unavailable ?? false,
              note: item.note ?? oldItem?.note ?? "",
            };
          }),
        });
      });
      return Array.from(byId.values());
    });
  }, [bankProfile.fairName, bankProfile.name, session.email, setOrders]);

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? null;
  const accountVendorId = vendorIdFor(session.email);
  const vendorUnifiedOrders = readUnifiedOrders().filter((order) =>
    order.vendors?.some(
      (vendor) => vendor.vendorId === accountVendorId || vendor.vendorName === bankProfile.name,
    ),
  );
  const pendingVendorReviewOrders = vendorUnifiedOrders.filter(
    (order) =>
      order.status === "delivered" &&
      !order.reviews?.some((review) => review.authorRole === "vendor"),
  );
  const pendingOrders = orders.filter((order) =>
    ["new", "preparing", "ready_for_pickup", "collected"].includes(order.status),
  );
  const lowStockCount = vendorItems.filter((item) => item.active && item.stock <= item.minStock).length;
  const pausedCount = vendorItems.filter((item) => !item.active && item.stock > 0).length;
  const outOfStockCount = vendorItems.filter((item) => item.stock <= 0).length;
  const totalStock = vendorItems.reduce((sum, item) => sum + item.stock, 0);
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  const grossOrders = orders
    .filter((order) => order.status !== "rejected")
    .reduce((sum, order) => sum + order.value, 0);
  const pendingGross = orders
    .filter((order) => ["new", "preparing", "ready_for_pickup", "collected"].includes(order.status))
    .reduce((sum, order) => sum + order.value, 0);
  const availableGross = orders
    .filter((order) => order.status === "delivered")
    .reduce((sum, order) => sum + order.value, 0);
  const vendorAvailableForPayout = orders
    .filter((order) => order.status === "delivered" && !settlementStatus[order.id])
    .reduce((sum, order) => sum + order.value, 0);
  const vendorRequestedPayout = orders
    .filter((order) => settlementStatus[order.id] === "requested")
    .reduce((sum, order) => sum + order.value, 0);
  const vendorPaidPayout = orders
    .filter((order) => settlementStatus[order.id] === "paid")
    .reduce((sum, order) => sum + order.value, 0);
  const approvalStatus = documents
    .filter((document) => document.required)
    .every((document) => document.status === "approved")
    ? "Aprovado"
    : documents.some((document) => document.status === "correction_required")
      ? "Correção necessária"
      : documents.some((document) => document.status === "under_review")
        ? "Em análise"
        : "Documentação pendente";

  const officialHours = fairHoursForName(bankProfile.fairName);
  const scheduleForStatus =
    useFairHours && bankProfile.fairName === "Feira do Produtor Rural" ? initialVendorSchedule : schedule;
  const currentScheduleStatus = vendorScheduleStatus(scheduleForStatus);
  const effectiveStoreOpen = approvalStatus === "Aprovado" && storeOpen && currentScheduleStatus.open;

  useEffect(() => {
    syncVendorMarketplace({
      accountKey: session.email,
      name: bankProfile.name,
      fairName: bankProfile.fairName,
      isOpen: effectiveStoreOpen,
      approved: approvalStatus === "Aprovado",
      deliveryEnabled: deliverySettings.deliveryEnabled,
      pickupEnabled: deliverySettings.pickupEnabled,
      absorbDeliveryFee: deliverySettings.absorbDeliveryFee,
      acceptCashOnDelivery: deliverySettings.acceptCashOnDelivery,
      acceptCardOnDelivery: deliverySettings.acceptCardOnDelivery,
      promotions,
      products: vendorItems,
    });
  }, [
    bankProfile.fairName,
    bankProfile.name,
    deliverySettings.absorbDeliveryFee,
    deliverySettings.deliveryEnabled,
    deliverySettings.pickupEnabled,
    deliverySettings.acceptCashOnDelivery,
    deliverySettings.acceptCardOnDelivery,
    effectiveStoreOpen,
    promotions,
    session.email,
    vendorItems,
    approvalStatus,
  ]);

  const activeFreeShipping = promotions.some(
    (promotion) => promotion.active && promotion.type === "freteGratis" && promotion.vendorPaysDelivery,
  );

  const dynamicModuleDetails = {
    ...vendorModuleDetails,
    Pedidos: {
      ...vendorModuleDetails.Pedidos,
      badge: `${orders.filter((order) => order.status === "new").length} novos`,
    },
    "Minha banca": {
      ...vendorModuleDetails["Minha banca"],
      badge: bankProfile.box ? `Banca ${bankProfile.box}` : "Configurar",
    },
    Produtos: {
      ...vendorModuleDetails.Produtos,
      badge: `${vendorItems.length} produtos`,
    },
    Estoque: {
      ...vendorModuleDetails.Estoque,
      badge: `${lowStockCount} alertas`,
    },
    Financeiro: {
      ...vendorModuleDetails.Financeiro,
      badge: vendorAccount.pixKey || vendorAccount.accountNumber ? "Recebimento ok" : "Configurar",
    },
    Avaliações: {
      ...vendorModuleDetails.Avaliações,
      badge: `${averageRating.toFixed(1)} ★`,
    },
    Documentos: {
      ...vendorModuleDetails.Documentos,
      badge: approvalStatus,
    },
  };

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  function updateOrder(id: string, update: Partial<VendorOrder>) {
    setOrders((current) => current.map((order) => (order.id === id ? { ...order, ...update } : order)));
  }

  function updateOrderItem(orderId: string, itemId: string, update: Partial<VendorOrder["items"][number]>) {
    const order = orders.find((item) => item.id === orderId);
    const orderItem = order?.items.find((item) => item.id === itemId);
    setOrders((current) =>
      current.map((item) =>
        item.id === orderId
          ? {
              ...item,
              items: item.items.map((child) => (child.id === itemId ? { ...child, ...update } : child)),
            }
          : item,
      ),
    );
    if (order?.vendorId && orderItem?.productId) {
      patchUnifiedOrderItem(orderId, order.vendorId, orderItem.productId, {
        actualWeightKg: update.actualWeightKg,
        unavailable: update.unavailable,
        note: update.note,
      });
    }
  }

  function acceptOrder(order: VendorOrder) {
    if (approvalStatus !== "Aprovado") {
      showNotice("Finalize a aprovação documental antes de aceitar pedidos.");
      return;
    }
    const vendorId = order.vendorId ?? vendorIdFor(session.email);
    updateOrder(order.id, { status: "preparing", rejectReason: "" });
    patchVendorStatus(
      order.id,
      vendorId,
      "accepted",
      eventNow("vendor-confirmed", "Confirmado pela banca", "vendor"),
    );
    patchVendorStatus(
      order.id,
      vendorId,
      "preparing",
      eventNow("preparing", "Em separação", "vendor"),
    );
    showNotice(`Pedido ${order.id} aceito. Cliente notificado.`);
  }

  function rejectOrder(order: VendorOrder) {
    updateOrder(order.id, { status: "rejected", rejectReason });
    releaseInventory(order.id);
    patchVendorStatus(
      order.id,
      order.vendorId ?? vendorIdFor(session.email),
      "rejected",
      eventNow("vendor-rejected", "Pedido cancelado", "vendor", { reason: rejectReason }),
    );
    const unified = readUnifiedOrders().find((item) => item.id === order.id);
    if (unified?.paymentStatus === "authorized") {
      patchUnifiedOrder(order.id, {
        paymentStatus: "refunded",
        refundAmount: unified.total,
      });
    }
    showNotice(`Pedido ${order.id} recusado. Motivo registrado.`);
  }

  function markReady(order: VendorOrder) {
    const unresolved = order.items.some((item) => !item.separated || item.unavailable);
    if (unresolved) {
      showNotice("Conclua ou resolva todos os itens antes de marcar o pedido como pronto.");
      return;
    }
    if (approvalStatus !== "Aprovado") {
      showNotice("Finalize a aprovação documental antes de liberar pedidos.");
      return;
    }
    updateOrder(order.id, { status: "ready_for_pickup" });
    patchVendorStatus(
      order.id,
      order.vendorId ?? vendorIdFor(session.email),
      "ready",
      eventNow(
        "ready",
        order.fulfillment === "pickup" ? "Pronto para retirada" : "Pronto para coleta",
        "vendor",
      ),
    );
    showNotice(
      order.fulfillment === "pickup"
        ? `Pedido ${order.id} pronto para retirada do cliente.`
        : `Pedido ${order.id} pronto. Aguarda as demais bancas e um entregador compatível.`,
    );
  }

  function openNewProduct() {
    setProductDraft(emptyProduct());
    setProductEditorId("new");
  }

  function openProductEditor(product: VendorProduct) {
    setProductDraft({ ...product });
    setProductEditorId(product.id);
  }

  function saveProduct(event: FormEvent) {
    event.preventDefault();
    if (!productDraft.name.trim() || productDraft.price <= 0 || productDraft.weightKg <= 0) {
      showNotice("Informe nome, preço e peso logístico válidos.");
      return;
    }
    const nextProduct = {
      ...productDraft,
      id: productEditorId === "new" ? Date.now() : productDraft.id,
      active: productDraft.stock > 0 ? productDraft.active : false,
    };
    setVendorItems((current) =>
      productEditorId === "new"
        ? [...current, nextProduct]
        : current.map((item) => (item.id === nextProduct.id ? nextProduct : item)),
    );
    setProductEditorId(null);
    showNotice(nextProduct.stock > 0 ? "Produto salvo." : "Produto salvo como esgotado.");
  }

  function adjustStock(item: VendorProduct, delta: number) {
    const nextStock = Math.max(0, item.stock + delta);
    setVendorItems((current) =>
      current.map((product) =>
        product.id === item.id
          ? { ...product, stock: nextStock, active: nextStock === 0 ? false : product.active }
          : product,
      ),
    );
    setStockHistory((current) => [
      {
        id: String(Date.now()),
        product: item.name,
        delta: nextStock - item.stock,
        reason: stockReason,
        createdAt: new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date()),
      },
      ...current,
    ]);
  }

  function updateScheduleDay(day: string, update: Partial<VendorScheduleDay>) {
    setSchedule((current) => current.map((item) => (item.day === day ? { ...item, ...update } : item)));
  }

  function startPromotion(type: VendorPromotionType = "percentual") {
    setPromotionEditingId(null);
    setPromotionDraft({
      id: "",
      type,
      name: "",
      rule: "",
      startsAt: "",
      endsAt: "",
      active: true,
      vendorPaysDelivery: type === "freteGratis",
      usageLimit: 0,
      usedCount: 0,
      minimumOrder: 0,
      discountValue: 0,
      target: "",
    });
    setPromotionEditorOpen(true);
  }

  function editPromotion(promotion: VendorPromotion) {
    setPromotionEditingId(promotion.id);
    setPromotionDraft({ ...promotion });
    setPromotionEditorOpen(true);
  }

  function savePromotion(event: FormEvent) {
    event.preventDefault();
    if (!promotionDraft.name.trim() || !promotionDraft.rule.trim()) {
      showNotice("Informe o nome e a regra da campanha.");
      return;
    }
    const next = {
      ...promotionDraft,
      id: promotionEditingId ?? String(Date.now()),
      vendorPaysDelivery: promotionDraft.type === "freteGratis" ? true : promotionDraft.vendorPaysDelivery,
    };
    setPromotions((current) =>
      promotionEditingId
        ? current.map((promotion) => (promotion.id === next.id ? next : promotion))
        : [...current, next],
    );
    setPromotionEditorOpen(false);
    setPromotionEditingId(null);
    showNotice("Campanha salva.");
  }

  function uploadDocument(document: VendorDocument, file: File) {
    setDocuments((current) =>
      current.map((item) =>
        item.id === document.id
          ? {
              ...item,
              fileName: file.name,
              status: "under_review",
              correctionReason: "",
            }
          : item,
      ),
    );
    showNotice(`${document.name} enviado. O envio não equivale à aprovação.`);
  }

  const inventory = (
    <div className="operation-list">
      {vendorItems.map((item) => {
        const status =
          item.stock <= 0 ? "Estoque esgotado" : item.active ? "À venda" : "Pausado pelo feirante";
        return (
          <article key={item.id}>
            <span className={item.stock <= item.minStock ? "inventory-dot warning" : "inventory-dot"} />
            <div>
              <b>{item.name}</b>
              <small>
                {item.stock} {item.saleUnit}(s) · {money(item.price)} / {item.saleUnit} · peso logístico{" "}
                {item.weightKg} kg · mínimo {item.minStock}
              </small>
              <small>Status: {status}</small>
            </div>
            {active === "Estoque" ? (
              <div className="stock-controls">
                <button onClick={() => adjustStock(item, -1)}>−</button>
                <strong>{item.stock}</strong>
                <button onClick={() => adjustStock(item, 1)}>+</button>
              </div>
            ) : (
              <div className="item-actions">
                <button className="mini-toggle" onClick={() => openProductEditor(item)}>
                  Editar produto
                </button>
                <button
                  className={item.active && item.stock > 0 ? "mini-toggle active" : "mini-toggle"}
                  disabled={item.stock <= 0}
                  onClick={() =>
                    setVendorItems((current) =>
                      current.map((product) =>
                        product.id === item.id
                          ? { ...product, active: product.stock > 0 ? !product.active : false }
                          : product,
                      ),
                    )
                  }
                >
                  {status}
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );

  return (
    <Panel
      title="Operação do feirante"
      subtitle="Gerencie pedidos, banca, produtos, horários, promoções e financeiro."
      onBack={onBack}
    >
      {notice && <p className="inline-success">{notice}</p>}

      {active === "Central" ? (
        <div className="ops-home">
          <div className="ops-summary">
            <div>
              <span className="eyebrow">Central</span>
              <h2>Escolha o que deseja gerenciar</h2>
              <p>Pedidos, banca, produtos, horários, documentos e financeiro ficam em áreas próprias.</p>
            </div>
            <div className="operation-metrics">
              <article>
                <strong>{effectiveStoreOpen ? "Aberta agora" : "Fechada"}</strong>
                <span>
                  {bankProfile.name} · Banca {bankProfile.box || "sem número"}
                </span>
              </article>
              <article>
                <strong>{pendingOrders.length}</strong>
                <span>pedidos em andamento</span>
              </article>
              <article>
                <strong>{approvalStatus}</strong>
                <span>status cadastral</span>
              </article>
            </div>
          </div>
          <OperationsMenu modules={modules} details={dynamicModuleDetails} onOpen={setActive} />
        </div>
      ) : (
        <div className="module-screen">
          <button
            className="back-button"
            onClick={() => {
              if (selectedOrderId) setSelectedOrderId(null);
              else if (productEditorId !== null) setProductEditorId(null);
              else setActive("Central");
            }}
          >
            <ArrowLeft size={17} />{" "}
            {selectedOrderId || productEditorId !== null ? "Voltar" : "Voltar para central"}
          </button>

          <div className="surface-card operation-card">
            <span className="eyebrow">{active}</span>

            {active === "Painel" ? (
              <>
                <ModuleHeader
                  badge="Indicadores"
                  title="Resumo operacional"
                  description="Aqui entram indicadores diferentes dos atalhos da Central."
                />
                <div className="operation-metrics">
                  <article>
                    <strong>{money(grossOrders)}</strong>
                    <span>pedidos</span>
                  </article>
                  <article>
                    <strong>{pendingOrders.length}</strong>
                    <span>pedidos em andamento</span>
                  </article>
                  <article>
                    <strong>{lowStockCount}</strong>
                    <span>estoques abaixo do mínimo</span>
                  </article>
                </div>
                <div className="module-kpi-strip">
                  <article>
                    <strong>{averageRating.toFixed(1)} ★</strong>
                    <span>média de {reviews.length} avaliações</span>
                  </article>
                  <article>
                    <strong>{vendorItems.filter((item) => item.active).length}</strong>
                    <span>produtos publicados</span>
                  </article>
                  <article>
                    <strong>{promotions.filter((promotion) => promotion.active).length}</strong>
                    <span>campanhas ativas</span>
                  </article>
                </div>
              </>
            ) : active === "Pedidos" ? (
              selectedOrder ? (
                <>
                  <ModuleHeader
                    badge={vendorOrderStatusLabel(selectedOrder.status)}
                    title={`${selectedOrder.id} · ${selectedOrder.customer}`}
                    description={`${selectedOrder.items.length} itens · ${money(selectedOrder.value)} · ${selectedOrder.city}`}
                  />
                  <div className="module-kpi-strip">
                    <article>
                      <strong>{orderWeight(selectedOrder).toFixed(1)} kg</strong>
                      <span>peso atual do pedido</span>
                    </article>
                    <article>
                      <strong>{vendorOrderStatusLabel(selectedOrder.status)}</strong>
                      <span>etapa controlada pelo fluxo</span>
                    </article>
                    <article>
                      <strong>{money(selectedOrder.deliveryFee)}</strong>
                      <span>entrega estimada</span>
                    </article>
                  </div>

                  {selectedOrder.status === "new" && (
                    <>
                      <div className="module-action-row">
                        <button className="primary-action" onClick={() => acceptOrder(selectedOrder)}>
                          <Check size={17} /> Aceitar pedido
                        </button>
                      </div>
                      <div className="cancel-panel">
                        <b>Recusar pedido</b>
                        <select
                          value={rejectReason}
                          onChange={(event) => setRejectReason(event.target.value)}
                        >
                          <option>Item indisponível</option>
                          <option>Banca fechou mais cedo</option>
                          <option>Erro de estoque</option>
                          <option>Impossibilidade operacional</option>
                          <option>Outro</option>
                        </select>
                        <button className="secondary-action" onClick={() => rejectOrder(selectedOrder)}>
                          <XCircle size={17} /> Confirmar recusa
                        </button>
                      </div>
                    </>
                  )}

                  <div className="operation-list detailed">
                    {selectedOrder.items.map((item) => (
                      <article key={item.id}>
                        <Package />
                        <div>
                          <b>
                            {item.name} · {item.quantityLabel}
                          </b>
                          <small>
                            Peso estimado {item.estimatedWeightKg} kg ·{" "}
                            {item.unavailable
                              ? "Item indisponível"
                              : item.separated
                                ? "Separado e conferido"
                                : "Aguardando separação"}
                          </small>
                          {selectedOrder.status === "preparing" && (
                            <div className="grid gap-2 sm:grid-cols-2">
                              <label>
                                Peso real (kg)
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={item.actualWeightKg}
                                  onChange={(event) =>
                                    updateOrderItem(selectedOrder.id, item.id, {
                                      actualWeightKg: Number(event.target.value),
                                    })
                                  }
                                />
                              </label>
                              <label>
                                Substituição/observação
                                <input
                                  value={item.note}
                                  onChange={(event) =>
                                    updateOrderItem(selectedOrder.id, item.id, {
                                      note: event.target.value,
                                    })
                                  }
                                  placeholder="Ex.: substituir por item equivalente"
                                />
                              </label>
                            </div>
                          )}
                        </div>
                        {selectedOrder.status === "preparing" && (
                          <div className="item-actions">
                            <button
                              className={item.separated ? "mini-toggle active" : "mini-toggle"}
                              onClick={() =>
                                updateOrderItem(selectedOrder.id, item.id, {
                                  separated: !item.separated,
                                  unavailable: false,
                                })
                              }
                            >
                              {item.separated ? "Separado" : "Marcar separado"}
                            </button>
                            <button
                              className={item.unavailable ? "mini-toggle active" : "mini-toggle"}
                              onClick={() =>
                                updateOrderItem(selectedOrder.id, item.id, {
                                  unavailable: !item.unavailable,
                                  separated: false,
                                })
                              }
                            >
                              Indisponível
                            </button>
                            {item.unavailable && item.note.trim() && (
                              <button
                                className="mini-toggle"
                                onClick={() => {
                                  patchUnifiedOrder(
                                    selectedOrder.id,
                                    {},
                                    eventNow(
                                      `substitution-${item.productId ?? item.id}`,
                                      `Substituição solicitada para ${item.name}`,
                                      "vendor",
                                      { details: item.note.trim() },
                                    ),
                                  );
                                  showNotice("Opção de substituição enviada ao cliente.");
                                }}
                              >
                                Enviar substituição ao cliente
                              </button>
                            )}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>

                  {selectedOrder.status === "preparing" && (
                    <button className="primary-action" onClick={() => markReady(selectedOrder)}>
                      Marcar pedido como pronto para coleta
                    </button>
                  )}
                  {selectedOrder.status === "ready_for_pickup" &&
                    (selectedOrder.fulfillment === "pickup" ? (
                      <div className="surface-card">
                        <span className="eyebrow">Retirada na banca</span>
                        <b>Pedido pronto para o cliente</b>
                        <p>Confirme somente quando o pedido tiver sido entregue ao cliente no balcão.</p>
                        <button
                          className="primary-action"
                          onClick={() => {
                            updateOrder(selectedOrder.id, { status: "delivered" });
                            patchVendorStatus(
                              selectedOrder.id,
                              selectedOrder.vendorId ?? vendorIdFor(session.email),
                              "delivered",
                            );
                            consumeInventory(selectedOrder.id);
                            patchUnifiedOrder(
                              selectedOrder.id,
                              {
                                status: "delivered",
                                pickupConfirmedAt: new Date().toISOString(),
                              },
                              eventNow("pickup-complete", "Retirado na banca", "vendor"),
                            );
                            showNotice(`Retirada do pedido ${selectedOrder.id} confirmada.`);
                          }}
                        >
                          <Check size={17} /> Confirmar retirada pelo cliente
                        </button>
                      </div>
                    ) : (
                      <div className="region-strip">
                        <Truck size={18} />
                        <div>
                          <b>Aguardando entregador</b>
                          <p>
                            Sua parte está pronta. A corrida só é liberada quando todas as bancas do pedido
                            estiverem prontas.
                          </p>
                        </div>
                      </div>
                    ))}
                  {selectedOrder.status === "collected" && (
                    <p className="inline-success">
                      Coleta confirmada pelo fluxo logístico. O feirante não altera mais o status da entrega.
                    </p>
                  )}
                  {selectedOrder.status === "delivered" && (
                    <p className="inline-success">Pedido entregue e elegível para liberação financeira.</p>
                  )}
                  {selectedOrder.status === "rejected" && (
                    <p className="inline-success">
                      Pedido encerrado. Motivo: {selectedOrder.rejectReason || "não informado"}.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <ModuleHeader
                    badge={`${orders.filter((order) => order.status === "new").length} novos`}
                    title="Pedidos da banca"
                    description="Abra um pedido para aceitar, preparar e marcar como pronto. As etapas de entrega ficam com o entregador."
                  />
                  <div className="operation-list detailed">
                    {orders.map((order) => (
                      <article key={order.id}>
                        <Package />
                        <div>
                          <b>
                            {order.id} · {order.customer}
                          </b>
                          <small>
                            {vendorOrderStatusLabel(order.status)} · {order.items.length} itens ·{" "}
                            {money(order.value)} · {order.createdAt}
                          </small>
                        </div>
                        <button className="mini-toggle" onClick={() => setSelectedOrderId(order.id)}>
                          Abrir pedido
                        </button>
                      </article>
                    ))}
                  </div>
                </>
              )
            ) : active === "Produtos" ? (
              productEditorId !== null ? (
                <>
                  <ModuleHeader
                    badge={productEditorId === "new" ? "Novo produto" : "Editar produto"}
                    title={productEditorId === "new" ? "Cadastrar produto" : productDraft.name}
                    description="Preço, unidade comercial, peso logístico, estoque e foto são tratados separadamente."
                  />
                  <form className="form-card" onSubmit={saveProduct}>
                    <label>
                      Foto principal
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          imageFileToDataUrl(file, (photoDataUrl) =>
                            setProductDraft((current) => ({
                              ...current,
                              photoDataUrl,
                              photoName: file.name,
                            })),
                          );
                        }}
                      />
                    </label>
                    {productDraft.photoDataUrl ? (
                      <img className="product-editor-preview" src={productDraft.photoDataUrl} alt="" />
                    ) : (
                      <p className="operation-footnote">
                        <Image size={15} /> Produto sem foto. Adicione uma imagem para melhorar a vitrine.
                      </p>
                    )}
                    <label>
                      Nome do produto
                      <input
                        value={productDraft.name}
                        onChange={(event) =>
                          setProductDraft((current) => ({ ...current, name: event.target.value }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Descrição
                      <textarea
                        value={productDraft.description}
                        onChange={(event) =>
                          setProductDraft((current) => ({ ...current, description: event.target.value }))
                        }
                        rows={3}
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label>
                        Categoria
                        <select
                          value={productDraft.category}
                          onChange={(event) =>
                            setProductDraft((current) => ({ ...current, category: event.target.value }))
                          }
                        >
                          {productCategories.map((category) => (
                            <option key={category}>{category}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Unidade de venda
                        <select
                          value={productDraft.saleUnit}
                          onChange={(event) =>
                            setProductDraft((current) => ({ ...current, saleUnit: event.target.value }))
                          }
                        >
                          {productSaleUnits.map((unit) => (
                            <option key={unit}>{unit}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Preço por {productDraft.saleUnit}
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={productDraft.price}
                          onChange={(event) =>
                            setProductDraft((current) => ({
                              ...current,
                              price: Number(event.target.value),
                            }))
                          }
                        />
                      </label>
                      <label>
                        Apresentação
                        <input
                          value={productDraft.packageSize}
                          onChange={(event) =>
                            setProductDraft((current) => ({ ...current, packageSize: event.target.value }))
                          }
                          placeholder="Ex.: bandeja 500 g, 1 maço"
                        />
                      </label>
                      <label>
                        Peso logístico por item (kg)
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={productDraft.weightKg}
                          onChange={(event) =>
                            setProductDraft((current) => ({
                              ...current,
                              weightKg: Number(event.target.value),
                            }))
                          }
                        />
                      </label>
                      <label>
                        Estoque atual
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={productDraft.stock}
                          onChange={(event) =>
                            setProductDraft((current) => ({
                              ...current,
                              stock: Number(event.target.value),
                            }))
                          }
                        />
                      </label>
                      <label>
                        Estoque mínimo
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={productDraft.minStock}
                          onChange={(event) =>
                            setProductDraft((current) => ({
                              ...current,
                              minStock: Number(event.target.value),
                            }))
                          }
                        />
                      </label>
                    </div>
                    <Toggle
                      label="Disponível para venda"
                      description="Com estoque maior que zero, você decide se o produto fica à venda ou pausado."
                      checked={productDraft.active}
                      onChange={(checked) => setProductDraft((current) => ({ ...current, active: checked }))}
                    />
                    <div className="module-action-row">
                      <button type="submit" className="primary-action">
                        Salvar produto
                      </button>
                      <button
                        type="button"
                        className="secondary-action"
                        onClick={() => setProductEditorId(null)}
                      >
                        Cancelar
                      </button>
                      {productEditorId !== "new" && productEditorId !== null && (
                        <button
                          type="button"
                          className="secondary-action"
                          onClick={() => {
                            if (
                              !window.confirm(
                                "Excluir este produto do catálogo? Pedidos antigos continuarão preservados no histórico.",
                              )
                            )
                              return;
                            setVendorItems((current) =>
                              current.filter((item) => item.id !== productDraft.id),
                            );
                            setProductEditorId(null);
                            showNotice("Produto excluído do catálogo.");
                          }}
                        >
                          <Trash2 size={17} /> Excluir produto
                        </button>
                      )}
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <ModuleHeader
                    badge={`${vendorItems.length} produtos`}
                    title="Produtos da banca"
                    description="Cadastre novos produtos ou abra um produto existente para editar todos os campos."
                  />
                  <button className="primary-action" onClick={openNewProduct}>
                    <Plus size={17} /> Adicionar produto
                  </button>
                  {inventory}
                </>
              )
            ) : active === "Estoque" ? (
              <>
                <ModuleHeader
                  badge="Controle real"
                  title="Estoque da banca"
                  description="Os indicadores abaixo são calculados a partir dos próprios produtos."
                />
                <div className="module-kpi-strip">
                  <article>
                    <strong>{totalStock}</strong>
                    <span>unidades comerciais em estoque</span>
                  </article>
                  <article>
                    <strong>{lowStockCount}</strong>
                    <span>alertas abaixo do mínimo</span>
                  </article>
                  <article>
                    <strong>{pausedCount}</strong>
                    <span>pausados pelo feirante</span>
                  </article>
                  <article>
                    <strong>{outOfStockCount}</strong>
                    <span>estoques esgotados</span>
                  </article>
                </div>
                <label>
                  Motivo do próximo ajuste
                  <select value={stockReason} onChange={(event) => setStockReason(event.target.value)}>
                    <option>Ajuste manual</option>
                    <option>Venda presencial</option>
                    <option>Perda/avaria</option>
                    <option>Entrada de mercadoria</option>
                    <option>Inventário/conferência</option>
                  </select>
                </label>
                {inventory}
                <SectionHistory history={stockHistory} />
              </>
            ) : active === "Minha banca" ? (
              <>
                <ModuleHeader
                  badge="Perfil público"
                  title={bankProfile.name}
                  description={`${bankProfile.fairName} · Banca ${bankProfile.box || "sem número"}`}
                />
                {bankEditing ? (
                  <form
                    className="form-card"
                    onSubmit={(event) => {
                      event.preventDefault();
                      setBankEditing(false);
                      showNotice("Dados da banca salvos.");
                    }}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label>
                        Nome da banca
                        <input
                          value={bankProfile.name}
                          onChange={(event) =>
                            setBankProfile((current) => ({ ...current, name: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        Feira
                        <select
                          value={bankProfile.fairName}
                          onChange={(event) =>
                            setBankProfile((current) => ({ ...current, fairName: event.target.value }))
                          }
                        >
                          {fairs
                            .filter((fair) => fair.source !== "demo")
                            .map((fair) => (
                              <option key={fair.name} value={fair.name}>
                                {fair.name} · {fair.place}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label>
                        Box/banca
                        <input
                          value={bankProfile.box}
                          onChange={(event) =>
                            setBankProfile((current) => ({ ...current, box: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        Corredor/ala
                        <input
                          value={bankProfile.corridor}
                          onChange={(event) =>
                            setBankProfile((current) => ({ ...current, corridor: event.target.value }))
                          }
                        />
                      </label>
                    </div>
                    <label>
                      Descrição pública
                      <textarea
                        value={bankProfile.description}
                        onChange={(event) =>
                          setBankProfile((current) => ({ ...current, description: event.target.value }))
                        }
                        rows={3}
                      />
                    </label>
                    <label>
                      Categorias
                      <input
                        value={bankProfile.categories}
                        onChange={(event) =>
                          setBankProfile((current) => ({ ...current, categories: event.target.value }))
                        }
                        placeholder="Ex.: hortifruti, orgânicos, cestas"
                      />
                    </label>
                    <label>
                      Ponto de referência
                      <input
                        value={bankProfile.reference}
                        onChange={(event) =>
                          setBankProfile((current) => ({ ...current, reference: event.target.value }))
                        }
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label>
                        Telefone comercial
                        <input
                          value={bankProfile.phone}
                          onChange={(event) =>
                            setBankProfile((current) => ({ ...current, phone: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        WhatsApp comercial
                        <input
                          value={bankProfile.whatsapp}
                          onChange={(event) =>
                            setBankProfile((current) => ({ ...current, whatsapp: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        Logo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            imageFileToDataUrl(file, (logoDataUrl) =>
                              setBankProfile((current) => ({ ...current, logoDataUrl })),
                            );
                          }}
                        />
                      </label>
                      <label>
                        Foto de capa
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            imageFileToDataUrl(file, (coverDataUrl) =>
                              setBankProfile((current) => ({ ...current, coverDataUrl })),
                            );
                          }}
                        />
                      </label>
                    </div>
                    <button className="primary-action" type="submit">
                      Salvar banca
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="vendor-profile-card">
                      <span>
                        {bankProfile.logoDataUrl ? (
                          <img src={bankProfile.logoDataUrl} alt="" className="bank-logo-preview" />
                        ) : (
                          "🥬"
                        )}
                      </span>
                      <div>
                        <b>{approvalStatus === "Aprovado" ? "Banca verificada" : approvalStatus}</b>
                        <small>
                          Box {bankProfile.box || "—"} · {bankProfile.categories || "categorias a definir"}
                        </small>
                      </div>
                      <button
                        className={storeOpen ? "status-button active" : "status-button"}
                        onClick={() => setStoreOpen((value) => !value)}
                        disabled={approvalStatus !== "Aprovado"}
                      >
                        {effectiveStoreOpen ? "Aberta agora" : "Fechada"}
                      </button>
                    </div>
                    <div className="module-action-row">
                      <button className="primary-action" onClick={() => setBankEditing(true)}>
                        <Edit3 size={17} /> Editar banca
                      </button>
                      <button className="secondary-action" onClick={() => setBankPreview((value) => !value)}>
                        <Eye size={17} /> Visualizar como cliente
                      </button>
                    </div>
                    {bankPreview && (
                      <div className="surface-card">
                        {bankProfile.coverDataUrl && (
                          <img className="bank-cover-preview" src={bankProfile.coverDataUrl} alt="" />
                        )}
                        <span className="eyebrow">Prévia pública</span>
                        <h3>{bankProfile.name}</h3>
                        <p>{bankProfile.description}</p>
                        <p>
                          {bankProfile.fairName} · Banca {bankProfile.box || "—"} ·{" "}
                          {bankProfile.reference || "sem referência"}
                        </p>
                        <p>{bankProfile.categories}</p>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : active === "Horários" ? (
              <div className="space-y-3">
                <ModuleHeader
                  badge={effectiveStoreOpen ? "Aberta agora" : "Fechada"}
                  title="Horários de venda"
                  description="O status da banca respeita o horário da feira ou a agenda própria escolhida por você."
                />
                <div className="surface-card">
                  <span className="eyebrow">{currentScheduleStatus.label}</span>
                  <b>{bankProfile.fairName}</b>
                  <p>{officialHours.label}</p>
                  <small>{officialHours.verification}</small>
                  {useFairHours && bankProfile.fairName !== "Feira do Produtor Rural" && (
                    <p className="operation-footnote">
                      Para esta feira, o texto oficial está cadastrado, mas a agenda estruturada ainda precisa
                      ser confirmada para calcular “aberta agora” automaticamente.
                    </p>
                  )}
                </div>
                <Toggle
                  label="Usar horário padrão da feira"
                  description="Ativa exclusivamente a agenda oficial cadastrada para a feira."
                  checked={useFairHours}
                  onChange={(checked) => setUseFairHours(checked)}
                />
                <Toggle
                  label="Definir meu próprio horário"
                  description="Ao ativar, o horário padrão é desativado. Fechamentos após meia-noite pertencem ao dia seguinte."
                  checked={!useFairHours}
                  onChange={(checked) => setUseFairHours(!checked)}
                />

                {!useFairHours && (
                  <div className="operation-list detailed">
                    {schedule.map((item) => {
                      const overnight =
                        item.enabled &&
                        item.open &&
                        item.close &&
                        minutesFromTime(item.close) < minutesFromTime(item.open);
                      return (
                        <article key={item.day}>
                          <CalendarClock />
                          <div>
                            <b>{item.day}</b>
                            {overnight && <small>Fecha no dia seguinte.</small>}
                            <div className="grid gap-2 sm:grid-cols-2">
                              <label>
                                Abertura
                                <input
                                  type="time"
                                  value={item.open}
                                  disabled={!item.enabled}
                                  onChange={(event) =>
                                    updateScheduleDay(item.day, { open: event.target.value })
                                  }
                                />
                              </label>
                              <label>
                                Fechamento
                                <input
                                  type="time"
                                  value={item.close}
                                  disabled={!item.enabled}
                                  onChange={(event) =>
                                    updateScheduleDay(item.day, { close: event.target.value })
                                  }
                                />
                              </label>
                              <label>
                                Início da pausa
                                <input
                                  type="time"
                                  value={item.breakStart}
                                  disabled={!item.enabled}
                                  onChange={(event) =>
                                    updateScheduleDay(item.day, { breakStart: event.target.value })
                                  }
                                />
                              </label>
                              <label>
                                Fim da pausa
                                <input
                                  type="time"
                                  value={item.breakEnd}
                                  disabled={!item.enabled}
                                  onChange={(event) =>
                                    updateScheduleDay(item.day, { breakEnd: event.target.value })
                                  }
                                />
                              </label>
                            </div>
                          </div>
                          <button
                            className={item.enabled ? "mini-toggle active" : "mini-toggle"}
                            onClick={() => updateScheduleDay(item.day, { enabled: !item.enabled })}
                          >
                            {item.enabled ? "Aberto" : "Fechado"}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                )}

                <div className="surface-card">
                  <b>Regra de virada do dia</b>
                  <p>
                    Um horário como 19:00 → 02:00 significa abertura às 19h e fechamento às 02h do dia
                    seguinte.
                  </p>
                </div>
              </div>
            ) : active === "Entrega/retirada" ? (
              <>
                <ModuleHeader
                  badge="Logística"
                  title="Entrega e retirada"
                  description="Configure as modalidades. O veículo é escolhido pela capacidade real disponível, sem limite fixo de 20 kg."
                />
                <Toggle
                  label="Entrega pelo Feiraê"
                  description="Disponibiliza o pedido para entregadores aprovados com veículo compatível."
                  checked={deliverySettings.deliveryEnabled}
                  onChange={(checked) =>
                    setDeliverySettings((current) => ({ ...current, deliveryEnabled: checked }))
                  }
                />
                <Toggle
                  label="Retirada na banca"
                  description="Cliente retira no box depois que o pedido estiver pronto."
                  checked={deliverySettings.pickupEnabled}
                  onChange={(checked) =>
                    setDeliverySettings((current) => ({ ...current, pickupEnabled: checked }))
                  }
                />
                <Toggle
                  label="Aceitar dinheiro na entrega"
                  description="Libera pagamento em dinheiro ao receber. O cliente pode informar valor para troco."
                  checked={deliverySettings.acceptCashOnDelivery}
                  onChange={(checked) =>
                    setDeliverySettings((current) => ({ ...current, acceptCashOnDelivery: checked }))
                  }
                />
                <Toggle
                  label="Aceitar cartão na maquininha"
                  description="Libera pagamento por cartão no recebimento quando a operação possui maquininha."
                  checked={deliverySettings.acceptCardOnDelivery}
                  onChange={(checked) =>
                    setDeliverySettings((current) => ({ ...current, acceptCardOnDelivery: checked }))
                  }
                />
                <Toggle
                  label="Oferecer frete grátis pago pela banca"
                  description="O cliente paga R$ 0 pela entrega; a remuneração do entregador é abatida do recebível do feirante."
                  checked={deliverySettings.absorbDeliveryFee}
                  onChange={(checked) =>
                    setDeliverySettings((current) => ({ ...current, absorbDeliveryFee: checked }))
                  }
                />
                <label>
                  Instruções para retirada
                  <textarea
                    rows={3}
                    value={deliverySettings.pickupInstructions}
                    onChange={(event) =>
                      setDeliverySettings((current) => ({
                        ...current,
                        pickupInstructions: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="operation-list detailed">
                  {vehicleRules.map((vehicle) => (
                    <article key={vehicle.name}>
                      <Truck />
                      <div>
                        <b>
                          {vehicle.name} · até {vehicle.maxKg} kg de referência
                        </b>
                        <small>
                          {vehicle.note}. O entregador informa a capacidade real do próprio veículo.
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : active === "Promoções" ? (
              <>
                <ModuleHeader
                  badge={`${promotions.filter((promotion) => promotionStatus(promotion) === "Ativa").length} ativas`}
                  title="Promoções da banca"
                  description="Crie campanhas com regra, período, limite de uso, pedido mínimo e público-alvo."
                />
                {!promotionEditorOpen ? (
                  <>
                    <div className="module-action-row">
                      <button className="primary-action" onClick={() => startPromotion("percentual")}>
                        <Plus size={17} /> Nova promoção
                      </button>
                    </div>
                    <div className="operation-list detailed">
                      {promotions.map((promotion) => {
                        const status = promotionStatus(promotion);
                        return (
                          <article key={promotion.id}>
                            <Star />
                            <div>
                              <b>{promotion.name}</b>
                              <small>
                                {promotion.rule} · {promotion.usedCount}/{promotion.usageLimit || "∞"} usos
                                {promotion.minimumOrder
                                  ? ` · pedido mínimo ${money(promotion.minimumOrder)}`
                                  : ""}
                                {promotion.target ? ` · alvo: ${promotion.target}` : ""}
                              </small>
                              <small>
                                {status}
                                {promotion.vendorPaysDelivery
                                  ? " · banca paga o frete; entregador recebe normalmente"
                                  : ""}
                              </small>
                            </div>
                            <div className="item-actions">
                              <button className="mini-toggle" onClick={() => editPromotion(promotion)}>
                                Editar
                              </button>
                              <button
                                className={status === "Ativa" ? "mini-toggle active" : "mini-toggle"}
                                onClick={() =>
                                  setPromotions((current) =>
                                    current.map((item) =>
                                      item.id === promotion.id ? { ...item, active: !item.active } : item,
                                    ),
                                  )
                                }
                              >
                                {promotion.active ? "Encerrar" : "Reativar"}
                              </button>
                              <button
                                className="mini-toggle"
                                onClick={() => {
                                  if (
                                    !window.confirm(
                                      "Excluir esta promoção? O histórico de pedidos que já usaram a campanha não será alterado.",
                                    )
                                  )
                                    return;
                                  setPromotions((current) =>
                                    current.filter((item) => item.id !== promotion.id),
                                  );
                                  showNotice("Promoção excluída.");
                                }}
                              >
                                <Trash2 size={15} /> Excluir
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <form className="form-card" onSubmit={savePromotion}>
                    <label>
                      Tipo de promoção
                      <select
                        value={promotionDraft.type}
                        onChange={(event) => {
                          const type = event.target.value as VendorPromotionType;
                          setPromotionDraft((current) => ({
                            ...current,
                            type,
                            vendorPaysDelivery: type === "freteGratis",
                          }));
                        }}
                      >
                        <option value="percentual">Desconto percentual</option>
                        <option value="valorFixo">Desconto em valor fixo</option>
                        <option value="compreLeve">Compre X, leve Y</option>
                        <option value="produtoCategoria">Desconto por produto/categoria</option>
                        <option value="freteGratis">Frete grátis pago pela banca</option>
                        <option value="horario">Oferta por horário</option>
                        <option value="cupom">Cupom</option>
                        <option value="combo">Combo</option>
                      </select>
                    </label>
                    <label>
                      Nome da campanha
                      <input
                        value={promotionDraft.name}
                        onChange={(event) =>
                          setPromotionDraft((current) => ({ ...current, name: event.target.value }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Regra exibida ao cliente
                      <textarea
                        rows={3}
                        value={promotionDraft.rule}
                        onChange={(event) =>
                          setPromotionDraft((current) => ({ ...current, rule: event.target.value }))
                        }
                        placeholder="Ex.: 10% em frutas; compre 2 leve 3; frete grátis acima de R$ 80"
                        required
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {["percentual", "valorFixo", "produtoCategoria"].includes(promotionDraft.type) && (
                        <label>
                          {promotionDraft.type === "percentual"
                            ? "Percentual de desconto (%)"
                            : "Valor do desconto (R$)"}
                          <input
                            type="number"
                            min="0"
                            step={promotionDraft.type === "percentual" ? "1" : "0.01"}
                            value={promotionDraft.discountValue ?? 0}
                            onChange={(event) =>
                              setPromotionDraft((current) => ({
                                ...current,
                                discountValue: Number(event.target.value),
                              }))
                            }
                          />
                        </label>
                      )}
                      {["percentual", "valorFixo", "produtoCategoria", "compreLeve"].includes(
                        promotionDraft.type,
                      ) && (
                        <label>
                          Produto/categoria alvo
                          <input
                            value={promotionDraft.target ?? ""}
                            onChange={(event) =>
                              setPromotionDraft((current) => ({ ...current, target: event.target.value }))
                            }
                            placeholder="Ex.: Cesta de frutas ou Hortifruti"
                          />
                        </label>
                      )}
                      <label>
                        Pedido mínimo (R$)
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={promotionDraft.minimumOrder ?? 0}
                          onChange={(event) =>
                            setPromotionDraft((current) => ({
                              ...current,
                              minimumOrder: Number(event.target.value),
                            }))
                          }
                        />
                      </label>
                      <label>
                        Limite de usos
                        <input
                          type="number"
                          min="0"
                          value={promotionDraft.usageLimit}
                          onChange={(event) =>
                            setPromotionDraft((current) => ({
                              ...current,
                              usageLimit: Number(event.target.value),
                            }))
                          }
                        />
                        <small>0 = sem limite.</small>
                      </label>
                      <label>
                        Início
                        <input
                          type="datetime-local"
                          value={promotionDraft.startsAt}
                          onChange={(event) =>
                            setPromotionDraft((current) => ({ ...current, startsAt: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        Fim
                        <input
                          type="datetime-local"
                          value={promotionDraft.endsAt}
                          onChange={(event) =>
                            setPromotionDraft((current) => ({ ...current, endsAt: event.target.value }))
                          }
                        />
                      </label>
                    </div>
                    {promotionDraft.type === "freteGratis" && (
                      <p className="inline-success">
                        Frete grátis é uma promoção: o cliente paga R$ 0, a banca absorve o custo e a
                        remuneração do entregador não é reduzida.
                      </p>
                    )}
                    <div className="module-action-row">
                      <button type="submit" className="primary-action">
                        Salvar campanha
                      </button>
                      <button
                        type="button"
                        className="secondary-action"
                        onClick={() => {
                          setPromotionEditorOpen(false);
                          setPromotionEditingId(null);
                        }}
                      >
                        Cancelar
                      </button>
                      {promotionEditingId && (
                        <button
                          type="button"
                          className="secondary-action"
                          onClick={() => {
                            if (!window.confirm("Excluir esta promoção?")) return;
                            setPromotions((current) =>
                              current.filter((item) => item.id !== promotionEditingId),
                            );
                            setPromotionEditorOpen(false);
                            setPromotionEditingId(null);
                            showNotice("Promoção excluída.");
                          }}
                        >
                          <Trash2 size={17} /> Excluir promoção
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </>
            ) : active === "Financeiro" ? (
              <>
                <ModuleHeader
                  badge="Receitas e repasses"
                  title="Financeiro da banca"
                  description="Valores separados por estado. Taxas comerciais reais só serão aplicadas quando o provedor for integrado."
                />
                <div className="operation-metrics">
                  <article>
                    <strong>{money(pendingGross)}</strong>
                    <span>bruto pendente em pedidos abertos</span>
                  </article>
                  <article>
                    <strong>{money(availableGross)}</strong>
                    <span>bruto elegível após entrega</span>
                  </article>
                  <article>
                    <strong>{vendorAccount.pixKey ? "Cadastrado" : "Pendente"}</strong>
                    <span>destino de recebimento</span>
                  </article>
                </div>
                <div className="finance-breakdown">
                  <p>
                    <span>Total atual dos pedidos</span>
                    <strong>{money(grossOrders)}</strong>
                  </p>
                  <p>
                    <span>Taxa Feiraê</span>
                    <strong>A definir</strong>
                  </p>
                  <p>
                    <span>Taxa do provedor</span>
                    <strong>A definir</strong>
                  </p>
                  <p>
                    <span>Próximo repasse</span>
                    <strong>Depende do provedor</strong>
                  </p>
                </div>
                {activeFreeShipping || deliverySettings.absorbDeliveryFee ? (
                  <p className="inline-success">
                    Frete grátis patrocinado está ativo: o custo da entrega será abatido do recebível do
                    feirante, sem reduzir a remuneração do entregador.
                  </p>
                ) : null}
                <div className="operation-list detailed">
                  {orders.map((order) => (
                    <article key={order.id}>
                      <Wallet />
                      <div>
                        <b>
                          {order.id} · {money(order.value)}
                        </b>
                        <small>
                          {vendorOrderStatusLabel(order.status)} · valor bruto antes de taxas/repasses reais
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
                {!vendorAccount.pixKey && !vendorAccount.accountNumber ? (
                  <button className="primary-action" onClick={() => setActive("Conta")}>
                    Cadastrar destino de recebimento
                  </button>
                ) : vendorAvailableForPayout > 0 ? (
                  <button
                    className="primary-action"
                    onClick={() =>
                      setSettlementStatus((current) => {
                        const next = { ...current };
                        for (const order of orders) {
                          if (order.status === "delivered" && !next[order.id]) next[order.id] = "requested";
                        }
                        return next;
                      })
                    }
                  >
                    Solicitar repasse de {money(vendorAvailableForPayout)}
                  </button>
                ) : null}
                {vendorRequestedPayout > 0 && (
                  <button
                    className="secondary-action"
                    onClick={() =>
                      setSettlementStatus((current) =>
                        Object.fromEntries(
                          Object.entries(current).map(([id, status]) => [
                            id,
                            status === "requested" ? "paid" : status,
                          ]),
                        ) as Record<string, "requested" | "paid">,
                      )
                    }
                  >
                    Registrar recebimento de {money(vendorRequestedPayout)}
                  </button>
                )}
                {vendorPaidPayout > 0 && (
                  <p className="inline-success">{money(vendorPaidPayout)} registrado como recebido.</p>
                )}
              </>
            ) : active === "Avaliações" ? (
              <>
                <ModuleHeader
                  badge={`${averageRating.toFixed(1)} ★`}
                  title="Avaliações recebidas"
                  description="Média no topo e avaliações individuais com pedido, data, comentário e resposta da banca."
                />
                <SectionHistoryReview
                  orders={pendingVendorReviewOrders}
                  selectedOrderId={vendorReviewOrderId}
                  score={vendorReviewScore}
                  comment={vendorReviewComment}
                  onSelect={setVendorReviewOrderId}
                  onScore={setVendorReviewScore}
                  onComment={setVendorReviewComment}
                  onSubmit={(orderId) => {
                    const order = vendorUnifiedOrders.find((item) => item.id === orderId);
                    if (!order) return;
                    const reviewSequence = (order.reviews?.length ?? 0) + 1;
                    appendReview(order.id, {
                      id: `vendor-customer-${order.id}-${reviewSequence}`,
                      authorRole: "vendor",
                      targetRole: "customer",
                      targetId: order.customerKey,
                      rating: vendorReviewScore,
                      comment: vendorReviewComment.trim(),
                      createdAt: new Date().toISOString(),
                    });
                    if (order.driver?.driverKey) {
                      appendReview(order.id, {
                        id: `vendor-delivery-${order.id}-${reviewSequence}`,
                        authorRole: "vendor",
                        targetRole: "delivery",
                        targetId: order.driver.driverKey,
                        rating: vendorReviewScore,
                        comment: vendorReviewComment.trim(),
                        createdAt: new Date().toISOString(),
                      });
                    }
                    setVendorReviewOrderId(null);
                    setVendorReviewScore(5);
                    setVendorReviewComment("");
                    showNotice("Avaliação enviada.");
                  }}
                />
                <div className="operation-metrics">
                  <article>
                    <strong>{averageRating.toFixed(1)} ★</strong>
                    <span>média geral</span>
                  </article>
                  <article>
                    <strong>{reviews.length}</strong>
                    <span>avaliações registradas</span>
                  </article>
                  <article>
                    <strong>{reviews.filter((review) => review.response).length}</strong>
                    <span>respondidas</span>
                  </article>
                </div>
                <div className="review-grid compact">
                  {reviews.map((review) => (
                    <article className="review-card" key={review.id}>
                      <strong>{review.rating.toFixed(1)} ★</strong>
                      <div>
                        <b>
                          {review.type} · {review.author}
                        </b>
                        <small>
                          {review.orderId} · {review.date}
                        </small>
                        <p>{review.comment}</p>
                        {review.response && <small>Resposta da banca: {review.response}</small>}
                        {replyingReviewId === review.id ? (
                          <div className="form-card compact">
                            <label>
                              Resposta
                              <textarea
                                value={reviewReply}
                                onChange={(event) => setReviewReply(event.target.value)}
                                rows={2}
                              />
                            </label>
                            <button
                              className="primary-action"
                              onClick={() => {
                                setReviews((current) =>
                                  current.map((item) =>
                                    item.id === review.id ? { ...item, response: reviewReply.trim() } : item,
                                  ),
                                );
                                setReplyingReviewId(null);
                                setReviewReply("");
                              }}
                            >
                              Salvar resposta
                            </button>
                          </div>
                        ) : (
                          <button
                            className="mini-toggle"
                            onClick={() => {
                              setReplyingReviewId(review.id);
                              setReviewReply(review.response);
                            }}
                          >
                            Responder
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : active === "Conta" ? (
              <>
                <ModuleHeader
                  badge="Dados pessoais e recebimento"
                  title="Minha conta"
                  description="Dados do responsável e destino de recebimento. O provedor real validará titularidade e pagamentos."
                />
                <form
                  className="form-card"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setAccountSaved(true);
                    window.setTimeout(() => setAccountSaved(false), 2200);
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label>
                      Nome completo
                      <input
                        value={vendorAccount.name}
                        onChange={(event) =>
                          setVendorAccount((current) => ({ ...current, name: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      CPF
                      <input
                        value={vendorAccount.cpf}
                        onChange={(event) =>
                          setVendorAccount((current) => ({ ...current, cpf: event.target.value }))
                        }
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                      />
                    </label>
                    <label>
                      Data de nascimento
                      <input
                        type="date"
                        value={vendorAccount.birthDate}
                        onChange={(event) =>
                          setVendorAccount((current) => ({ ...current, birthDate: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Telefone
                      <input
                        value={vendorAccount.phone}
                        onChange={(event) =>
                          setVendorAccount((current) => ({ ...current, phone: event.target.value }))
                        }
                        placeholder="(61) 99999-9999"
                      />
                    </label>
                  </div>
                  <label>
                    E-mail
                    <input
                      type="email"
                      value={vendorAccount.email}
                      onChange={(event) =>
                        setVendorAccount((current) => ({ ...current, email: event.target.value }))
                      }
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label>
                      Tipo de cadastro
                      <select
                        value={vendorAccount.businessType}
                        onChange={(event) =>
                          setVendorAccount((current) => ({
                            ...current,
                            businessType: event.target.value,
                          }))
                        }
                      >
                        <option>Pessoa física</option>
                        <option>Pessoa jurídica</option>
                      </select>
                    </label>
                    <label>
                      CNPJ (se houver)
                      <input
                        value={vendorAccount.cnpj}
                        onChange={(event) =>
                          setVendorAccount((current) => ({ ...current, cnpj: event.target.value }))
                        }
                        placeholder="00.000.000/0000-00"
                      />
                    </label>
                    <label>
                      Documento do responsável
                      <input
                        value={vendorAccount.responsibleDocument}
                        onChange={(event) =>
                          setVendorAccount((current) => ({
                            ...current,
                            responsibleDocument: event.target.value,
                          }))
                        }
                        placeholder="RG/CNH"
                      />
                    </label>
                    <label>
                      Forma de recebimento
                      <select
                        value={vendorAccount.receivingMethod}
                        onChange={(event) =>
                          setVendorAccount((current) => ({
                            ...current,
                            receivingMethod: event.target.value,
                          }))
                        }
                      >
                        <option>Pix</option>
                        <option>Conta bancária</option>
                      </select>
                    </label>
                  </div>
                  {vendorAccount.receivingMethod === "Pix" ? (
                    <label>
                      Chave Pix para repasse
                      <input
                        value={vendorAccount.pixKey}
                        onChange={(event) =>
                          setVendorAccount((current) => ({ ...current, pixKey: event.target.value }))
                        }
                        placeholder="CPF, e-mail, telefone ou chave"
                      />
                    </label>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label>
                        Banco
                        <input
                          value={vendorAccount.bankName}
                          onChange={(event) =>
                            setVendorAccount((current) => ({
                              ...current,
                              bankName: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Agência
                        <input
                          value={vendorAccount.agency}
                          onChange={(event) =>
                            setVendorAccount((current) => ({
                              ...current,
                              agency: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Conta
                        <input
                          value={vendorAccount.accountNumber}
                          onChange={(event) =>
                            setVendorAccount((current) => ({
                              ...current,
                              accountNumber: event.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>
                  )}
                  {accountSaved && <p className="inline-success">Alterações salvas neste dispositivo.</p>}
                  <button className="primary-action" type="submit">
                    <Edit3 size={17} /> Salvar alterações
                  </button>
                </form>
              </>
            ) : active === "Documentos" ? (
              <>
                <ModuleHeader
                  badge={approvalStatus}
                  title="Documentação e aprovação"
                  description="Enviar arquivo não aprova o cadastro. Documentos ficam em análise até a validação."
                />
                <div className="region-strip">
                  <Check size={18} />
                  <div>
                    <b>Status do cadastro: {approvalStatus}</b>
                    <p>
                      Enquanto os documentos obrigatórios não estiverem aprovados, a banca não deve vender ou
                      receber repasses no ambiente real.
                    </p>
                  </div>
                </div>
                <div className="operation-list detailed">
                  {documents.map((document) => (
                    <article key={document.id}>
                      <Upload />
                      <div>
                        <b>
                          {document.name}
                          {!document.required && " · quando aplicável"}
                        </b>
                        <small>{document.description}</small>
                        {document.fileName && <small>Arquivo: {document.fileName}</small>}
                        {document.correctionReason && (
                          <small>Correção solicitada: {document.correctionReason}</small>
                        )}
                      </div>
                      <div className="item-actions">
                        <span className="document-status">{vendorDocumentStatusLabel(document.status)}</span>
                        <label className="mini-toggle">
                          {document.fileName ? "Substituir" : "Enviar"}
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            hidden
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) uploadDocument(document, file);
                            }}
                          />
                        </label>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </Panel>
  );
}

function SectionHistoryReview({
  orders,
  selectedOrderId,
  score,
  comment,
  onSelect,
  onScore,
  onComment,
  onSubmit,
}: {
  orders: ReturnType<typeof readUnifiedOrders>;
  selectedOrderId: string | null;
  score: number;
  comment: string;
  onSelect: (id: string | null) => void;
  onScore: (value: number) => void;
  onComment: (value: string) => void;
  onSubmit: (orderId: string) => void;
}) {
  return (
    <div className="surface-card">
      <span className="eyebrow">Avaliar cliente e entrega</span>
      {orders.length ? (
        <div className="operation-list detailed">
          {orders.map((order) => (
            <article key={order.id}>
              <Star />
              <div>
                <b>{order.id} · {order.customerName}</b>
                <small>{order.driver?.name ? `Entregador: ${order.driver.name}` : "Retirada pelo cliente"}</small>
                {selectedOrderId === order.id && (
                  <div className="form-card compact">
                    <label>
                      Nota
                      <select value={score} onChange={(event) => onScore(Number(event.target.value))}>
                        {[5, 4, 3, 2, 1].map((value) => (
                          <option value={value} key={value}>
                            {value} estrela{value === 1 ? "" : "s"}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Comentário
                      <textarea
                        rows={3}
                        value={comment}
                        onChange={(event) => onComment(event.target.value)}
                        placeholder="Como foi a entrega e o atendimento do cliente?"
                      />
                    </label>
                    <div className="module-action-row">
                      <button className="primary-action" onClick={() => onSubmit(order.id)}>
                        Enviar avaliação
                      </button>
                      <button className="secondary-action" onClick={() => onSelect(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {selectedOrderId !== order.id && (
                <button className="mini-toggle" onClick={() => onSelect(order.id)}>
                  Avaliar
                </button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="operation-footnote">Nenhum pedido entregue aguardando avaliação da banca.</p>
      )}
    </div>
  );
}

function SectionHistory({
  history,
}: {
  history: { id: string; product: string; delta: number; reason: string; createdAt: string }[];
}) {
  return (
    <div className="surface-card">
      <span className="eyebrow">Histórico</span>
      <h3>Últimos ajustes de estoque</h3>
      {history.length ? (
        <div className="operation-list">
          {history.slice(0, 6).map((entry) => (
            <article key={entry.id}>
              <Package />
              <div>
                <b>
                  {entry.product} · {entry.delta > 0 ? "+" : ""}
                  {entry.delta}
                </b>
                <small>
                  {entry.reason} · {entry.createdAt}
                </small>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p>Nenhum ajuste registrado nesta aplicativo.</p>
      )}
    </div>
  );
}
