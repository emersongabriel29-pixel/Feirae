import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  Bike,
  Check,
  ChevronRight,
  Info,
  MapPin,
  Plus,
  Star,
  Trash2,
  Truck,
  Upload,
  Wallet,
  XCircle,
} from "lucide-react";
import { Empty, ModuleHeader, OperationsMenu, Panel } from "../../components/AppComponents";
import { calculateDeliveryQuote, routeProgressSummary } from "../../domain/deliveryPricing";
import { deliveryModuleDetails } from "../../domain/operations";
import {
  requiresPlate,
  suggestedCapacityForVehicle,
  vehicleTypeOptions,
  type DeliveryVehicle,
  type DeliveryVehicleType,
} from "../../domain/vehicles";
import type { DemoSession } from "../../types";
import { usePersistentState } from "../../usePersistentState";
import { money } from "../../utils";

export function DeliveryOperations({
  session,
  onBack,
}: {
  session: DemoSession;
  onBack: () => void;
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
    "Alertas graves",
    "Conta",
    "Documentos",
    "Vantagens",
    "Avaliações",
  ];
  const [online, setOnline] = useState(true);
  const [accepted, setAccepted] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const [cancelReason, setCancelReason] = useState("");
  const [active, setActive] = useState("Central");
  const [helpTopic, setHelpTopic] = useState("Falar com suporte");
  const [helpProtocol, setHelpProtocol] = useState("");
  const [incidentMessage, setIncidentMessage] = useState("");
  const [joinedBonus, setJoinedBonus] = useState(false);
  const [pendingReviewDeliveryId, setPendingReviewDeliveryId] = useState<string | null>(null);
  const [bankRating, setBankRating] = useState("5");
  const [customerRating, setCustomerRating] = useState("5");
  const [reviewNote, setReviewNote] = useState("");
  const [accountSaved, setAccountSaved] = useState(false);
  const [vehicleFormOpen, setVehicleFormOpen] = useState(false);
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
  const [serviceAreas, setServiceAreas] = usePersistentState<string[]>(
    `feirae:delivery-areas:${session.email}`,
    ["Planaltina"],
  );
  const [maxPickupDistanceKm, setMaxPickupDistanceKm] = usePersistentState<number>(
    `feirae:delivery-max-pickup-km:${session.email}`,
    8,
  );
  const [completedDeliveryIds, setCompletedDeliveryIds] = usePersistentState<string[]>(
    `feirae:delivery-completed:${session.email}`,
    ["FE-1022", "FE-1023"],
  );
  const [driverEvaluations, setDriverEvaluations] = usePersistentState<
    {
      id: string;
      deliveryId: string;
      bankRating: number;
      customerRating: number;
      note: string;
      createdAt: string;
    }[]
  >(`feirae:delivery-evaluations:${session.email}`, []);

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
      createdAt?: string;
      distanceKm?: number;
    }[]
  >(`feirae:delivery-ledger:${session.email}`, [
    {
      id: "ledger-1022",
      deliveryId: "FE-1022",
      label: "Feira do Produtor · Planaltina",
      amount: 18.9,
      status: "paid",
      createdAt: "2026-09-25T09:20:00-03:00",
      distanceKm: 7.1,
    },
    {
      id: "ledger-1023",
      deliveryId: "FE-1023",
      label: "Feira do Produtor · Planaltina",
      amount: 24.2,
      status: "available",
      createdAt: "2026-09-24T16:10:00-03:00",
      distanceKm: 10.4,
    },
    {
      id: "ledger-1015",
      deliveryId: "FE-1015",
      label: "Feira do Produtor · Planaltina",
      amount: 16.4,
      status: "paid",
      createdAt: "2026-09-08T11:45:00-03:00",
      distanceKm: 6.3,
    },
    {
      id: "ledger-0988",
      deliveryId: "FE-0988",
      label: "Feira do Produtor · Planaltina",
      amount: 21.8,
      status: "paid",
      createdAt: "2026-08-19T14:30:00-03:00",
      distanceKm: 9.2,
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

  function addVehicle() {
    setVehicles((current) => [
      ...current,
      {
        id: String(Date.now()),
        type: vehicleType,
        capacityKg: Math.max(1, vehicleCapacity),
        brandModel: vehicleBrandModel.trim(),
        plate: vehiclePlate.trim().toUpperCase(),
        active: true,
      },
    ]);
    setVehicleBrandModel("");
    setVehiclePlate("");
    setVehicleFormOpen(false);
  }
  const deliveries = [
    {
      id: "FE-1024",
      route: "Feira do Produtor → Planaltina",
      originArea: "Planaltina",
      destinationArea: "Planaltina",
      bankName: "Sítio da Vó",
      customerName: "Cliente FE-1024",
      pickupQuery: "Feira do Produtor Rural, Planaltina, DF",
      dropoffQuery: "Setor Tradicional, Planaltina, DF",
      pickupDistanceKm: 2.1,
      pickupEtaMinutes: 7,
      deliveryDistanceKm: 4.2,
      deliveryEtaMinutes: 14,
      weight: 8.4,
      vehicle: "Moto" as DeliveryVehicleType,
      pickupCount: 2,
    },
    {
      id: "FE-1025",
      route: "Feira Central → Asa Norte",
      originArea: "Plano Piloto",
      destinationArea: "Asa Norte",
      bankName: "Banca Central",
      customerName: "Cliente FE-1025",
      pickupQuery: "Feira da Torre de TV, Brasília, DF",
      dropoffQuery: "Asa Norte, Brasília, DF",
      pickupDistanceKm: 8.9,
      pickupEtaMinutes: 22,
      deliveryDistanceKm: 6.8,
      deliveryEtaMinutes: 19,
      weight: 16.8,
      vehicle: "Moto com baú" as DeliveryVehicleType,
      pickupCount: 1,
    },
    {
      id: "FE-1026",
      route: "Feira da Torre → Sudoeste",
      originArea: "Plano Piloto",
      destinationArea: "Sudoeste",
      bankName: "Mãos do DF",
      customerName: "Cliente FE-1026",
      pickupQuery: "Feira da Torre de TV, Brasília, DF",
      dropoffQuery: "Sudoeste, Brasília, DF",
      pickupDistanceKm: 9.4,
      pickupEtaMinutes: 25,
      deliveryDistanceKm: 5.1,
      deliveryEtaMinutes: 17,
      weight: 31.5,
      vehicle: "Carro" as DeliveryVehicleType,
      pickupCount: 1,
    },
    {
      id: "FE-1027",
      route: "Feira Modelo → Sobradinho",
      originArea: "Sobradinho",
      destinationArea: "Sobradinho",
      bankName: "Banca Modelo",
      customerName: "Cliente FE-1027",
      pickupQuery: "Feira Modelo de Sobradinho, Sobradinho, DF",
      dropoffQuery: "Sobradinho, DF",
      pickupDistanceKm: 3.2,
      pickupEtaMinutes: 10,
      deliveryDistanceKm: 5.7,
      deliveryEtaMinutes: 18,
      weight: 7.2,
      vehicle: "Moto" as DeliveryVehicleType,
      pickupCount: 1,
    },
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
  const compatibleVehicleForWeight = (weight: number) =>
    [...activeVehicles]
      .filter((vehicle) => vehicle.capacityKg >= weight)
      .sort((a, b) => a.capacityKg - b.capacityKg)[0] ?? null;
  const deliveryIsInArea = (delivery: (typeof deliveries)[number]) =>
    serviceAreas.includes(delivery.originArea) && delivery.pickupDistanceKm <= maxPickupDistanceKm;
  const eligibleDeliveries = deliveries.filter(
    (delivery) => deliveryIsInArea(delivery) && compatibleVehicleForWeight(delivery.weight),
  );
  const compatibleDeliveryCount = eligibleDeliveries.filter((delivery) => delivery.id !== accepted).length;
  const deliveryStages = ["Cheguei à banca", "Confirmar coleta", "Iniciar entrega", "Confirmar entrega"];
  const activeDelivery = deliveries.find((delivery) => delivery.id === accepted);
  const activeVehicle = activeDelivery ? compatibleVehicleForWeight(activeDelivery.weight) : null;
  const activeQuote =
    activeDelivery && activeVehicle
      ? calculateDeliveryQuote({
          vehicleType: activeVehicle.type,
          distanceKm: activeDelivery.pickupDistanceKm + activeDelivery.deliveryDistanceKm,
          weightKg: activeDelivery.weight,
          pickupCount: activeDelivery.pickupCount,
        })
      : null;
  const activeRoute = activeDelivery
    ? routeProgressSummary({
        stage,
        pickupDistanceKm: activeDelivery.pickupDistanceKm,
        pickupEtaMinutes: activeDelivery.pickupEtaMinutes,
        deliveryDistanceKm: activeDelivery.deliveryDistanceKm,
        deliveryEtaMinutes: activeDelivery.deliveryEtaMinutes,
      })
    : null;
  const pendingAmount =
    deliveryLedger
      .filter((entry) => entry.status === "pending")
      .reduce((sum, entry) => sum + entry.amount, 0) +
    (accepted ? (activeQuote?.driverPay ?? 0) : 0);
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

  function openNavigation(provider: "google" | "waze") {
    if (!activeDelivery || !activeRoute) return;
    const destination =
      activeRoute.destination === "pickup" ? activeDelivery.pickupQuery : activeDelivery.dropoffQuery;
    const url =
      provider === "google"
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
        : `https://www.waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const todayKey = "2026-09-25";
  const currentMonthKey = "2026-09";
  const previousMonthKey = "2026-08";
  const currentYearKey = "2026";
  const ledgerForPrefix = (prefix: string) =>
    deliveryLedger.filter((entry) => (entry.createdAt ?? "").startsWith(prefix));
  const sumLedger = (entries: typeof deliveryLedger) =>
    entries.reduce((sum, entry) => sum + entry.amount, 0);
  const todayEntries = ledgerForPrefix(todayKey);
  const monthEntries = ledgerForPrefix(currentMonthKey);
  const previousMonthEntries = ledgerForPrefix(previousMonthKey);
  const yearEntries = ledgerForPrefix(currentYearKey);
  const monthKm = monthEntries.reduce((sum, entry) => sum + (entry.distanceKm ?? 0), 0);
  const monthAverage = monthEntries.length ? sumLedger(monthEntries) / monthEntries.length : 0;
  const monthPerKm = monthKm ? sumLedger(monthEntries) / monthKm : 0;
  const monthComparison =
    sumLedger(previousMonthEntries) > 0
      ? ((sumLedger(monthEntries) - sumLedger(previousMonthEntries)) / sumLedger(previousMonthEntries)) * 100
      : 0;
  const activeDeliverySection = activeDelivery && activeRoute ? (
    <section className="active-delivery">
      <span className="eyebrow">Em andamento · {activeRoute.label}</span>
      <h3>{activeDelivery.id}</h3>
      <p>{activeDelivery.route}</p>
      <small>
        {activeDelivery.weight} kg · {activeDelivery.pickupCount} banca(s) · veículo{" "}
        {activeVehicle?.type ?? activeDelivery.vehicle}
      </small>

      <div className="operation-metrics">
        <article>
          <strong>{activeRoute.distanceKm.toLocaleString("pt-BR")} km</strong>
          <span>distância desta etapa</span>
        </article>
        <article>
          <strong>{activeRoute.etaMinutes} min</strong>
          <span>previsão desta etapa</span>
        </article>
        <article>
          <strong>{money(activeQuote?.driverPay ?? 0)}</strong>
          <span>ganho desta corrida</span>
        </article>
      </div>

      <div className="delivery-progress" aria-label={`Etapa ${stage + 1} de 4`}>
        {deliveryStages.map((label, index) => (
          <span className={index <= stage ? "done" : ""} key={label}>
            {index + 1}
          </span>
        ))}
      </div>

      <div className="surface-card">
        <b>{activeRoute.label}</b>
        <p>
          Destino atual:{" "}
          {activeRoute.destination === "pickup" ? activeDelivery.pickupQuery : activeDelivery.dropoffQuery}
        </p>
        <div className="module-action-row">
          <button onClick={() => openNavigation("google")} className="secondary-action">
            <MapPin size={17} /> Google Maps
          </button>
          <button onClick={() => openNavigation("waze")} className="secondary-action">
            <MapPin size={17} /> Waze
          </button>
        </div>
      </div>

      <button
        className="primary-action"
        onClick={() => {
          if (stage === deliveryStages.length - 1) {
            const quote = activeQuote;
            setDeliveryLedger((current) => [
              {
                id: `ledger-${activeDelivery.id}-${Date.now()}`,
                deliveryId: activeDelivery.id,
                label: activeDelivery.route,
                amount: quote?.driverPay ?? 0,
                status: "available",
                createdAt: new Date().toISOString(),
                distanceKm: activeDelivery.pickupDistanceKm + activeDelivery.deliveryDistanceKm,
              },
              ...current,
            ]);
            setCompletedDeliveryIds((current) =>
              current.includes(activeDelivery.id) ? current : [...current, activeDelivery.id],
            );
            setPendingReviewDeliveryId(activeDelivery.id);
            setAccepted(null);
            setStage(0);
            setActive("Avaliações");
          } else {
            setStage((value) => value + 1);
          }
        }}
      >
        {deliveryStages[stage]} <ChevronRight size={17} />
      </button>

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
          disabled={!cancelReason}
          onClick={() => {
            if (!cancelReason) return;
            setIncidentMessage(`Corrida ${activeDelivery.id} cancelada: ${cancelReason}.`);
            setAccepted(null);
            setStage(0);
            setCancelReason("");
          }}
        >
          <XCircle size={17} /> Confirmar cancelamento
        </button>
      </div>
    </section>
  ) : (
    <Empty title="Nenhuma entrega ativa" text="Aceite uma entrega disponível para acompanhar as etapas." />
  );
  const deliveryList = (
    <div className="mt-6 space-y-3">
      <span className="eyebrow">Entregas disponíveis na sua área</span>
      {deliveries
        .filter((delivery) => delivery.id !== accepted)
        .map((delivery) => {
          const compatibleVehicle = compatibleVehicleForWeight(delivery.weight);
          const inArea = deliveryIsInArea(delivery);
          const quote = compatibleVehicle
            ? calculateDeliveryQuote({
                vehicleType: compatibleVehicle.type,
                distanceKm: delivery.pickupDistanceKm + delivery.deliveryDistanceKm,
                weightKg: delivery.weight,
                pickupCount: delivery.pickupCount,
              })
            : null;
          return (
            <article className="delivery-row" key={delivery.id}>
              <span>
                <Bike />
              </span>
              <div>
                <b>
                  {delivery.id} · {delivery.route}
                </b>
                <small>
                  coleta {delivery.pickupDistanceKm} km/{delivery.pickupEtaMinutes} min · entrega{" "}
                  {delivery.deliveryDistanceKm} km/{delivery.deliveryEtaMinutes} min · {delivery.weight} kg ·{" "}
                  {delivery.pickupCount} banca(s)
                </small>
                <small>
                  {!inArea
                    ? `Fora da área ativa (${delivery.originArea})`
                    : compatibleVehicle
                      ? `compatível com ${compatibleVehicle.type} · ganho estimado ${money(quote?.driverPay ?? 0)}`
                      : "sem veículo ativo compatível"}
                </small>
              </div>
              <button
                disabled={
                  !online ||
                  approvalStatus !== "Aprovado" ||
                  accepted !== null ||
                  !compatibleVehicle ||
                  !inArea
                }
                onClick={() => {
                  if (!compatibleVehicle || !inArea) return;
                  setAccepted(delivery.id);
                  setStage(0);
                  setActive("Em andamento");
                }}
              >
                {!inArea ? "Fora da área" : compatibleVehicle ? "Aceitar" : "Veículo incompatível"}
              </button>
            </article>
          );
        })}
    </div>
  );
  return (
            <article className="delivery-row" key={delivery.id}>
              <span>
                <Bike />
              </span>
              <div>
                <b>
                  {delivery.id} · {delivery.route}
                </b>
                <small>
                  {delivery.distance} · {delivery.weight} kg ·{" "}
                  {compatibleVehicle
                    ? `compatível com ${compatibleVehicle.type} (${compatibleVehicle.capacityKg} kg)`
                    : "sem veículo ativo compatível"}{" "}
                  · ganho {delivery.fee}
                </small>
              </div>
              <button
                disabled={!online || approvalStatus !== "Aprovado" || accepted !== null || !compatibleVehicle}
                onClick={() => {
                  if (!compatibleVehicle) return;
                  setAccepted(delivery.id);
                  setStage(0);
                  setActive("Em andamento");
                }}
              >
                {compatibleVehicle ? "Aceitar" : "Veículo incompatível"}
              </button>
            </article>
          );
        })}
    </div>
  );
  return (
    <Panel title="Central do entregador" subtitle="Entregas locais demonstrativas" onBack={onBack}>
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
                  {approvalStatus === "Aprovado" ? (online ? "Online" : "Offline") : approvalStatus}
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
                    deliveries
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
                    <h2>{online ? "Você está online" : "Você está offline"}</h2>
                  </div>
                  <button
                    onClick={() => {
                      if (approvalStatus !== "Aprovado") return;
                      setOnline((value) => !value);
                    }}
                    disabled={approvalStatus !== "Aprovado"}
                    className={online ? "status-button active" : "status-button"}
                  >
                    {approvalStatus === "Aprovado" ? (online ? "Online" : "Offline") : approvalStatus}
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
                  description="Cada corrida mostra rota, peso, veículo indicado e ganho antes do aceite."
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
                    <span>já pago na demonstração</span>
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
                  badge="Capacidade"
                  title="Meus veículos"
                  description="Cadastre os veículos que realmente usa. A capacidade em kg pode ser ajustada conforme o seu veículo."
                />
                <button className="primary-action" onClick={() => setVehicleFormOpen((value) => !value)}>
                  <Plus size={17} /> Cadastrar veículo
                </button>

                {vehicleFormOpen && (
                  <div className="form-card">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label>
                        Tipo de veículo
                        <select
                          value={vehicleType}
                          onChange={(event) => {
                            const nextType = event.target.value as DeliveryVehicleType;
                            setVehicleType(nextType);
                            setVehicleCapacity(suggestedCapacityForVehicle(nextType));
                          }}
                        >
                          {vehicleTypeOptions.map((type) => (
                            <option value={type} key={type}>
                              {type} · sugestão {suggestedCapacityForVehicle(type)} kg
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Capacidade máxima usada no Feiraê
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={vehicleCapacity}
                          onChange={(event) => setVehicleCapacity(Number(event.target.value))}
                        />
                        <small>Valor editável para filtrar corridas compatíveis.</small>
                      </label>
                      <label>
                        Marca/modelo
                        <input
                          value={vehicleBrandModel}
                          onChange={(event) => setVehicleBrandModel(event.target.value)}
                          placeholder="Ex.: Honda CG 160"
                        />
                      </label>
                      {requiresPlate(vehicleType) && (
                        <label>
                          Placa
                          <input
                            value={vehiclePlate}
                            onChange={(event) => setVehiclePlate(event.target.value)}
                            placeholder="ABC1D23"
                          />
                        </label>
                      )}
                    </div>
                    <div className="module-action-row">
                      <button type="button" className="primary-action" onClick={addVehicle}>
                        Salvar veículo
                      </button>
                      <button
                        type="button"
                        className="secondary-action"
                        onClick={() => setVehicleFormOpen(false)}
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
                          Até {vehicle.capacityKg} kg
                          {vehicle.brandModel ? ` · ${vehicle.brandModel}` : ""}
                          {vehicle.plate ? ` · ${vehicle.plate}` : ""}
                        </small>
                      </div>
                      <div className="item-actions">
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
                          {vehicle.active ? "Ativo" : "Pausado"}
                        </button>
                        <button
                          className="mini-toggle"
                          aria-label={`Excluir ${vehicle.type}`}
                          onClick={() =>
                            setVehicles((current) => current.filter((item) => item.id !== vehicle.id))
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="surface-card">
                  <span className="eyebrow">Referência inicial do Feiraê</span>
                  <p>
                    Estes valores são sugestões de operação e podem ser alterados no cadastro de cada veículo.
                  </p>
                  <div className="finance-breakdown">
                    {vehicleTypeOptions
                      .filter((type) => type !== "Outro")
                      .map((type) => (
                        <p key={type}>
                          <span>{type}</span>
                          <strong>{suggestedCapacityForVehicle(type)} kg</strong>
                        </p>
                      ))}
                  </div>
                </div>
              </>
            ) : active === "Forma de entrega" ? (
              <>
                <ModuleHeader
                  badge="Preferências"
                  title="Forma de entrega"
                  description="O app usa peso, capacidade dos veículos ativos, raio e preferências para oferecer corridas compatíveis."
                />
                <div className="operation-list detailed">
                  <article>
                    <MapPin />
                    <div>
                      <b>Raio de atuação</b>
                      <small>Defina posteriormente a distância máxima que deseja percorrer.</small>
                    </div>
                  </article>
                  <article>
                    <Truck />
                    <div>
                      <b>Capacidade por veículo</b>
                      <small>Somente veículos ativos entram no filtro de peso das corridas.</small>
                    </div>
                  </article>
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
                    <strong>1</strong>
                    <span>cancelamento na semana</span>
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
                        <small>Baseado nas últimas entregas demonstrativas.</small>
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
                        <small>Etapa demonstrativa para orientar o entregador.</small>
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
                    <small>Complete 5 entregas entre 7h e 11h para liberar bônus demonstrativo.</small>
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
