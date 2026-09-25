import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  Bike,
  Check,
  ChevronRight,
  Info,
  MapPin,
  Package,
  Plus,
  Star,
  Trash2,
  Truck,
  Upload,
  Wallet,
  XCircle,
} from "lucide-react";
import { Empty, ModuleHeader, OperationsMenu, Panel } from "../../components/AppComponents";
import { deliveryModuleDetails } from "../../domain/operations";
import {
  isValidBrazilianPlate,
  normalizePlate,
  requiresPlate,
  suggestedCapacityForVehicle,
  vehicleTypeOptions,
  type DeliveryVehicle,
  type DeliveryVehicleType,
} from "../../domain/vehicles";
import type { DemoSession } from "../../types";
import { usePersistentState } from "../../usePersistentState";
import { money } from "../../utils";
import { eventNow, patchUnifiedOrder, readUnifiedOrders } from "../../domain/orderBridge";

export function DeliveryOperations({
  session,
  onBack,
  onMap,
}: {
  session: DemoSession;
  onBack: () => void;
  onMap: (destination?: string) => void;
}) {
  const modules = [
    "Painel",
    "Entregas",
    "Em andamento",
    "Financeiro",
    "Veículos",
    "Forma de entrega",
    "Desempenho",
    "Notificações",
    "Ajuda",
    "Guia inicial",
    "Alertas graves",
    "Conta",
    "Documentos",
    "Vantagens",
    "Avaliações",
  ];
  const [online, setOnline] = usePersistentState<boolean>(`feirae:delivery-online:${session.email}`, true);
  const [deliveryPreferences, setDeliveryPreferences] = usePersistentState(
    `feirae:delivery-preferences:${session.email}`,
    {
      radiusKm: 12,
      preferredDistanceKm: 8,
      regions: ["Planaltina"],
      autoSchedule: false,
      scheduleStart: "08:00",
      scheduleEnd: "18:00",
    },
  );
  const [accepted, setAccepted] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelDetails, setCancelDetails] = useState("");
  const [deliveryCancellationLog, setDeliveryCancellationLog] = usePersistentState<
    { id: string; deliveryId: string; reason: string; details: string; createdAt: string }[]
  >(`feirae:delivery-cancellations:${session.email}`, []);
  const [active, setActive] = useState("Central");
  const [helpTopic, setHelpTopic] = useState("Falar com suporte");
  const [helpProtocol, setHelpProtocol] = useState("");
  const [accountSaved, setAccountSaved] = useState(false);
  const [vehicleFormOpen, setVehicleFormOpen] = useState(false);
  const [vehicleEditingId, setVehicleEditingId] = useState<string | null>(null);
  const [vehicleError, setVehicleError] = useState("");
  const [vehicleDocumentName, setVehicleDocumentName] = useState("");
  const [vehicleType, setVehicleType] = useState<DeliveryVehicleType>("Moto");
  const [vehicleCapacity, setVehicleCapacity] = useState<number>(suggestedCapacityForVehicle("Moto"));
  const [vehicleBrandModel, setVehicleBrandModel] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [deliveryAccount, setDeliveryAccount] = usePersistentState(
    `feirae:delivery-account:${session.email}`,
    {
      name: session.name,
      cpf: "",
      birthDate: "",
      email: session.email,
      phone: "",
      pixKey: "",
      receivingMethod: "Pix",
      bankName: "",
      agency: "",
      accountNumber: "",
      cnh: "",
      cnhCategory: "",
      cep: "",
      city: "Planaltina",
      state: "DF",
    },
  );
  const [vehicles, setVehicles] = usePersistentState<DeliveryVehicle[]>(
    `feirae:delivery-vehicles:${session.email}`,
    [
      {
        id: "demo-moto",
        type: "Moto",
        capacityKg: suggestedCapacityForVehicle("Moto"),
        brandModel: "",
        plate: "",
        active: true,
        documentFileName: "crlv-demo.pdf",
        documentStatus: "approved",
      },
    ],
  );

  const [deliveryLedger, setDeliveryLedger] = usePersistentState<
    {
      id: string;
      deliveryId: string;
      label: string;
      amount: number;
      status: "pending" | "available" | "withdrawal_requested" | "paid";
    }[]
  >(`feirae:delivery-ledger:${session.email}`, [
    {
      id: "ledger-1022",
      deliveryId: "FE-1022",
      label: "Feira Central",
      amount: 18.9,
      status: "paid",
    },
    {
      id: "ledger-1023",
      deliveryId: "FE-1023",
      label: "Torre",
      amount: 24.2,
      status: "available",
    },
  ]);
  const [deliveryDocuments, setDeliveryDocuments] = usePersistentState<
    {
      id: string;
      name: string;
      description: string;
      status: "pending" | "under_review" | "approved" | "correction_required";
      fileName: string;
      expiresAt: string;
    }[]
  >(`feirae:delivery-documents:${session.email}`, [
    {
      id: "identity",
      name: "Documento oficial com foto",
      description: "RG, CNH ou documento oficial válido.",
      status: "approved",
      fileName: "identidade.pdf",
      expiresAt: "",
    },
    {
      id: "address",
      name: "Comprovante de residência",
      description: "Comprovante ou declaração de residência.",
      status: "approved",
      fileName: "residencia.pdf",
      expiresAt: "",
    },
    {
      id: "cnh",
      name: "CNH compatível e válida",
      description: "Obrigatória para veículos motorizados que exigem habilitação.",
      status: "approved",
      fileName: "cnh.pdf",
      expiresAt: "",
    },
    {
      id: "crlv",
      name: "CRLV-e do veículo",
      description: "Obrigatório para veículo motorizado cadastrado.",
      status: "approved",
      fileName: "crlv.pdf",
      expiresAt: "",
    },
    {
      id: "motofrete",
      name: "Curso/autorização de motofrete",
      description: "Obrigatório quando a operação usar moto/motoneta para entrega remunerada.",
      status: "approved",
      fileName: "motofrete.pdf",
      expiresAt: "",
    },
  ]);

  function resetVehicleForm() {
    setVehicleEditingId(null);
    setVehicleType("Moto");
    setVehicleCapacity(suggestedCapacityForVehicle("Moto"));
    setVehicleBrandModel("");
    setVehiclePlate("");
    setVehicleDocumentName("");
    setVehicleError("");
  }

  function editVehicle(vehicle: DeliveryVehicle) {
    setVehicleEditingId(vehicle.id);
    setVehicleType(vehicle.type);
    setVehicleCapacity(vehicle.capacityKg);
    setVehicleBrandModel(vehicle.brandModel);
    setVehiclePlate(vehicle.plate);
    setVehicleDocumentName(vehicle.documentFileName ?? "");
    setVehicleError("");
    setVehicleFormOpen(true);
  }

  function saveVehicle() {
    const plate = normalizePlate(vehiclePlate);
    if (vehicleCapacity <= 0) {
      setVehicleError("Informe uma capacidade maior que zero.");
      return;
    }
    if (requiresPlate(vehicleType) && !isValidBrazilianPlate(plate)) {
      setVehicleError("Informe uma placa brasileira válida no padrão ABC1234 ou Mercosul ABC1D23.");
      return;
    }
    if (requiresPlate(vehicleType) && !vehicleDocumentName) {
      setVehicleError("Envie o documento do veículo antes de salvar.");
      return;
    }

    const nextVehicle: DeliveryVehicle = {
      id: vehicleEditingId ?? String(Date.now()),
      type: vehicleType,
      capacityKg: Math.max(1, vehicleCapacity),
      brandModel: vehicleBrandModel.trim(),
      plate: requiresPlate(vehicleType) ? plate : "",
      active: vehicleEditingId
        ? vehicles.find((vehicle) => vehicle.id === vehicleEditingId)?.active ?? true
        : true,
      documentFileName: requiresPlate(vehicleType) ? vehicleDocumentName : "",
      documentStatus: requiresPlate(vehicleType)
        ? vehicleEditingId
          ? vehicles.find((vehicle) => vehicle.id === vehicleEditingId)?.documentFileName === vehicleDocumentName
            ? vehicles.find((vehicle) => vehicle.id === vehicleEditingId)?.documentStatus ?? "under_review"
            : "under_review"
          : "under_review"
        : "approved",
    };

    setVehicles((current) =>
      vehicleEditingId
        ? current.map((vehicle) => (vehicle.id === vehicleEditingId ? nextVehicle : vehicle))
        : [...current, nextVehicle],
    );
    resetVehicleForm();
    setVehicleFormOpen(false);
  }
  const deliveryFixtures = [
    {
      id: "FE-1024",
      fair: "Feira do Produtor Rural",
      bank: "Sítio da Vó",
      region: "Planaltina",
      customerAddress: "Planaltina, DF",
      route: "Feira do Produtor Rural → Planaltina",
      toBankKm: 1.4,
      bankToCustomerKm: 4.2,
      totalDistanceKm: 5.6,
      etaMinutes: 24,
      fee: "R$ 12,80",
      feeAmount: 12.8,
      weight: 8.4,
      items: ["1× cesta de frutas", "2× tomate orgânico", "2× cheiro-verde"],
    },
    {
      id: "FE-1025",
      fair: "Feira Central",
      bank: "Banca do Cerrado",
      region: "Asa Norte",
      customerAddress: "Asa Norte, Brasília - DF",
      route: "Feira Central → Asa Norte",
      toBankKm: 2.1,
      bankToCustomerKm: 6.8,
      totalDistanceKm: 8.9,
      etaMinutes: 36,
      fee: "R$ 17,40",
      feeAmount: 17.4,
      weight: 16.8,
      items: ["2× caixas de hortifruti", "1× queijo artesanal"],
    },
    {
      id: "FE-1026",
      fair: "Feira da Torre de TV",
      bank: "Mãos do DF",
      region: "Sudoeste",
      customerAddress: "Sudoeste, Brasília - DF",
      route: "Feira da Torre de TV → Sudoeste",
      toBankKm: 3.4,
      bankToCustomerKm: 5.1,
      totalDistanceKm: 8.5,
      etaMinutes: 33,
      fee: "R$ 24,20",
      feeAmount: 24.2,
      weight: 31.5,
      items: ["4× bolsas artesanais", "2× caixas"],
    },
    {
      id: "FE-1027",
      fair: "Feira do Produtor Rural",
      bank: "Atacado da Feira",
      region: "Planaltina",
      customerAddress: "Planaltina, DF",
      route: "Feira do Produtor Rural → Planaltina",
      toBankKm: 5.2,
      bankToCustomerKm: 10.8,
      totalDistanceKm: 16,
      etaMinutes: 48,
      fee: "R$ 31,50",
      feeAmount: 31.5,
      weight: 105,
      items: ["10× caixas de frutas", "5× sacos de hortaliças"],
    },
  ];
  const sharedOrders = readUnifiedOrders();
  const sharedRoutePendingCount = sharedOrders.filter(
    (order) =>
      order.fulfillment === "delivery" &&
      ["ready_for_pickup", "driver_assigned"].includes(order.status) &&
      !order.route,
  ).length;
  const sharedDeliveries = sharedOrders
    .filter(
      (order) =>
        order.fulfillment === "delivery" &&
        ["ready_for_pickup", "driver_assigned", "collected", "out_for_delivery"].includes(order.status) &&
        Boolean(order.route),
    )
    .map((order) => {
      const route = order.route!;
      const vendorNames = Array.from(new Set(order.items.map((item) => item.vendor)));
      const weight = order.items.reduce((sum, item) => sum + item.weightKg, 0);
      return {
        id: order.id,
        fair: order.fairName,
        bank: vendorNames.join(" + "),
        region: order.customerCity ?? "Destino",
        customerAddress: order.customerAddress ?? order.customerCity ?? "Destino do cliente",
        route: `${order.fairName} → ${order.customerCity ?? "cliente"}`,
        toBankKm: route.toVendorKm,
        bankToCustomerKm: route.vendorToCustomerKm,
        totalDistanceKm: route.totalKm,
        etaMinutes: route.etaMinutes,
        fee: money(order.calculatedDeliveryFee),
        feeAmount: order.calculatedDeliveryFee,
        weight,
        items: order.items.map((item) => `${item.quantity}× ${item.name}`),
      };
    });
  const sharedIds = new Set(sharedDeliveries.map((delivery) => delivery.id));
  const deliveries = [
    ...sharedDeliveries,
    ...deliveryFixtures.filter((delivery) => !sharedIds.has(delivery.id)),
  ];
  const activeVehicles = vehicles.filter((vehicle) => vehicle.active);
  const hasMotorizedVehicle = activeVehicles.some((vehicle) => requiresPlate(vehicle.type));
  const hasMoto = activeVehicles.some(
    (vehicle) => vehicle.type === "Moto" || vehicle.type === "Moto com baú",
  );
  const requiredDocumentIds = [
    "identity",
    "address",
    ...(hasMotorizedVehicle ? ["cnh", "crlv"] : []),
    ...(hasMoto ? ["motofrete"] : []),
  ];
  const approvalStatus = requiredDocumentIds.every(
    (id) => deliveryDocuments.find((document) => document.id === id)?.status === "approved",
  )
    ? "Aprovado"
    : deliveryDocuments.some(
          (document) =>
            requiredDocumentIds.includes(document.id) && document.status === "correction_required",
        )
      ? "Correção necessária"
      : deliveryDocuments.some(
            (document) => requiredDocumentIds.includes(document.id) && document.status === "under_review",
          )
        ? "Em análise"
        : "Documentação pendente";
  const pendingAmount =
    deliveryLedger
      .filter((entry) => entry.status === "pending")
      .reduce((sum, entry) => sum + entry.amount, 0) +
    (accepted ? (deliveries.find((delivery) => delivery.id === accepted)?.feeAmount ?? 0) : 0);
  const availableAmount = deliveryLedger
    .filter((entry) => entry.status === "available")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const requestedAmount = deliveryLedger
    .filter((entry) => entry.status === "withdrawal_requested")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const paidAmount = deliveryLedger
    .filter((entry) => entry.status === "paid")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const receivingConfigured =
    deliveryAccount.receivingMethod === "Pix"
      ? Boolean(deliveryAccount.pixKey)
      : Boolean(deliveryAccount.bankName && deliveryAccount.agency && deliveryAccount.accountNumber);
  const scheduleAllowsNow = (() => {
    if (!deliveryPreferences.autoSchedule) return true;
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMinute] = deliveryPreferences.scheduleStart.split(":").map(Number);
    const [endHour, endMinute] = deliveryPreferences.scheduleEnd.split(":").map(Number);
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    return end >= start ? current >= start && current <= end : current >= start || current <= end;
  })();
  const availableNow = online && scheduleAllowsNow && approvalStatus === "Aprovado";
  const vehicleReady = (vehicle: DeliveryVehicle) =>
    !requiresPlate(vehicle.type) || vehicle.documentStatus === "approved";
  const compatibleVehicleForWeight = (weight: number) =>
    [...activeVehicles]
      .filter((vehicle) => vehicle.capacityKg >= weight && vehicleReady(vehicle))
      .sort((a, b) => a.capacityKg - b.capacityKg)[0] ?? null;
  const visibleDeliveries = deliveries
    .filter((delivery) => delivery.totalDistanceKm <= deliveryPreferences.radiusKm)
    .filter(
      (delivery) =>
        deliveryPreferences.regions.length === 0 || deliveryPreferences.regions.includes(delivery.region),
    )
    .sort((a, b) => {
      const aPreferred = a.totalDistanceKm <= deliveryPreferences.preferredDistanceKm ? 0 : 1;
      const bPreferred = b.totalDistanceKm <= deliveryPreferences.preferredDistanceKm ? 0 : 1;
      return aPreferred - bPreferred || a.totalDistanceKm - b.totalDistanceKm;
    });
  const compatibleDeliveryCount = visibleDeliveries.filter((delivery) =>
    compatibleVehicleForWeight(delivery.weight),
  ).length;
  const deliveryStages = ["Ir para a banca", "Confirmar coleta", "Iniciar entrega", "Confirmar entrega"];
  const activeDelivery = deliveries.find((delivery) => delivery.id === accepted);
  const activeDeliveryVehicle = activeDelivery
    ? compatibleVehicleForWeight(activeDelivery.weight)
    : null;
  const activeDeliverySection = activeDelivery ? (
    <section className="active-delivery">
      <span className="eyebrow">Entrega em andamento</span>
      <h3>{activeDelivery.id}</h3>
      <p>{activeDelivery.route}</p>
      <div className="finance-breakdown">
        <p><span>Feira</span><strong>{activeDelivery.fair}</strong></p>
        <p><span>Banca</span><strong>{activeDelivery.bank}</strong></p>
        <p><span>Peso</span><strong>{activeDelivery.weight.toLocaleString("pt-BR")} kg</strong></p>
        <p>
          <span>Veículo compatível em uso</span>
          <strong>{activeDeliveryVehicle ? `${activeDeliveryVehicle.type} · ${activeDeliveryVehicle.capacityKg} kg` : "Nenhum"}</strong>
        </p>
        <p><span>Distância total</span><strong>{activeDelivery.totalDistanceKm.toLocaleString("pt-BR")} km</strong></p>
        <p><span>Previsão</span><strong>{activeDelivery.etaMinutes} min</strong></p>
        <p><span>Ganho</span><strong>{activeDelivery.fee}</strong></p>
      </div>
      <div className="operation-list detailed">
        {activeDelivery.items.map((item) => (
          <article key={item}>
            <Package />
            <div>
              <b>{item}</b>
              <small>Item da corrida</small>
            </div>
          </article>
        ))}
      </div>
      <div className="delivery-progress" aria-label={`Etapa ${stage + 1} de 4`}>
        {deliveryStages.map((label, index) => (
          <span className={index <= stage ? "done" : ""} key={label}>
            {index + 1}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() =>
            onMap(
              stage <= 1
                ? `${activeDelivery.bank}, ${activeDelivery.fair}, DF`
                : activeDelivery.customerAddress,
            )
          }
          className="secondary-action"
        >
          <MapPin size={17} /> {stage <= 1 ? "Rota até a banca" : "Rota até o cliente"}
        </button>
        <button
          className="primary-action"
          onClick={() => {
            if (stage === 1) {
              patchUnifiedOrder(
                activeDelivery.id,
                { status: "collected" },
                eventNow("collected", "Pedido coletado", "delivery"),
              );
            } else if (stage === 2) {
              patchUnifiedOrder(
                activeDelivery.id,
                { status: "out_for_delivery" },
                eventNow("out-for-delivery", "A caminho do cliente", "delivery"),
              );
            } else if (stage === deliveryStages.length - 1) {
              patchUnifiedOrder(
                activeDelivery.id,
                { status: "delivered" },
                eventNow("delivered", "Entregue", "delivery"),
              );
              setDeliveryLedger((current) => [
                {
                  id: `ledger-${activeDelivery.id}-${Date.now()}`,
                  deliveryId: activeDelivery.id,
                  label: activeDelivery.route,
                  amount: activeDelivery.feeAmount,
                  status: "available",
                },
                ...current,
              ]);
              setAccepted(null);
              setStage(0);
              setCancelReason("");
              setCancelDetails("");
            } else setStage((value) => value + 1);
          }}
        >
          {deliveryStages[stage]} <ChevronRight size={17} />
        </button>
      </div>
      <div className="cancel-panel">
        <b>Cancelar entrega</b>
        <select
          value={cancelReason}
          onChange={(event) => {
            setCancelReason(event.target.value);
            setCancelDetails("");
          }}
        >
          <option value="">Motivo do cancelamento</option>
          <option>Veículo com problema</option>
          <option>Peso/volume incompatível</option>
          <option>Banca atrasou a retirada</option>
          <option>Endereço inseguro ou incorreto</option>
          <option>Cliente não responde</option>
          <option>Outro</option>
        </select>
        {cancelReason === "Outro" && (
          <label>
            Descreva o motivo
            <textarea
              rows={3}
              value={cancelDetails}
              onChange={(event) => setCancelDetails(event.target.value)}
              placeholder="Explique por que não pode concluir a corrida."
            />
          </label>
        )}
        <button
          className="secondary-action"
          disabled={!cancelReason || (cancelReason === "Outro" && !cancelDetails.trim())}
          onClick={() => {
            const createdAt = new Intl.DateTimeFormat("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            }).format(new Date());
            setDeliveryCancellationLog((current) => [
              {
                id: String(Date.now()),
                deliveryId: activeDelivery.id,
                reason: cancelReason,
                details: cancelDetails.trim(),
                createdAt,
              },
              ...current,
            ]);
            patchUnifiedOrder(
              activeDelivery.id,
              { status: "ready_for_pickup", driver: undefined },
              eventNow("driver-cancelled", "Corrida devolvida à fila", "delivery", {
                reason: cancelReason,
                details: cancelDetails.trim(),
              }),
            );
            setAccepted(null);
            setStage(0);
            setCancelReason("");
            setCancelDetails("");
          }}
        >
          <XCircle size={17} /> Cancelar corrida
        </button>
      </div>
    </section>
  ) : (
    <Empty title="Nenhuma entrega ativa" text="Aceite uma entrega disponível para acompanhar as etapas." />
  );

  const deliveryList = (
    <div className="mt-6 space-y-3">
      <span className="eyebrow">Entregas disponíveis</span>
      {sharedRoutePendingCount > 0 && (
        <div className="region-strip">
          <MapPin size={18} />
          <div>
            <b>{sharedRoutePendingCount} pedido(s) aguardando cálculo de rota</b>
            <p>Uma corrida só entra na oferta quando distância e previsão estiverem disponíveis.</p>
          </div>
        </div>
      )}
      {!availableNow && (
        <div className="region-strip">
          <Info size={18} />
          <div>
            <b>Você não está disponível para novas corridas</b>
            <p>
              {approvalStatus !== "Aprovado"
                ? `Cadastro: ${approvalStatus}.`
                : online && !scheduleAllowsNow
                  ? "Sua agenda automática está fora do horário configurado."
                  : "Ative sua disponibilidade para receber corridas."}
            </p>
          </div>
        </div>
      )}
      {visibleDeliveries.filter((delivery) => delivery.id !== accepted).length === 0 ? (
        <Empty
          title="Nenhuma corrida dentro dos seus filtros"
          text="Aumente o raio, altere as regiões ou aguarde uma nova corrida."
        />
      ) : (
        visibleDeliveries
          .filter((delivery) => delivery.id !== accepted)
          .map((delivery) => {
            const compatibleVehicle = compatibleVehicleForWeight(delivery.weight);
            return (
              <article className="delivery-row" key={delivery.id}>
                <span><Bike /></span>
                <div>
                  <b>{delivery.id} · {delivery.fair} · {delivery.bank}</b>
                  <small>
                    Destino: {delivery.region} · {delivery.weight.toLocaleString("pt-BR")} kg · {delivery.items.length} item(ns)
                  </small>
                  <small>
                    Até a banca {delivery.toBankKm.toLocaleString("pt-BR")} km · banca → cliente{" "}
                    {delivery.bankToCustomerKm.toLocaleString("pt-BR")} km · total{" "}
                    {delivery.totalDistanceKm.toLocaleString("pt-BR")} km · {delivery.etaMinutes} min
                  </small>
                  <small>{delivery.items.join(" · ")}</small>
                  <small>
                    {compatibleVehicle
                      ? `Veículo compatível: ${compatibleVehicle.type} (${compatibleVehicle.capacityKg} kg)`
                      : "Nenhum veículo ativo/documentado suporta o peso"}
                    {" · "}ganho {delivery.fee}
                  </small>
                </div>
                <button
                  disabled={!availableNow || accepted !== null || !compatibleVehicle}
                  onClick={() => {
                    if (!compatibleVehicle || !availableNow) return;
                    setAccepted(delivery.id);
                    setStage(0);
                    patchUnifiedOrder(
                      delivery.id,
                      {
                        status: "driver_assigned",
                        driver: {
                          name: deliveryAccount.name || session.name,
                          vehicle: compatibleVehicle.type,
                          plateMasked: compatibleVehicle.plate
                            ? `***${compatibleVehicle.plate.slice(-4)}`
                            : undefined,
                          etaMinutes: delivery.etaMinutes,
                          distanceKm: delivery.totalDistanceKm,
                        },
                      },
                      eventNow("driver-assigned", "Entregador a caminho da banca", "delivery"),
                    );
                    setActive("Em andamento");
                  }}
                >
                  {compatibleVehicle ? "Aceitar" : "Veículo incompatível"}
                </button>
              </article>
            );
          })
      )}
    </div>
  );
  return (
    <Panel title="Central do entregador" subtitle="Gerencie disponibilidade, veículos, filtros, corridas e ganhos." onBack={onBack}>
      {active === "Central" ? (
        <div className="ops-home">
          <div className="ops-summary">
            <div>
              <span className="eyebrow">Central</span>
              <h2>Escolha sua próxima ação</h2>
              <p>Entregas, rota ativa, veículo, ganhos, alertas e avaliações ficam em telas próprias.</p>
            </div>
            <div className="operation-metrics">
              <article>
                <strong>
                  {approvalStatus === "Aprovado" ? (availableNow ? "Disponível" : "Indisponível") : approvalStatus}
                </strong>
                <span>disponibilidade atual</span>
              </article>
              <article>
                <strong>{compatibleDeliveryCount}</strong>
                <span>corridas compatíveis</span>
              </article>
              <article>
                <strong>
                  {money(
                    visibleDeliveries
                      .filter((delivery) => compatibleVehicleForWeight(delivery.weight))
                      .reduce((sum, delivery) => sum + delivery.feeAmount, 0),
                  )}
                </strong>
                <span>ganhos das corridas compatíveis</span>
              </article>
            </div>
          </div>
          <OperationsMenu modules={modules} details={deliveryModuleDetails} onOpen={setActive} />
        </div>
      ) : (
        <div className="module-screen">
          <button className="back-button" onClick={() => setActive("Central")}>
            <ArrowLeft size={17} /> Voltar para central
          </button>
          <div className="surface-card operation-card">
            <span className="eyebrow">{active}</span>
            {active === "Painel" ? (
              <>
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
                    <h2>{availableNow ? "Você está disponível" : "Você está indisponível"}</h2>
                  </div>
                  <button
                    onClick={() => {
                      if (approvalStatus !== "Aprovado") return;
                      setOnline((value) => !value);
                    }}
                    disabled={approvalStatus !== "Aprovado"}
                    className={availableNow ? "status-button active" : "status-button"}
                  >
                    {approvalStatus === "Aprovado" ? (online ? "Desligar" : "Ficar disponível") : approvalStatus}
                  </button>
                </div>
                <div className="operation-metrics">
                  <article>
                    <strong>{compatibleDeliveryCount}</strong>
                    <span>corridas compatíveis</span>
                  </article>
                  <article>
                    <strong>
                      {money(
                        deliveries
                          .filter((delivery) => compatibleVehicleForWeight(delivery.weight))
                          .reduce((sum, delivery) => sum + delivery.feeAmount, 0),
                      )}
                    </strong>
                    <span>ganhos disponíveis para aceitar</span>
                  </article>
                  <article>
                    <strong>4,9 ★</strong>
                    <span>média após entregas</span>
                  </article>
                </div>
                {activeDelivery && activeDeliverySection}
                {deliveryList}
              </>
            ) : active === "Entregas" ? (
              <>
                <ModuleHeader
                  badge="Corridas liberadas"
                  title="Entregas compatíveis"
                  description="Cada corrida mostra peso, itens, distâncias, previsão, ganho e um veículo compatível antes do aceite."
                />
                {deliveryList}
              </>
            ) : active === "Em andamento" ? (
              activeDeliverySection
            ) : active === "Financeiro" ? (
              <>
                <ModuleHeader
                  badge="Repasses"
                  title="Financeiro do entregador"
                  description="Acompanhe valores pendentes, disponíveis, saques solicitados e pagos por corrida."
                />
                <div className="operation-metrics">
                  <article>
                    <strong>{money(pendingAmount)}</strong>
                    <span>pendente até concluir entrega</span>
                  </article>
                  <article>
                    <strong>{money(availableAmount)}</strong>
                    <span>disponível para saque/repasse</span>
                  </article>
                  <article>
                    <strong>{money(paidAmount)}</strong>
                    <span>já liquidado</span>
                  </article>
                </div>
                <div className="finance-breakdown">
                  <p>
                    <span>Destino de recebimento</span>
                    <strong>{receivingConfigured ? "Cadastrado" : "Pendente"}</strong>
                  </p>
                  <p>
                    <span>Solicitado ao provedor</span>
                    <strong>{money(requestedAmount)}</strong>
                  </p>
                  <p>
                    <span>Taxa administrativa Feiraê</span>
                    <strong>A definir</strong>
                  </p>
                  <p>
                    <span>Prazo do próximo repasse</span>
                    <strong>Depende do provedor</strong>
                  </p>
                </div>
                <div className="operation-list detailed">
                  {deliveryLedger.map((entry) => (
                    <article key={entry.id}>
                      <Wallet />
                      <div>
                        <b>
                          {entry.deliveryId} · {money(entry.amount)}
                        </b>
                        <small>
                          {entry.label} ·{" "}
                          {entry.status === "pending"
                            ? "Pendente"
                            : entry.status === "available"
                              ? "Disponível"
                              : entry.status === "withdrawal_requested"
                                ? "Saque/repasse solicitado"
                                : "Pago"}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
                {!receivingConfigured ? (
                  <button className="primary-action" onClick={() => setActive("Conta")}>
                    Cadastrar destino de recebimento
                  </button>
                ) : availableAmount > 0 ? (
                  <button
                    className="primary-action"
                    onClick={() =>
                      setDeliveryLedger((current) =>
                        current.map((entry) =>
                          entry.status === "available"
                            ? { ...entry, status: "withdrawal_requested" as const }
                            : entry,
                        ),
                      )
                    }
                  >
                    Solicitar saque/repasse
                  </button>
                ) : null}
                <p className="operation-footnote">
                  A solicitação é apenas simulada localmente. O envio real do dinheiro dependerá do provedor
                  de pagamentos e do split do marketplace.
                </p>
              </>
            ) : active === "Veículos" ? (
              <>
                <ModuleHeader
                  badge="Capacidade e documentação"
                  title="Meus veículos"
                  description="Cadastre, edite, ative ou pause veículos. O peso da corrida apenas elimina veículos que não suportam a carga."
                />
                <button
                  className="primary-action"
                  onClick={() => {
                    if (!vehicleFormOpen) resetVehicleForm();
                    setVehicleFormOpen((value) => !value);
                  }}
                >
                  <Plus size={17} /> Cadastrar veículo
                </button>

                {vehicleFormOpen && (
                  <div className="form-card">
                    <h3>{vehicleEditingId ? "Editar veículo" : "Novo veículo"}</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label>
                        Tipo de veículo
                        <select
                          value={vehicleType}
                          onChange={(event) => {
                            const nextType = event.target.value as DeliveryVehicleType;
                            setVehicleType(nextType);
                            if (!vehicleEditingId) setVehicleCapacity(suggestedCapacityForVehicle(nextType));
                            if (!requiresPlate(nextType)) {
                              setVehiclePlate("");
                              setVehicleDocumentName("");
                            }
                            setVehicleError("");
                          }}
                        >
                          {vehicleTypeOptions.map((type) => (
                            <option value={type} key={type}>
                              {type} · referência {suggestedCapacityForVehicle(type)} kg
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Capacidade máxima deste veículo
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={vehicleCapacity}
                          onChange={(event) => setVehicleCapacity(Number(event.target.value))}
                        />
                        <small>Ex.: um pedido de 10 kg pode ir em qualquer veículo ativo que suporte 10 kg ou mais.</small>
                      </label>
                      <label>
                        Marca/modelo
                        <input
                          value={vehicleBrandModel}
                          onChange={(event) => setVehicleBrandModel(event.target.value)}
                          placeholder="Opcional · Ex.: Honda CG 160"
                        />
                      </label>
                      {requiresPlate(vehicleType) && (
                        <>
                          <label>
                            Placa
                            <input
                              value={vehiclePlate}
                              onChange={(event) => {
                                setVehiclePlate(normalizePlate(event.target.value));
                                setVehicleError("");
                              }}
                              placeholder="ABC1234 ou ABC1D23"
                              maxLength={7}
                              autoCapitalize="characters"
                            />
                            <small>Padrão brasileiro antigo ou Mercosul.</small>
                          </label>
                          <label>
                            Documento do veículo
                            <span className="mini-toggle">
                              <Upload size={15} /> {vehicleDocumentName || "Selecionar CRLV/documento"}
                              <input
                                type="file"
                                accept=".pdf,image/*"
                                hidden
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (!file) return;
                                  setVehicleDocumentName(file.name);
                                  setVehicleError("");
                                }}
                              />
                            </span>
                            <small>O documento entra em análise quando for novo ou substituído.</small>
                          </label>
                        </>
                      )}
                    </div>
                    {vehicleError && <p className="operation-footnote">{vehicleError}</p>}
                    <div className="module-action-row">
                      <button type="button" className="primary-action" onClick={saveVehicle}>
                        {vehicleEditingId ? "Salvar alterações" : "Salvar veículo"}
                      </button>
                      <button
                        type="button"
                        className="secondary-action"
                        onClick={() => {
                          resetVehicleForm();
                          setVehicleFormOpen(false);
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                <div className="operation-list detailed">
                  {vehicles.map((vehicle) => (
                    <article key={vehicle.id}>
                      {vehicle.type.includes("Bicicleta") ? <Bike /> : <Truck />}
                      <div>
                        <b>{vehicle.type}</b>
                        <small>
                          Capacidade {vehicle.capacityKg} kg
                          {vehicle.brandModel ? ` · ${vehicle.brandModel}` : ""}
                          {vehicle.plate ? ` · ${vehicle.plate}` : ""}
                        </small>
                        {requiresPlate(vehicle.type) && (
                          <small>
                            Documento: {vehicle.documentFileName || "não enviado"} ·{" "}
                            {vehicle.documentStatus === "approved"
                              ? "aprovado"
                              : vehicle.documentStatus === "under_review"
                                ? "em análise"
                                : vehicle.documentStatus === "correction_required"
                                  ? "correção necessária"
                                  : "pendente"}
                          </small>
                        )}
                      </div>
                      <div className="item-actions">
                        <button className="mini-toggle" onClick={() => editVehicle(vehicle)}>
                          Editar
                        </button>
                        <button
                          className={vehicle.active ? "mini-toggle active" : "mini-toggle"}
                          onClick={() =>
                            setVehicles((current) =>
                              current.map((item) =>
                                item.id === vehicle.id ? { ...item, active: !item.active } : item,
                              ),
                            )
                          }
                        >
                          {vehicle.active ? "Ativo" : "Inativo"}
                        </button>
                        <button
                          className="mini-toggle"
                          aria-label={`Excluir ${vehicle.type}`}
                          onClick={() => setVehicles((current) => current.filter((item) => item.id !== vehicle.id))}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                {!vehicles.length && (
                  <Empty title="Nenhum veículo cadastrado" text="Cadastre um veículo e defina a capacidade para receber corridas compatíveis." />
                )}
              </>
            ) : active === "Forma de entrega" ? (
              <>
                <ModuleHeader
                  badge="Preferências"
                  title="Forma de entrega"
                  description="Disponibilidade, raio, regiões, distância preferida, agenda e veículos ativos determinam quais corridas chegam até você."
                />

                <div className="form-card">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <b>Estou disponível agora</b>
                      <p>{availableNow ? "Novas corridas compatíveis podem aparecer." : "Você não receberá novas corridas agora."}</p>
                    </div>
                    <button
                      className={availableNow ? "status-button active" : "status-button"}
                      disabled={approvalStatus !== "Aprovado"}
                      onClick={() => setOnline((value) => !value)}
                    >
                      {online ? "Desligar" : "Ligar"}
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label>
                      Raio máximo de atuação
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        value={deliveryPreferences.radiusKm}
                        onChange={(event) =>
                          setDeliveryPreferences((current) => ({
                            ...current,
                            radiusKm: Math.max(1, Number(event.target.value) || 1),
                          }))
                        }
                      />
                      <small>Até {deliveryPreferences.radiusKm} km de distância total da corrida.</small>
                    </label>
                    <label>
                      Distância preferida
                      <input
                        type="number"
                        min="1"
                        max={deliveryPreferences.radiusKm}
                        step="1"
                        value={deliveryPreferences.preferredDistanceKm}
                        onChange={(event) =>
                          setDeliveryPreferences((current) => ({
                            ...current,
                            preferredDistanceKm: Math.max(1, Number(event.target.value) || 1),
                          }))
                        }
                      />
                      <small>Corridas até essa distância aparecem primeiro; não é um bloqueio.</small>
                    </label>
                  </div>

                  <label>
                    Regiões em que deseja trabalhar
                    <input
                      value={deliveryPreferences.regions.join(", ")}
                      onChange={(event) =>
                        setDeliveryPreferences((current) => ({
                          ...current,
                          regions: event.target.value
                            .split(",")
                            .map((item) => item.trim())
                            .filter(Boolean),
                        }))
                      }
                      placeholder="Planaltina, Sobradinho"
                    />
                    <small>Separe regiões por vírgula. Deixe vazio para não filtrar por região.</small>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={deliveryPreferences.autoSchedule}
                      onChange={(event) =>
                        setDeliveryPreferences((current) => ({
                          ...current,
                          autoSchedule: event.target.checked,
                        }))
                      }
                    />
                    <span>
                      <b>Usar horário automático</b>
                      <small className="block">Fora do horário configurado o app fica indisponível para novas corridas.</small>
                    </span>
                  </label>

                  {deliveryPreferences.autoSchedule && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label>
                        Início
                        <input
                          type="time"
                          value={deliveryPreferences.scheduleStart}
                          onChange={(event) =>
                            setDeliveryPreferences((current) => ({
                              ...current,
                              scheduleStart: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Fim
                        <input
                          type="time"
                          value={deliveryPreferences.scheduleEnd}
                          onChange={(event) =>
                            setDeliveryPreferences((current) => ({
                              ...current,
                              scheduleEnd: event.target.value,
                            }))
                          }
                        />
                        <small>Horários que atravessam a meia-noite também são aceitos.</small>
                      </label>
                    </div>
                  )}
                </div>

                <div className="operation-list detailed">
                  <article>
                    <MapPin />
                    <div>
                      <b>Raio de atuação · {deliveryPreferences.radiusKm} km</b>
                      <small>
                        Regiões: {deliveryPreferences.regions.length ? deliveryPreferences.regions.join(", ") : "todas"} · preferência até{" "}
                        {deliveryPreferences.preferredDistanceKm} km.
                      </small>
                    </div>
                  </article>
                  <article>
                    <Truck />
                    <div>
                      <b>Veículos ativos · {activeVehicles.length}</b>
                      <small>
                        {activeVehicles.length
                          ? activeVehicles.map((vehicle) => `${vehicle.type} ${vehicle.capacityKg} kg`).join(" · ")
                          : "Nenhum veículo ativo. Sem veículo compatível, a corrida não pode ser aceita."}
                      </small>
                    </div>
                    <button className="mini-toggle" onClick={() => setActive("Veículos")}>Gerenciar</button>
                  </article>
                </div>

                <div className="surface-card">
                  <span className="eyebrow">Resultado dos filtros</span>
                  <div className="operation-metrics">
                    <article><strong>{visibleDeliveries.length}</strong><span>dentro do raio/regiões</span></article>
                    <article><strong>{compatibleDeliveryCount}</strong><span>com peso compatível</span></article>
                    <article><strong>{availableNow ? "Ativo" : "Pausado"}</strong><span>recebimento de corridas</span></article>
                  </div>
                </div>
              </>
            ) : active === "Desempenho" ? (
              <>
                <ModuleHeader
                  badge="Qualidade"
                  title="Desempenho"
                  description="Indicadores que afetam prioridade de corridas, suporte e campanhas."
                />
                <div className="operation-metrics">
                  <article>
                    <strong>96%</strong>
                    <span>entregas no prazo</span>
                  </article>
                  <article>
                    <strong>4,9 ★</strong>
                    <span>avaliação média</span>
                  </article>
                  <article>
                    <strong>{deliveryCancellationLog.length}</strong>
                    <span>cancelamentos registrados</span>
                  </article>
                </div>
                <div className="operation-list detailed">
                  {[
                    "Pontualidade ótima",
                    "Cuidado com embalagens aprovado",
                    "Comunicação com cliente dentro do esperado",
                  ].map((item) => (
                    <article key={item}>
                      <Check />
                      <div>
                        <b>{item}</b>
                        <small>Baseado nas últimas entregas registradas.</small>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : active === "Avaliações" ? (
              <>
                <ModuleHeader
                  badge="Após cada etapa"
                  title="Avaliações cruzadas"
                  description="Cliente, entregador e banca se avaliam nos momentos certos, sem poluir a tela inicial."
                />
                <div className="operation-list detailed">
                  {[
                    ["Depois da entrega", "Cliente avalia entregador e entrega."],
                    ["Depois da entrega", "Entregador avalia cliente."],
                    [
                      "Depois da coleta",
                      "Entregador avalia banca quando houver problema de preparo, embalagem ou peso.",
                    ],
                    ["Mensalmente", "Usuário pode avaliar o app uma vez por mês."],
                  ].map(([title, text]) => (
                    <article key={`${title}-${text}`}>
                      <Star />
                      <div>
                        <b>{title}</b>
                        <small>{text}</small>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : active === "Alertas graves" ? (
              <>
                <ModuleHeader
                  badge="Prioridade"
                  title="Alertas graves"
                  description="Ocorrências que precisam travar a corrida, avisar suporte ou proteger entregador e cliente."
                />
                <div className="operation-list detailed">
                  {[
                    "Acidente ou pane",
                    "Endereço inseguro",
                    "Cliente não localizado",
                    "Pedido violado ou danificado",
                  ].map((item) => (
                    <article key={item}>
                      <XCircle />
                      <div>
                        <b>{item}</b>
                        <small>Abre suporte prioritário e registra ocorrência da corrida.</small>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : active === "Notificações" ? (
              <>
                <ModuleHeader
                  badge="Avisos"
                  title="Notificações operacionais"
                  description="Central para corridas novas, alteração de rota, pagamento e mensagens do suporte."
                />
                <div className="operation-list detailed">
                  {[
                    [
                      "Novas corridas compatíveis",
                      `${compatibleDeliveryCount} corrida(s) disponível(is) conforme seus veículos ativos.`,
                    ],
                    [
                      "Financeiro",
                      availableAmount > 0
                        ? `${money(availableAmount)} disponível(is) para solicitar saque/repasse.`
                        : "Nenhum valor disponível para saque neste momento.",
                    ],
                    ["Cadastro", `Status documental: ${approvalStatus}.`],
                  ].map(([title, text]) => (
                    <article key={title}>
                      <Bell />
                      <div>
                        <b>{title}</b>
                        <small>{text}</small>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : active === "Ajuda" ? (
              <>
                <ModuleHeader
                  badge="Suporte"
                  title="Ajuda do entregador"
                  description="Atalhos para resolver problema de rota, pedido, pagamento ou segurança."
                />
                <div className="module-action-row">
                  {["Falar com suporte", "Problema no pedido", "Dúvida de repasse"].map((item) => (
                    <button
                      key={item}
                      className={helpTopic === item ? "status-button active" : "status-button"}
                      onClick={() => {
                        setHelpTopic(item);
                        setHelpProtocol("");
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <form className="form-card compact">
                  <label>
                    Assunto selecionado
                    <input value={helpTopic} readOnly />
                  </label>
                  <label>
                    Detalhe do atendimento
                    <input
                      defaultValue={
                        helpTopic === "Problema no pedido"
                          ? "Pedido com embalagem ou peso divergente"
                          : helpTopic === "Dúvida de repasse"
                            ? "Conferir taxa e data do próximo pagamento"
                            : "Preciso falar com o suporte da rota"
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="primary-action"
                    onClick={() => setHelpProtocol(`SUP-${Math.floor(1000 + Math.random() * 8000)}`)}
                  >
                    Abrir atendimento
                  </button>
                  {helpProtocol && (
                    <p className="inline-success">
                      Protocolo {helpProtocol} aberto para {helpTopic}.
                    </p>
                  )}
                </form>
                <div className="operation-list detailed">
                  {[
                    "Como confirmar coleta",
                    "O que fazer quando cliente não responde",
                    "Quando cancelar sem prejudicar desempenho",
                  ].map((item) => (
                    <article key={item}>
                      <Info />
                      <div>
                        <b>{item}</b>
                        <small>Guia rápido para atendimento em campo.</small>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : active === "Guia inicial" ? (
              <>
                <ModuleHeader
                  badge="Primeiros passos"
                  title="Começar a entregar"
                  description="Fluxo de cadastro, validação, primeira corrida e boas práticas."
                />
                <div className="timeline-list">
                  {[
                    "Criar conta e enviar documentos",
                    "Cadastrar veículo e capacidade",
                    "Ficar online e aceitar corrida compatível",
                    "Coletar, entregar e receber avaliação",
                  ].map((step, index) => (
                    <article key={step}>
                      <span>{index + 1}</span>
                      <div>
                        <b>{step}</b>
                        <small>Etapa operacional para orientar o entregador.</small>
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
                  description="Dados pessoais, contato, destino de recebimento, endereço e habilitação."
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
                        value={deliveryAccount.name}
                        onChange={(event) =>
                          setDeliveryAccount((current) => ({ ...current, name: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      CPF
                      <input
                        value={deliveryAccount.cpf}
                        onChange={(event) =>
                          setDeliveryAccount((current) => ({ ...current, cpf: event.target.value }))
                        }
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                      />
                    </label>
                    <label>
                      Data de nascimento
                      <input
                        type="date"
                        value={deliveryAccount.birthDate}
                        onChange={(event) =>
                          setDeliveryAccount((current) => ({ ...current, birthDate: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Telefone
                      <input
                        value={deliveryAccount.phone}
                        onChange={(event) =>
                          setDeliveryAccount((current) => ({ ...current, phone: event.target.value }))
                        }
                        placeholder="(61) 99999-9999"
                      />
                    </label>
                  </div>
                  <label>
                    E-mail
                    <input
                      type="email"
                      value={deliveryAccount.email}
                      onChange={(event) =>
                        setDeliveryAccount((current) => ({ ...current, email: event.target.value }))
                      }
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label>
                      Forma de recebimento
                      <select
                        value={deliveryAccount.receivingMethod}
                        onChange={(event) =>
                          setDeliveryAccount((current) => ({
                            ...current,
                            receivingMethod: event.target.value,
                          }))
                        }
                      >
                        <option>Pix</option>
                        <option>Conta bancária</option>
                      </select>
                    </label>
                    <label>
                      CEP
                      <input
                        value={deliveryAccount.cep}
                        onChange={(event) =>
                          setDeliveryAccount((current) => ({ ...current, cep: event.target.value }))
                        }
                        placeholder="00000-000"
                      />
                    </label>
                  </div>
                  {deliveryAccount.receivingMethod === "Pix" ? (
                    <label>
                      Chave Pix para repasse
                      <input
                        value={deliveryAccount.pixKey}
                        onChange={(event) =>
                          setDeliveryAccount((current) => ({ ...current, pixKey: event.target.value }))
                        }
                        placeholder="CPF, e-mail, telefone ou chave"
                      />
                    </label>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label>
                        Banco
                        <input
                          value={deliveryAccount.bankName}
                          onChange={(event) =>
                            setDeliveryAccount((current) => ({
                              ...current,
                              bankName: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Agência
                        <input
                          value={deliveryAccount.agency}
                          onChange={(event) =>
                            setDeliveryAccount((current) => ({
                              ...current,
                              agency: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Conta
                        <input
                          value={deliveryAccount.accountNumber}
                          onChange={(event) =>
                            setDeliveryAccount((current) => ({
                              ...current,
                              accountNumber: event.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label>
                      Cidade/região
                      <input
                        value={deliveryAccount.city}
                        onChange={(event) =>
                          setDeliveryAccount((current) => ({ ...current, city: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Estado
                      <input
                        value={deliveryAccount.state}
                        onChange={(event) =>
                          setDeliveryAccount((current) => ({ ...current, state: event.target.value }))
                        }
                        maxLength={2}
                      />
                    </label>
                    <label>
                      CNH
                      <input
                        value={deliveryAccount.cnh}
                        onChange={(event) =>
                          setDeliveryAccount((current) => ({ ...current, cnh: event.target.value }))
                        }
                        placeholder="Para veículos que exigem habilitação"
                      />
                    </label>
                    <label>
                      Categoria da CNH
                      <input
                        value={deliveryAccount.cnhCategory}
                        onChange={(event) =>
                          setDeliveryAccount((current) => ({
                            ...current,
                            cnhCategory: event.target.value,
                          }))
                        }
                        placeholder="Ex.: A, B, AB"
                      />
                    </label>
                  </div>
                  <p className="operation-footnote">
                    Bicicletas não exigem CNH; veículos motorizados e motofrete têm documentação própria.
                  </p>
                  {accountSaved && <p className="inline-success">Dados da conta salvos neste dispositivo.</p>}
                  <button type="submit" className="primary-action">
                    Salvar alterações
                  </button>
                </form>
              </>
            ) : active === "Documentos" ? (
              <>
                <ModuleHeader
                  badge={approvalStatus}
                  title="Documentação e aprovação"
                  description="Criar conta ou enviar documentos não libera corridas. O cadastro precisa ser aprovado."
                />
                <div className="region-strip">
                  <Check size={18} />
                  <div>
                    <b>Status: {approvalStatus}</b>
                    <p>
                      Documentos obrigatórios mudam conforme os veículos ativos. Enquanto a análise não for
                      aprovada, o entregador não pode ficar online nem aceitar corridas reais.
                    </p>
                  </div>
                </div>
                <div className="operation-list detailed">
                  {deliveryDocuments.map((document) => {
                    const requiredNow = requiredDocumentIds.includes(document.id);
                    return (
                      <article key={document.id}>
                        <Upload />
                        <div>
                          <b>
                            {document.name} · {requiredNow ? "obrigatório agora" : "não obrigatório agora"}
                          </b>
                          <small>{document.description}</small>
                          {document.fileName && <small>Arquivo: {document.fileName}</small>}
                        </div>
                        <div className="item-actions">
                          <span className="document-status">
                            {document.status === "approved"
                              ? "Aprovado"
                              : document.status === "under_review"
                                ? "Em análise"
                                : document.status === "correction_required"
                                  ? "Correção necessária"
                                  : "Pendente de envio"}
                          </span>
                          <label className="mini-toggle">
                            {document.fileName ? "Substituir" : "Enviar"}
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              hidden
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (!file) return;
                                setDeliveryDocuments((current) =>
                                  current.map((item) =>
                                    item.id === document.id
                                      ? {
                                          ...item,
                                          fileName: file.name,
                                          status: "under_review",
                                        }
                                      : item,
                                  ),
                                );
                                if (requiredNow) setOnline(false);
                              }}
                            />
                          </label>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            ) : active === "Vantagens" ? (
              <>
                <ModuleHeader
                  badge="Campanhas"
                  title="Vantagens do entregador"
                  description="Benefícios, metas e comunicações especiais para quem mantém boa avaliação."
                />
                <div className="promo-card">
                  <span>🎁</span>
                  <div>
                    <b>Bônus por horário de feira</b>
                    <small>Complete 5 entregas entre 7h e 11h para liberar bônus da campanha.</small>
                  </div>
                  <span className="document-status">Novo</span>
                </div>
              </>
            ) : (
              <div className="operation-list">
                {[
                  `${active} do entregador`,
                  "Checklist de documentação, preferências e histórico da conta.",
                  "Próximo passo: revisar dados, salvar alterações e acompanhar status.",
                ].map((item) => (
                  <article key={item}>
                    <Info />
                    <div>
                      <b>{item}</b>
                      <small>Área operacional do entregador</small>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}
