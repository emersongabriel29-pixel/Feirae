import { FormEvent, useState } from "react";
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
  Upload,
  Wallet,
  XCircle,
} from "lucide-react";
import { ModuleHeader, OperationsMenu, Panel, SectionHeading, Toggle } from "../../components/AppComponents";
import { fairs } from "../../data";
import { fairHoursForName } from "../../domain/fairHours";
import { vehicleRules } from "../../domain/marketplace";
import { vendorModuleDetails } from "../../domain/operations";
import type { DemoSession } from "../../types";
import { usePersistentState } from "../../usePersistentState";
import { money } from "../../utils";
import {
  initialBankProfile,
  initialVendorDocuments,
  initialVendorOrders,
  initialVendorProducts,
  initialVendorPromotions,
  initialVendorReviews,
  initialVendorSalesHistory,
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
  type VendorSaleRecord,
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

export function FeiranteOperations({ session, onBack }: { session: DemoSession; onBack: () => void }) {
  const [active, setActive] = useState("Central");
  const [storeOpen, setStoreOpen] = usePersistentState<boolean>("feirae:vendor-store-open", true);
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
  const [salesHistory] = usePersistentState<VendorSaleRecord[]>(
    `feirae:vendor-sales-history:${session.email}`,
    initialVendorSalesHistory,
  );
  const [vendorEvaluationsGiven, setVendorEvaluationsGiven] = usePersistentState<
    {
      id: string;
      orderId: string;
      driverRating: number;
      customerRating: number;
      note: string;
      createdAt: string;
    }[]
  >(`feirae:vendor-evaluations-given:${session.email}`, []);
  const [documents, setDocuments] = usePersistentState<VendorDocument[]>(
    `feirae:vendor-documents:${session.email}`,
    initialVendorDocuments,
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
    type: "combo",
    name: "",
    rule: "",
    startsAt: "",
    endsAt: "",
    active: true,
    vendorPaysDelivery: false,
    usageLimit: 0,
    usedCount: 0,
  });
  const [stockReason, setStockReason] = useState("Ajuste manual");
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [reviewReply, setReviewReply] = useState("");
  const [vendorRatingOrderId, setVendorRatingOrderId] = useState<string | null>(null);
  const [driverRating, setDriverRating] = useState("5");
  const [customerRating, setCustomerRating] = useState("5");
  const [vendorRatingNote, setVendorRatingNote] = useState("");
  const [accountSaved, setAccountSaved] = useState(false);
  const [notice, setNotice] = useState("");

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? null;
  const pendingOrders = orders.filter((order) =>
    ["new", "preparing", "ready_for_pickup", "collected"].includes(order.status),
  );
  const lowStockCount = vendorItems.filter((item) => item.active && item.stock <= item.minStock).length;
  const pausedCount = vendorItems.filter((item) => !item.active).length;
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

  const activeFreeShipping = promotions.some(
    (promotion) => promotion.active && promotion.type === "freteGratis" && promotion.vendorPaysDelivery,
  );
  const salesForPrefix = (prefix: string) => salesHistory.filter((sale) => sale.date.startsWith(prefix));
  const totalSales = (entries: VendorSaleRecord[]) => entries.reduce((sum, sale) => sum + sale.total, 0);
  const todaySales = salesForPrefix("2026-09-25");
  const monthSales = salesForPrefix("2026-09");
  const previousMonthSales = salesForPrefix("2026-08");
  const yearSales = salesForPrefix("2026");
  const monthGross = totalSales(monthSales);
  const previousMonthGross = totalSales(previousMonthSales);
  const yearGross = totalSales(yearSales);
  const monthTicket = monthSales.length ? monthGross / monthSales.length : 0;
  const monthDiscounts = monthSales.reduce((sum, sale) => sum + sale.discount, 0);
  const monthDeliverySubsidy = monthSales.reduce((sum, sale) => sum + sale.deliverySubsidy, 0);
  const monthRefunds = monthSales.reduce((sum, sale) => sum + sale.refund, 0);
  const monthComparison =
    previousMonthGross > 0 ? ((monthGross - previousMonthGross) / previousMonthGross) * 100 : 0;
  const productRanking = Array.from(
    salesHistory
      .flatMap((sale) => sale.items)
      .reduce(
        (map, item) => map.set(item.name, (map.get(item.name) ?? 0) + item.quantity),
        new Map<string, number>(),
      ),
  )
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity);
  const receivingConfigured =
    vendorAccount.receivingMethod === "Pix"
      ? Boolean(vendorAccount.pixKey)
      : Boolean(vendorAccount.bankName && vendorAccount.agency && vendorAccount.accountNumber);
  const pendingVendorEvaluations = orders.filter(
    (order) =>
      order.status === "delivered" &&
      !vendorEvaluationsGiven.some((evaluation) => evaluation.orderId === order.id),
  );
  const selectedVendorEvaluationOrder =
    pendingVendorEvaluations.find((order) => order.id === vendorRatingOrderId) ??
    pendingVendorEvaluations[0] ??
    null;

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
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              items: order.items.map((item) => (item.id === itemId ? { ...item, ...update } : item)),
            }
          : order,
      ),
    );
  }

  function acceptOrder(order: VendorOrder) {
    updateOrder(order.id, { status: "preparing", rejectReason: "" });
    showNotice(`Pedido ${order.id} aceito. Cliente notificado na demonstração.`);
  }

  function rejectOrder(order: VendorOrder) {
    updateOrder(order.id, { status: "rejected", rejectReason });
    showNotice(`Pedido ${order.id} recusado. Motivo registrado.`);
  }

  function markReady(order: VendorOrder) {
    const unresolved = order.items.some((item) => !item.separated || item.unavailable);
    if (unresolved) {
      showNotice("Conclua ou resolva todos os itens antes de marcar o pedido como pronto.");
      return;
    }
    updateOrder(order.id, { status: "ready_for_pickup" });
    showNotice(`Pedido ${order.id} pronto. Agora aguarda um entregador compatível.`);
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
      active: productDraft.photoDataUrl ? productDraft.active : false,
    };
    setVendorItems((current) =>
      productEditorId === "new"
        ? [...current, nextProduct]
        : current.map((item) => (item.id === nextProduct.id ? nextProduct : item)),
    );
    setProductEditorId(null);
    showNotice(
      nextProduct.photoDataUrl
        ? "Produto salvo."
        : "Produto salvo como pausado. Adicione uma foto antes de colocá-lo à venda.",
    );
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

  function startPromotion(type: VendorPromotionType = "combo") {
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
      {vendorItems.map((item) => (
        <article key={item.id}>
          <span className={item.stock <= item.minStock ? "inventory-dot warning" : "inventory-dot"} />
          <div>
            <b>{item.name}</b>
            <small>
              {item.stock} {item.saleUnit}(s) · {money(item.price)} / {item.saleUnit} · peso logístico{" "}
              {item.weightKg} kg · mínimo {item.minStock}
            </small>
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
                className={item.active ? "mini-toggle active" : "mini-toggle"}
                onClick={() =>
                  setVendorItems((current) =>
                    current.map((product) =>
                      product.id === item.id
                        ? {
                            ...product,
                            active: product.photoDataUrl && product.stock > 0 ? !product.active : false,
                          }
                        : product,
                    ),
                  )
                }
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
    <Panel
      title="Operação do feirante"
      subtitle="Fluxos funcionais locais; integração real entra na etapa de backend"
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
                <strong>{storeOpen ? "Aberta" : "Fechada"}</strong>
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
                    <span>pedidos demonstrativos</span>
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
                  {selectedOrder.status === "ready_for_pickup" && (
                    <div className="region-strip">
                      <Truck size={18} />
                      <div>
                        <b>Aguardando entregador</b>
                        <p>
                          O feirante terminou sua etapa. Coleta, rota e entrega pertencem ao fluxo do
                          entregador.
                        </p>
                      </div>
                    </div>
                  )}
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
                        <Image size={15} /> Produto sem foto. Ele ficará pausado até receber uma imagem.
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
                      description="Para publicar, o produto precisa ter foto e estoque."
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
                    <span>produtos pausados</span>
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
                        {storeOpen ? "Aberta" : "Fechada"}
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
                  badge="Agenda da banca"
                  title="Horários de venda"
                  description="O horário padrão vem da feira realmente vinculada à banca."
                />
                <div className="surface-card">
                  <b>{bankProfile.fairName}</b>
                  <p>{officialHours.label}</p>
                  <small>{officialHours.verification}</small>
                </div>
                <Toggle
                  label="Usar horário padrão da feira"
                  description="Mantém a banca alinhada ao horário oficial cadastrado para essa feira."
                  checked={useFairHours}
                  onChange={setUseFairHours}
                />
                <Toggle
                  label="Definir meu próprio horário"
                  description="Escolha dias, abertura, fechamento e intervalos. Deve respeitar as regras da feira."
                  checked={!useFairHours}
                  onChange={(checked) => setUseFairHours(!checked)}
                />
                {!useFairHours && (
                  <div className="operation-list detailed">
                    {schedule.map((item) => (
                      <article key={item.day}>
                        <CalendarClock />
                        <div>
                          <b>{item.day}</b>
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
                    ))}
                  </div>
                )}
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
                  badge={`${promotions.filter((promotion) => promotion.active).length} ativas`}
                  title="Promoções da banca"
                  description="Crie, edite, encerre e acompanhe campanhas. Frete grátis deixa explícito quem paga a entrega."
                />
                {!promotionEditorOpen ? (
                  <>
                    <div className="module-action-row">
                      <button className="primary-action" onClick={() => startPromotion("combo")}>
                        <Plus size={17} /> Nova promoção
                      </button>
                      <button className="secondary-action" onClick={() => startPromotion("freteGratis")}>
                        Frete grátis
                      </button>
                    </div>
                    <div className="operation-list detailed">
                      {promotions.map((promotion) => (
                        <article key={promotion.id}>
                          <Star />
                          <div>
                            <b>{promotion.name}</b>
                            <small>
                              {promotion.rule} · {promotion.usedCount}/{promotion.usageLimit || "∞"} usos ·{" "}
                              {promotion.vendorPaysDelivery ? "banca paga o frete" : "sem subsídio de frete"}
                            </small>
                          </div>
                          <div className="item-actions">
                            <button className="mini-toggle" onClick={() => editPromotion(promotion)}>
                              Editar
                            </button>
                            <button
                              className={promotion.active ? "mini-toggle active" : "mini-toggle"}
                              onClick={() =>
                                setPromotions((current) =>
                                  current.map((item) =>
                                    item.id === promotion.id ? { ...item, active: !item.active } : item,
                                  ),
                                )
                              }
                            >
                              {promotion.active ? "Ativa" : "Encerrada"}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                ) : (
                  <form className="form-card" onSubmit={savePromotion}>
                    <label>
                      Tipo
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
                        <option value="combo">Combo</option>
                        <option value="horario">Oferta por horário</option>
                        <option value="cupom">Cupom</option>
                        <option value="freteGratis">Frete grátis pago pela banca</option>
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
                      Regra
                      <textarea
                        rows={3}
                        value={promotionDraft.rule}
                        onChange={(event) =>
                          setPromotionDraft((current) => ({ ...current, rule: event.target.value }))
                        }
                        placeholder="Ex.: frete grátis acima de R$ 80, limitado a 30 pedidos"
                        required
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label>
                        Início
                        <input
                          type="datetime-local"
                          value={promotionDraft.startsAt}
                          onChange={(event) =>
                            setPromotionDraft((current) => ({
                              ...current,
                              startsAt: event.target.value,
                            }))
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
                      </label>
                    </div>
                    {promotionDraft.type === "freteGratis" && (
                      <p className="inline-success">
                        O entregador continua recebendo a remuneração da corrida; o custo é descontado do
                        recebível da banca.
                      </p>
                    )}
                    <div className="module-action-row">
                      <button type="submit" className="primary-action">
                        Salvar campanha
                      </button>
                      <button
                        type="button"
                        className="secondary-action"
                        onClick={() => setPromotionEditorOpen(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : active === "Financeiro" ? (
              <>
                <ModuleHeader
                  badge="Receitas e repasses"
                  title="Financeiro da banca"
                  description="Acompanhe vendas por período, ticket médio, produtos mais pedidos e valores a receber."
                />
                <div className="operation-metrics">
                  <article>
                    <strong>{money(totalSales(todaySales))}</strong>
                    <span>vendas hoje</span>
                  </article>
                  <article>
                    <strong>{money(monthGross)}</strong>
                    <span>mês atual</span>
                  </article>
                  <article>
                    <strong>{money(yearGross)}</strong>
                    <span>total no ano</span>
                  </article>
                </div>
                <div className="module-kpi-strip">
                  <article>
                    <strong>{monthSales.length}</strong>
                    <span>pedidos no mês</span>
                  </article>
                  <article>
                    <strong>{money(monthTicket)}</strong>
                    <span>ticket médio</span>
                  </article>
                  <article>
                    <strong>
                      {monthComparison >= 0 ? "+" : ""}
                      {monthComparison.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                    </strong>
                    <span>vs. mês anterior</span>
                  </article>
                  <article>
                    <strong>{money(monthDiscounts)}</strong>
                    <span>descontos no mês</span>
                  </article>
                  <article>
                    <strong>{money(monthDeliverySubsidy)}</strong>
                    <span>frete patrocinado</span>
                  </article>
                  <article>
                    <strong>{money(monthRefunds)}</strong>
                    <span>estornos/reembolsos</span>
                  </article>
                </div>
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
                    <strong>{receivingConfigured ? "Cadastrado" : "Pendente"}</strong>
                    <span>destino de recebimento</span>
                  </article>
                </div>
                <div className="surface-card">
                  <span className="eyebrow">Mais pedidos</span>
                  <h3>Produtos mais vendidos</h3>
                  <div className="finance-breakdown">
                    {productRanking.slice(0, 5).map((product, index) => (
                      <p key={product.name}>
                        <span>
                          {index + 1}. {product.name}
                        </span>
                        <strong>{product.quantity} unidade(s)</strong>
                      </p>
                    ))}
                  </div>
                </div>
                <div className="finance-breakdown">
                  <p>
                    <span>Taxa Feiraê</span>
                    <strong>A definir no provedor</strong>
                  </p>
                  <p>
                    <span>Taxa do provedor</span>
                    <strong>A definir</strong>
                  </p>
                  <p>
                    <span>Como o repasse funciona</span>
                    <strong>Pendente → disponível → solicitado/processado → pago</strong>
                  </p>
                  <p>
                    <span>Próximo repasse</span>
                    <strong>Depende do provedor</strong>
                  </p>
                </div>
                {activeFreeShipping || deliverySettings.absorbDeliveryFee ? (
                  <p className="inline-success">
                    Frete grátis patrocinado está ativo: o custo da entrega é abatido do recebível da banca,
                    sem reduzir a remuneração do entregador.
                  </p>
                ) : null}
                <div className="operation-list detailed">
                  {salesHistory.map((sale) => (
                    <article key={sale.id}>
                      <Wallet />
                      <div>
                        <b>
                          {new Date(sale.date).toLocaleDateString("pt-BR")} · {money(sale.total)}
                        </b>
                        <small>
                          desconto {money(sale.discount)} · frete patrocinado {money(sale.deliverySubsidy)} ·
                          estorno {money(sale.refund)}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
                {!receivingConfigured && (
                  <button className="primary-action" onClick={() => setActive("Conta")}>
                    Cadastrar destino de recebimento
                  </button>
                )}
              </>
            ) : active === "Avaliações" ? (
              <>
                <ModuleHeader
                  badge={`${averageRating.toFixed(1)} ★`}
                  title="Avaliações da banca"
                  description="Receba avaliações e, após concluir o pedido, avalie entregador e cliente."
                />
                <div className="operation-metrics">
                  <article>
                    <strong>{averageRating.toFixed(1)} ★</strong>
                    <span>média recebida</span>
                  </article>
                  <article>
                    <strong>{reviews.length}</strong>
                    <span>avaliações recebidas</span>
                  </article>
                  <article>
                    <strong>{pendingVendorEvaluations.length}</strong>
                    <span>pedidos para avaliar</span>
                  </article>
                </div>

                {selectedVendorEvaluationOrder ? (
                  <form
                    className="form-card"
                    onSubmit={(event) => {
                      event.preventDefault();
                      setVendorEvaluationsGiven((current) => [
                        {
                          id: String(Date.now()),
                          orderId: selectedVendorEvaluationOrder.id,
                          driverRating: Number(driverRating),
                          customerRating: Number(customerRating),
                          note: vendorRatingNote.trim(),
                          createdAt: new Date().toISOString(),
                        },
                        ...current,
                      ]);
                      setVendorRatingOrderId(null);
                      setDriverRating("5");
                      setCustomerRating("5");
                      setVendorRatingNote("");
                    }}
                  >
                    <b>Avaliar pedido {selectedVendorEvaluationOrder.id}</b>
                    <small>
                      Cliente {selectedVendorEvaluationOrder.customer} · entregador{" "}
                      {selectedVendorEvaluationOrder.driverName || "não informado"}
                    </small>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label>
                        Nota do entregador
                        <select
                          value={driverRating}
                          onChange={(event) => setDriverRating(event.target.value)}
                        >
                          {[5, 4, 3, 2, 1].map((value) => (
                            <option value={value} key={value}>
                              {value} estrela(s)
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Nota do cliente
                        <select
                          value={customerRating}
                          onChange={(event) => setCustomerRating(event.target.value)}
                        >
                          {[5, 4, 3, 2, 1].map((value) => (
                            <option value={value} key={value}>
                              {value} estrela(s)
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label>
                      Observação operacional
                      <textarea
                        rows={3}
                        value={vendorRatingNote}
                        onChange={(event) => setVendorRatingNote(event.target.value)}
                        placeholder="Pontualidade, cuidado na coleta, comunicação, retirada..."
                      />
                    </label>
                    <button className="primary-action" type="submit">
                      Enviar avaliações
                    </button>
                  </form>
                ) : (
                  <p className="operation-footnote">Nenhum pedido entregue aguardando avaliação da banca.</p>
                )}

                {vendorEvaluationsGiven.length > 0 && (
                  <div className="operation-list detailed">
                    {vendorEvaluationsGiven.map((evaluation) => (
                      <article key={evaluation.id}>
                        <Star />
                        <div>
                          <b>{evaluation.orderId}</b>
                          <small>
                            Entregador {evaluation.driverRating} ★ · Cliente {evaluation.customerRating} ★
                            {evaluation.note ? ` · ${evaluation.note}` : ""}
                          </small>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                <SectionHeading eyebrow="Recebidas" title="O que clientes e entregadores avaliaram" />
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
                <p className="operation-footnote">
                  Avaliações cruzadas devem ficar ocultas até ambas as partes enviarem ou a janela terminar,
                  reduzindo retaliação.
                </p>
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

      <p className="operation-footnote">
        Este fluxo já funciona localmente para validação de produto. Aprovação, notificações, pagamentos,
        repasses e sincronização definitiva dependem do backend/provedor.
      </p>
    </Panel>
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
        <p>Nenhum ajuste registrado nesta demonstração.</p>
      )}
    </div>
  );
}
