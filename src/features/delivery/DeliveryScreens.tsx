import { useEffect, useRef, useState } from "react";
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
import {
  DocumentStatusTimeline,
  DocumentsGuidanceCard,
  Empty,
  FeiraeNotificationCard,
  LegalTermSignatureCard,
  ModuleHeader,
  PartnerDocumentsHero,
  OperationalOnboardingCard,
  OperationsMenu,
  Panel,
} from "../../components/AppComponents";
import { deliveryModuleDetails } from "../../domain/operations";
import { OrderRouteMap } from "../../components/OrderRouteMap";
import { fairs } from "../../data";
import { drivingRoute, geocodeAddress } from "../../domain/routing";
import { readSharedStores } from "../../domain/marketplaceBridge";
import { optimizeInternalFairRoute, pickupCodeMatches } from "../../domain/fairInternalRouting";
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
import { useUnifiedOrderRevision } from "../../hooks/useUnifiedOrderRevision";
import { money } from "../../utils";
import { consumeInventory } from "../../domain/inventoryBridge";
import {
  feiraeNotificationPermission,
  orderEventNotification,
  requestFeiraeNotificationPermission,
  showFeiraeNotification,
} from "../../domain/feiraeNotifications";
import { readFileForLocalStorage, storedFileLabel, type StoredFile } from "../../domain/storedFile";
import {
  allRequiredTermsAccepted,
  deliveryRequiredTerms,
  demoLegalAcceptance,
  legalTermFingerprint,
  type LegalAcceptance,
  type LegalTerm,
} from "../../domain/legalTerms";
import {
  appendReview,
  appendSupportTicket,
  eventNow,
  patchUnifiedOrder,
  patchVendorStatus,
  readUnifiedOrders,
  type UnifiedPickupStop,
} from "../../domain/orderBridge";

export function DeliveryOperations({
  session,
  onBack,
  onMap,
  onAccountUpdate,
}: {
  session: DemoSession;
  onBack?: () => void;
  onMap: (destination?: string) => void;
  onAccountUpdate: (name: string, email: string, newPassword?: string) => string | null;
}) {
  const unifiedOrderRevision = useUnifiedOrderRevision();
  const modules = [
    "Disponibilidade",
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
  const seedDemoData = session.email.endsWith("@feirae.test") && !session.isNewAccount;
  const [online, setOnline] = usePersistentState<boolean>(
    `feirae:delivery-online:${session.email}`,
    seedDemoData,
  );
  const [deliveryPreferences, setDeliveryPreferences] = usePersistentState(
    `feirae:delivery-preferences:${session.email}`,
    {
      radiusKm: 12,
      preferredDistanceKm: 8,
      regions: ["Planaltina"],
      autoSchedule: false,
      scheduleStart: "08:00",
      scheduleEnd: "18:00",
      baseLat: null as number | null,
      baseLng: null as number | null,
      baseLabel: "Localização não definida",
    },
  );
  const [accepted, setAccepted] = usePersistentState<string | null>(
    `feirae:delivery-active:${session.email}`,
    null,
  );
  const [, setRouteRevision] = useState(0);
  const [stage, setStage] = usePersistentState<number>(`feirae:delivery-stage:${session.email}`, 0);
  const [pickupCodeInput, setPickupCodeInput] = useState("");
  const [pickupCodeError, setPickupCodeError] = useState("");
  const [qrScanNotice, setQrScanNotice] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelDetails, setCancelDetails] = useState("");
  const [deliveryCancellationLog, setDeliveryCancellationLog] = usePersistentState<
    { id: string; deliveryId: string; reason: string; details: string; createdAt: string }[]
  >(`feirae:delivery-cancellations:${session.email}`, []);
  const [active, setActive] = useState("Central");
  const [documentFilter, setDocumentFilter] = useState("Todos");
  const [notificationPermission, setNotificationPermission] = useState(feiraeNotificationPermission());
  const seenOfferIds = useRef<Set<string> | null>(null);
  const seenDeliveryNotificationKeys = useRef<Set<string> | null>(null);
  const [helpTopic, setHelpTopic] = useState("Falar com suporte");
  const [helpDetail, setHelpDetail] = useState("Preciso falar com o suporte da rota");
  const [helpProtocol, setHelpProtocol] = useState("");
  const [helpTickets, setHelpTickets] = usePersistentState<
    { id: string; topic: string; details: string; createdAt: string; status: "Aberto" | "Resolvido" }[]
  >(`feirae:delivery-help:${session.email}`, []);
  const [accountSaved, setAccountSaved] = useState(false);
  const [deliveryReviewOrderId, setDeliveryReviewOrderId] = useState<string | null>(null);
  const [deliveryReviewScore, setDeliveryReviewScore] = useState(5);
  const [deliveryReviewComment, setDeliveryReviewComment] = useState("");
  const [incidentNotice, setIncidentNotice] = useState("");
  const [vehicleFormOpen, setVehicleFormOpen] = useState(false);
  const [vehicleEditingId, setVehicleEditingId] = useState<string | null>(null);
  const [vehicleError, setVehicleError] = useState("");
  const [vehicleDocumentName, setVehicleDocumentName] = useState("");
  const [vehicleDocumentFile, setVehicleDocumentFile] = useState<StoredFile | null>(null);
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
      photoDataUrl: seedDemoData ? "/brand/09_versao_selo.webp" : "",
    },
  );
  const [deliveryAccountDraft, setDeliveryAccountDraft] = useState({
    ...deliveryAccount,
    newPassword: "",
  });
  const [accountError, setAccountError] = useState("");
  const [vehicles, setVehicles] = usePersistentState<DeliveryVehicle[]>(
    `feirae:delivery-vehicles:${session.email}`,
    seedDemoData
      ? [
          {
            id: "demo-moto",
            type: "Moto",
            capacityKg: suggestedCapacityForVehicle("Moto"),
            brandModel: "",
            plate: "ABC1D23",
            active: true,
            documentFileName: "crlv-demo.pdf",
            documentStatus: "approved",
          },
        ]
      : [],
  );

  const [deliveryLedger, setDeliveryLedger] = usePersistentState<
    {
      id: string;
      deliveryId: string;
      label: string;
      amount: number;
      status: "pending" | "available" | "withdrawal_requested" | "paid";
    }[]
  >(
    `feirae:delivery-ledger:${session.email}`,
    seedDemoData
      ? [
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
        ]
      : [],
  );
  type DeliveryDocument = {
    id: string;
    name: string;
    description: string;
    status: "pending" | "under_review" | "approved" | "correction_required";
    fileName: string;
    file?: StoredFile;
    expiresAt: string;
  };

  const defaultDeliveryDocuments: DeliveryDocument[] = [
    {
      id: "identity",
      name: "Documento oficial com foto",
      description: "RG, CNH ou documento oficial válido.",
      status: "approved" as const,
      fileName: "identidade.pdf",
      expiresAt: "",
    },
    {
      id: "address",
      name: "Comprovante de residência",
      description: "Comprovante ou declaração de residência.",
      status: "approved" as const,
      fileName: "residencia.pdf",
      expiresAt: "",
    },
    {
      id: "background_check",
      name: "Certidões de antecedentes para análise",
      description:
        "Documento analisado conforme a atividade e a localidade. Uma anotação não causa reprovação automática; casos que exigem esclarecimento ficam em análise.",
      status: "approved" as const,
      fileName: "antecedentes-demo.pdf",
      expiresAt: "",
    },
    {
      id: "cnh",
      name: "CNH compatível e válida",
      description: "Obrigatória para veículos motorizados que exigem habilitação.",
      status: "approved" as const,
      fileName: "cnh.pdf",
      expiresAt: "",
    },
    {
      id: "crlv",
      name: "CRLV-e do veículo",
      description: "Obrigatório para veículo motorizado cadastrado.",
      status: "approved" as const,
      fileName: "crlv.pdf",
      expiresAt: "",
    },
    {
      id: "motofrete",
      name: "Curso/autorização de motofrete",
      description: "Obrigatório quando a operação usar moto/motoneta para entrega remunerada.",
      status: "approved" as const,
      fileName: "motofrete.pdf",
      expiresAt: "",
    },
  ].map((document) => (seedDemoData ? document : { ...document, status: "pending" as const, fileName: "" }));
  const [deliveryDocuments, setDeliveryDocuments] = usePersistentState<DeliveryDocument[]>(
    `feirae:delivery-documents:${session.email}`,
    defaultDeliveryDocuments,
  );
  const normalizedDeliveryDocuments = [
    ...defaultDeliveryDocuments.map(
      (fallback) => deliveryDocuments.find((document) => document.id === fallback.id) ?? fallback,
    ),
    ...deliveryDocuments.filter(
      (document) => !defaultDeliveryDocuments.some((fallback) => fallback.id === document.id),
    ),
  ];

  const [legalAcceptances, setLegalAcceptances] = usePersistentState<LegalAcceptance[]>(
    `feirae:delivery-legal-acceptances:${session.email}`,
    seedDemoData
      ? deliveryRequiredTerms.map((term) =>
          demoLegalAcceptance(term, "delivery", session.name, session.email),
        )
      : [],
  );

  useEffect(() => {
    const baseLat = deliveryPreferences.baseLat;
    const baseLng = deliveryPreferences.baseLng;
    if (baseLat === null || baseLng === null) return;
    const basePoint = { lat: baseLat, lng: baseLng };
    let cancelled = false;

    async function calculatePendingRoutes() {
      const pending = readUnifiedOrders().filter(
        (order) =>
          order.fulfillment === "delivery" &&
          ["ready_for_pickup", "driver_assigned"].includes(order.status) &&
          (!order.route ||
            order.route.internalRouteStrategy === undefined ||
            order.route.driverOriginLat !== baseLat ||
            order.route.driverOriginLng !== baseLng),
      );
      if (!pending.length) return;

      for (const order of pending) {
        if (cancelled) return;
        const fair = fairs.find((item) => item.name === order.fairName);
        const fairPoint =
          typeof fair?.lat === "number" && typeof fair.lng === "number"
            ? { lat: fair.lat, lng: fair.lng }
            : fair?.address
              ? await geocodeAddress(fair.address)
              : null;
        const customerPoint =
          typeof order.customerLat === "number" && typeof order.customerLng === "number"
            ? { lat: order.customerLat, lng: order.customerLng }
            : order.customerAddress
              ? await geocodeAddress(order.customerAddress)
              : null;

        if (!fairPoint || !customerPoint) continue;

        const toVendor = await drivingRoute(basePoint, fairPoint);
        const toCustomer = await drivingRoute(fairPoint, customerPoint);
        if (!toVendor || !toCustomer || cancelled) continue;

        const stores = readSharedStores();
        const internalRoute = optimizeInternalFairRoute(
          (order.vendors ?? [])
            .filter((vendor) => vendor.status !== "rejected")
            .map(({ vendorId, storeId, vendorName }) => {
              const store = stores.find((candidate) => candidate.storeId === storeId);
              return {
                vendorId,
                storeId,
                vendorName,
                sector: store?.sector,
                corridor: store?.corridor,
                box: store?.box,
                reference: store?.reference,
                internalX: store?.internalX,
                internalY: store?.internalY,
                pickupCode: store?.pickupCode,
              };
            }),
        );
        const internalKm = internalRoute.distanceMeters / 1000;

        patchUnifiedOrder(
          order.id,
          {
            route: {
              toVendorKm: toVendor.distanceKm,
              vendorToCustomerKm: toCustomer.distanceKm,
              totalKm: Math.round((toVendor.distanceKm + internalKm + toCustomer.distanceKm) * 10) / 10,
              etaMinutes: toVendor.durationMinutes + internalRoute.etaMinutes + toCustomer.durationMinutes,
              source: "osrm",
              pickupStops: internalRoute.stops,
              internalDistanceMeters: internalRoute.distanceMeters,
              internalEtaMinutes: internalRoute.etaMinutes,
              internalRouteStrategy: internalRoute.strategy,
              driverOriginLat: baseLat!,
              driverOriginLng: baseLng!,
            },
          },
          eventNow("route-updated", "Rota calculada com percurso interno da feira", "system"),
        );
      }
      if (!cancelled) setRouteRevision((value) => value + 1);
    }

    void calculatePendingRoutes();
    return () => {
      cancelled = true;
    };
  }, [deliveryPreferences.baseLat, deliveryPreferences.baseLng]);

  function resetVehicleForm() {
    setVehicleEditingId(null);
    setVehicleType("Moto");
    setVehicleCapacity(suggestedCapacityForVehicle("Moto"));
    setVehicleBrandModel("");
    setVehiclePlate("");
    setVehicleDocumentName("");
    setVehicleDocumentFile(null);
    setVehicleError("");
  }

  function editVehicle(vehicle: DeliveryVehicle) {
    setVehicleEditingId(vehicle.id);
    setVehicleType(vehicle.type);
    setVehicleCapacity(vehicle.capacityKg);
    setVehicleBrandModel(vehicle.brandModel);
    setVehiclePlate(vehicle.plate);
    setVehicleDocumentName(vehicle.documentFileName ?? "");
    setVehicleDocumentFile(vehicle.documentFile ?? null);
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
        ? (vehicles.find((vehicle) => vehicle.id === vehicleEditingId)?.active ?? true)
        : true,
      documentFileName: requiresPlate(vehicleType) ? vehicleDocumentName : "",
      documentFile: requiresPlate(vehicleType)
        ? (vehicleDocumentFile ?? vehicles.find((vehicle) => vehicle.id === vehicleEditingId)?.documentFile)
        : undefined,
      documentStatus: requiresPlate(vehicleType)
        ? vehicleEditingId
          ? vehicles.find((vehicle) => vehicle.id === vehicleEditingId)?.documentFileName ===
            vehicleDocumentName
            ? (vehicles.find((vehicle) => vehicle.id === vehicleEditingId)?.documentStatus ?? "under_review")
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
  void unifiedOrderRevision;
  const acceptedSharedOrder = accepted ? sharedOrders.find((order) => order.id === accepted) : undefined;
  const acceptedSharedOrderIsActive =
    acceptedSharedOrder &&
    ["driver_assigned", "collected", "out_for_delivery"].includes(acceptedSharedOrder.status) &&
    acceptedSharedOrder.driver?.driverKey === session.email;
  const effectiveAccepted = acceptedSharedOrder && !acceptedSharedOrderIsActive ? null : accepted;

  useEffect(() => {
    if (
      !effectiveAccepted ||
      deliveryPreferences.baseLat === null ||
      deliveryPreferences.baseLng === null ||
      !navigator.geolocation
    ) {
      return;
    }

    let lastWrite = 0;
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const now = Date.now();
        if (now - lastWrite < 5000) return;
        const order = readUnifiedOrders().find((item) => item.id === effectiveAccepted);
        if (!order?.driver || order.driver.driverKey !== session.email) return;
        lastWrite = now;
        patchUnifiedOrder(effectiveAccepted, {
          driver: {
            ...order.driver,
            location: {
              lat: coords.latitude,
              lng: coords.longitude,
              accuracyMeters: coords.accuracy,
              updatedAt: new Date(now).toISOString(),
            },
          },
        });
      },
      () => undefined,
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 5000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [deliveryPreferences.baseLat, deliveryPreferences.baseLng, effectiveAccepted, session.email]);

  const deliveredReviewOrders = sharedOrders.filter(
    (order) =>
      order.status === "delivered" &&
      order.driver?.driverKey === session.email &&
      !order.reviews?.some((review) => review.authorRole === "delivery"),
  );
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
      const fair = fairs.find((item) => item.name === order.fairName);
      const activeItems = order.items.filter((item) => !item.cancelled);
      const vendorNames = Array.from(new Set(activeItems.map((item) => item.vendor)));
      const pickupStops: Array<UnifiedPickupStop & { collected: boolean }> = (route.pickupStops ?? []).map(
        (stop) => ({
          ...stop,
          collected:
            order.vendors?.find((vendor) => vendor.vendorId === stop.vendorId)?.status === "collected",
        }),
      );
      const weight = activeItems.reduce((sum, item) => sum + item.weightKg, 0);
      return {
        id: order.id,
        fair: order.fairName,
        fairAddress: fair?.address ?? order.fairName,
        bank: pickupStops.map((stop) => stop.vendorName).join(" + ") || vendorNames.join(" + "),
        pickupStops,
        region: order.customerCity ?? "Destino",
        customerAddress: order.customerAddress ?? order.customerCity ?? "Destino do cliente",
        route: `Entrada da feira → ${pickupStops.map((stop) => stop.vendorName).join(" → ") || order.fairName} → saída → ${order.customerCity ?? "cliente"}`,
        toBankKm: route.toVendorKm,
        bankToCustomerKm: route.vendorToCustomerKm,
        totalDistanceKm: route.totalKm,
        etaMinutes: route.etaMinutes,
        internalDistanceMeters: route.internalDistanceMeters ?? 0,
        internalEtaMinutes: route.internalEtaMinutes ?? 0,
        internalRouteStrategy: route.internalRouteStrategy,
        fee: money(order.calculatedDeliveryFee),
        feeAmount: order.calculatedDeliveryFee,
        paymentMethod: order.paymentMethod,
        changeFor: order.changeFor,
        available: order.status === "ready_for_pickup" && !order.driver,
        assignedDriverKey: order.driver?.driverKey,
        weight,
        items: activeItems.map((item) => `${item.quantity}× ${item.name}`),
      };
    });
  const sharedIds = new Set(sharedDeliveries.map((delivery) => delivery.id));
  const fixtureDeliveries = seedDemoData
    ? deliveryFixtures
        .filter((delivery) => !sharedIds.has(delivery.id))
        .map((delivery) => ({
          ...delivery,
          available: true,
          paymentMethod: "Pago no aplicativo",
          changeFor: undefined as number | undefined,
          assignedDriverKey: undefined as string | undefined,
          pickupStops: [
            {
              vendorId: "",
              storeId: "",
              vendorName: delivery.bank,
              collected: false,
            },
          ] as Array<UnifiedPickupStop & { collected: boolean }>,
          fairAddress: delivery.fair,
          internalDistanceMeters: 0,
          internalEtaMinutes: 0,
          internalRouteStrategy: "corridor_box_fallback" as const,
        }))
    : [];
  const deliveries = [...sharedDeliveries, ...fixtureDeliveries];
  const activeVehicles = vehicles.filter((vehicle) => vehicle.active);
  const hasMotorizedVehicle = activeVehicles.some((vehicle) => requiresPlate(vehicle.type));
  const hasMoto = activeVehicles.some(
    (vehicle) => vehicle.type === "Moto" || vehicle.type === "Moto com baú",
  );
  const requiredDocumentIds = [
    "identity",
    "address",
    "background_check",
    ...(hasMotorizedVehicle ? ["cnh", "crlv"] : []),
    ...(hasMoto ? ["motofrete"] : []),
  ];
  const deliveryPhotoReady = Boolean(deliveryAccount.photoDataUrl);
  const deliveryTermsAccepted = allRequiredTermsAccepted(legalAcceptances, deliveryRequiredTerms, "delivery");
  const approvalStatus = !deliveryTermsAccepted
    ? "Termos pendentes"
    : !deliveryPhotoReady
      ? "Foto pendente"
      : requiredDocumentIds.every(
            (id) => normalizedDeliveryDocuments.find((document) => document.id === id)?.status === "approved",
          )
        ? "Aprovado"
        : normalizedDeliveryDocuments.some(
              (document) =>
                requiredDocumentIds.includes(document.id) && document.status === "correction_required",
            )
          ? "Correção necessária"
          : normalizedDeliveryDocuments.some(
                (document) => requiredDocumentIds.includes(document.id) && document.status === "under_review",
              )
            ? "Em análise"
            : "Documentação pendente";
  const deliveryRequiredDocuments = normalizedDeliveryDocuments.filter((document) =>
    requiredDocumentIds.includes(document.id),
  );
  const deliveryTermsSigned = deliveryRequiredTerms.filter((term) =>
    legalAcceptances.some(
      (acceptance) =>
        acceptance.termId === term.id &&
        acceptance.role === "delivery" &&
        acceptance.version === term.version,
    ),
  ).length;
  const deliveryDocumentsSent = deliveryRequiredDocuments.filter((document) =>
    Boolean(document.fileName),
  ).length;
  const deliveryDocumentsApproved = deliveryRequiredDocuments.filter(
    (document) => document.status === "approved",
  ).length;
  const deliveryPendingCount =
    deliveryRequiredTerms.length -
    deliveryTermsSigned +
    deliveryRequiredDocuments.filter((document) => document.status !== "approved").length;
  const deliveryDocumentProgress = Math.round(
    ((deliveryTermsSigned + deliveryDocumentsApproved) /
      Math.max(1, deliveryRequiredTerms.length + deliveryRequiredDocuments.length)) *
      100,
  );
  const filteredDeliveryDocuments = normalizedDeliveryDocuments.filter((document) => {
    if (documentFilter === "Pendentes") return document.status === "pending";
    if (documentFilter === "Em análise") return document.status === "under_review";
    if (documentFilter === "Aprovados") return document.status === "approved";
    if (documentFilter === "Correção necessária") return document.status === "correction_required";
    return true;
  });
  const pendingAmount =
    deliveryLedger
      .filter((entry) => entry.status === "pending")
      .reduce((sum, entry) => sum + entry.amount, 0) +
    (effectiveAccepted
      ? (deliveries.find((delivery) => delivery.id === effectiveAccepted)?.feeAmount ?? 0)
      : 0);
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
  const deliveryAccountReady = Boolean(
    deliveryAccount.cpf.trim() && deliveryAccount.phone.trim() && deliveryAccount.photoDataUrl,
  );
  const deliveryOnboardingTarget = !deliveryAccountReady
    ? "Conta"
    : vehicles.length === 0
      ? "Veículos"
      : "Documentos";
  const vehicleReady = (vehicle: DeliveryVehicle) =>
    !requiresPlate(vehicle.type) ||
    (vehicle.documentStatus === "approved" && isValidBrazilianPlate(vehicle.plate));
  const compatibleVehicleForWeight = (weight: number) =>
    [...activeVehicles]
      .filter((vehicle) => vehicle.capacityKg >= weight && vehicleReady(vehicle))
      .sort((a, b) => a.capacityKg - b.capacityKg)[0] ?? null;
  const visibleDeliveries = deliveries
    .filter((delivery) => delivery.available !== false)
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
  const compatibleVisibleDeliveries = visibleDeliveries.filter((delivery) =>
    compatibleVehicleForWeight(delivery.weight),
  );
  const compatibleDeliveryCount = compatibleVisibleDeliveries.length;

  useEffect(() => {
    const currentIds = new Set(compatibleVisibleDeliveries.map((delivery) => delivery.id));
    if (seenOfferIds.current === null || !availableNow) {
      seenOfferIds.current = currentIds;
      return;
    }

    const incoming = compatibleVisibleDeliveries.filter(
      (delivery) => !seenOfferIds.current?.has(delivery.id),
    );
    incoming.forEach((delivery) => {
      void showFeiraeNotification({
        title: "Nova corrida",
        body: `${delivery.fair} · ${delivery.totalDistanceKm.toLocaleString("pt-BR")} km · ganho ${delivery.fee}`,
        tag: `feirae-delivery-offer-${delivery.id}`,
        url: "/",
      });
    });
    seenOfferIds.current = currentIds;
  }, [availableNow, compatibleVisibleDeliveries]);

  useEffect(() => {
    const relevantOrders = readUnifiedOrders().filter(
      (order) => order.driver?.driverKey === session.email || order.id === effectiveAccepted,
    );
    const currentKeys = new Set(
      relevantOrders.flatMap((order) => order.events.map((event) => `${order.id}:${event.key}:${event.at}`)),
    );

    if (seenDeliveryNotificationKeys.current === null) {
      seenDeliveryNotificationKeys.current = currentKeys;
      return;
    }

    relevantOrders.forEach((order) => {
      order.events.forEach((event) => {
        const key = `${order.id}:${event.key}:${event.at}`;
        if (seenDeliveryNotificationKeys.current?.has(key)) return;
        const message = orderEventNotification("delivery", order, event);
        if (message) void showFeiraeNotification(message);
      });
    });

    seenDeliveryNotificationKeys.current = currentKeys;
  }, [effectiveAccepted, session.email, unifiedOrderRevision]);

  async function signDeliveryLegalTerm(term: LegalTerm, signerName: string) {
    const fingerprint = await legalTermFingerprint(term);
    const acceptance: LegalAcceptance = {
      termId: term.id,
      version: term.version,
      role: "delivery",
      signerName,
      signerEmail: session.email,
      signedAt: new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "medium",
      }).format(new Date()),
      fingerprint,
      method: "typed-name",
    };
    setLegalAcceptances((current) => [
      ...current.filter((item) => !(item.termId === term.id && item.role === "delivery")),
      acceptance,
    ]);
    setIncidentNotice(`${term.title} assinado e registrado.`);
  }

  async function enableFeiraeNotifications() {
    setNotificationPermission(await requestFeiraeNotificationPermission());
  }

  async function readPickupQr(file: File) {
    setQrScanNotice("");
    const Detector = (
      window as unknown as {
        BarcodeDetector?: new (options: { formats: string[] }) => {
          detect: (source: ImageBitmap) => Promise<Array<{ rawValue?: string }>>;
        };
      }
    ).BarcodeDetector;

    if (!Detector || typeof createImageBitmap !== "function") {
      setQrScanNotice("Leitura automática de QR indisponível neste navegador. Digite o código da banca.");
      return;
    }

    try {
      const image = await createImageBitmap(file);
      const detector = new Detector({ formats: ["qr_code"] });
      const values = await detector.detect(image);
      image.close();
      const value = values.find((item) => item.rawValue)?.rawValue;
      if (!value) {
        setQrScanNotice("Nenhum QR reconhecido na imagem.");
        return;
      }
      setPickupCodeInput(value);
      setPickupCodeError("");
      setQrScanNotice("QR lido. Confira e confirme a coleta.");
    } catch {
      setQrScanNotice("Não foi possível ler o QR. Use o código impresso como alternativa.");
    }
  }
  const activeDelivery = deliveries.find(
    (delivery) =>
      delivery.id === effectiveAccepted ||
      (delivery.assignedDriverKey === session.email && delivery.available === false),
  );
  const activeUnifiedOrder = activeDelivery
    ? readUnifiedOrders().find((order) => order.id === activeDelivery.id)
    : undefined;
  const activePickupStops = activeDelivery?.pickupStops ?? [];
  const deliveryStages =
    activeDelivery && activePickupStops.length > 1
      ? [
          ...activePickupStops.flatMap((stop) => [
            `Ir para ${stop.vendorName}`,
            `Confirmar coleta — ${stop.vendorName}`,
          ]),
          "Iniciar entrega",
          "Avisar chegada",
          "Confirmar entrega",
        ]
      : ["Ir para a banca", "Confirmar coleta", "Iniciar entrega", "Avisar chegada", "Confirmar entrega"];
  const currentStage = Math.min(stage, Math.max(0, deliveryStages.length - 1));
  const pickupStagesLength = activePickupStops.length * 2;
  const currentPickupStop =
    currentStage < pickupStagesLength ? activePickupStops[Math.floor(currentStage / 2)] : undefined;
  const headingToPickup = currentStage < pickupStagesLength;
  const activeDeliveryVehicle = activeDelivery ? compatibleVehicleForWeight(activeDelivery.weight) : null;
  const activeDeliverySection = activeDelivery ? (
    <section className="active-delivery">
      <span className="eyebrow">Entrega em andamento</span>
      <h3>{activeDelivery.id}</h3>
      <p>{activeDelivery.route}</p>
      {activeUnifiedOrder && (
        <div className="mt-4">
          <OrderRouteMap
            order={activeUnifiedOrder}
            audience="delivery"
            onRoute={(destination) => onMap(destination)}
          />
        </div>
      )}
      <div className="finance-breakdown">
        <p>
          <span>Feira</span>
          <strong>{activeDelivery.fair}</strong>
        </p>
        <p>
          <span>Bancas</span>
          <strong>
            {activePickupStops.length} · {activeDelivery.bank}
          </strong>
        </p>
        <p>
          <span>Peso</span>
          <strong>{activeDelivery.weight.toLocaleString("pt-BR")} kg</strong>
        </p>
        <p>
          <span>Veículo compatível em uso</span>
          <strong>
            {activeDeliveryVehicle
              ? `${activeDeliveryVehicle.type} · ${activeDeliveryVehicle.capacityKg} kg`
              : "Nenhum"}
          </strong>
        </p>
        <p>
          <span>Distância total</span>
          <strong>{activeDelivery.totalDistanceKm.toLocaleString("pt-BR")} km</strong>
        </p>
        <p>
          <span>Previsão</span>
          <strong>{activeDelivery.etaMinutes} min</strong>
        </p>
        <p>
          <span>Ganho</span>
          <strong>{activeDelivery.fee}</strong>
        </p>
        <p>
          <span>Pagamento</span>
          <strong>{activeDelivery.paymentMethod}</strong>
        </p>
        {typeof activeDelivery.changeFor === "number" && (
          <p>
            <span>Troco para</span>
            <strong>{money(activeDelivery.changeFor)}</strong>
          </p>
        )}
      </div>
      <div className="surface-card">
        <span className="eyebrow">Percurso dentro da feira</span>
        <h3>Entrada → {activePickupStops.map((stop) => stop.vendorName).join(" → ") || "banca"} → saída</h3>
        <p>
          {activeDelivery.internalDistanceMeters > 0
            ? `${activeDelivery.internalDistanceMeters} m internos · cerca de ${activeDelivery.internalEtaMinutes} min a pé.`
            : "Sem coordenadas internas suficientes: usando setor, corredor e box como orientação."}
        </p>
        <small>
          GPS é usado para chegar à feira e depois para seguir ao cliente. Entre bancas, o Feiraê usa o mapa
          interno para evitar depender da precisão do GPS em poucos metros.
        </small>
      </div>
      <div className="operation-list detailed">
        {activePickupStops.map((stop, index) => (
          <article key={stop.vendorId || `${activeDelivery.id}-stop-${index}`}>
            {stop.collected ? <Check size={18} /> : <MapPin size={18} />}
            <div>
              <b>
                {index + 1}. {stop.vendorName}
              </b>
              <small>
                {stop.collected
                  ? "Coleta confirmada"
                  : currentPickupStop?.vendorName === stop.vendorName
                    ? "Próxima parada"
                    : "Aguardando coleta"}
                {stop.sector || stop.corridor || stop.box
                  ? ` · ${stop.sector || "setor"} · corredor ${stop.corridor || "—"} · box ${stop.box || "—"}`
                  : ""}
                {typeof stop.internalDistanceFromPreviousMeters === "number"
                  ? ` · ${stop.internalDistanceFromPreviousMeters} m desde a parada anterior`
                  : ""}
              </small>
            </div>
          </article>
        ))}
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
      <div className="delivery-progress" aria-label={`Etapa ${currentStage + 1} de ${deliveryStages.length}`}>
        {deliveryStages.map((label, index) => (
          <span className={index <= currentStage ? "done" : ""} key={label}>
            {index + 1}
          </span>
        ))}
      </div>
      {currentStage < pickupStagesLength && currentStage % 2 === 1 && currentPickupStop?.pickupCode && (
        <div className="surface-card">
          <span className="eyebrow">Confirmar banca</span>
          <h3>
            {currentPickupStop.sector || "Setor"} · corredor {currentPickupStop.corridor || "—"} · box{" "}
            {currentPickupStop.box || "—"}
          </h3>
          <p>Leia o QR fixado na banca ou informe o código impresso antes de confirmar a coleta.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              Código/QR lido
              <input
                value={pickupCodeInput}
                onChange={(event) => {
                  setPickupCodeInput(event.target.value);
                  setPickupCodeError("");
                }}
                placeholder="FEIRAE-..."
              />
            </label>
            <label>
              Ler QR pela câmera
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void readPickupQr(file);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </div>
          {pickupCodeError && <p className="inline-error">{pickupCodeError}</p>}
          {qrScanNotice && <small>{qrScanNotice}</small>}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onMap(headingToPickup ? activeDelivery.fairAddress : activeDelivery.customerAddress)}
          className="secondary-action"
        >
          <MapPin size={17} />{" "}
          {headingToPickup ? "Rota no Feiraê até a feira" : "Rota no Feiraê até o cliente"}
        </button>
        <button
          className="primary-action"
          onClick={() => {
            if (currentStage < pickupStagesLength) {
              const stopIndex = Math.floor(currentStage / 2);
              const stop = activePickupStops[stopIndex];
              const confirmingPickup = currentStage % 2 === 1;

              if (confirmingPickup && stop) {
                if (stop.pickupCode && !pickupCodeMatches(stop.storeId, pickupCodeInput)) {
                  setPickupCodeError(
                    "Código da banca não confere. Leia o QR correto ou digite o código impresso.",
                  );
                  return;
                }
                setPickupCodeError("");
                setPickupCodeInput("");
                setQrScanNotice("");
                if (stop.vendorId) {
                  patchVendorStatus(
                    activeDelivery.id,
                    stop.vendorId,
                    "collected",
                    eventNow(
                      `pickup-collected-${stop.vendorId}`,
                      `Coleta confirmada — ${stop.vendorName}`,
                      "delivery",
                    ),
                  );
                }

                if (stopIndex === activePickupStops.length - 1) {
                  patchUnifiedOrder(
                    activeDelivery.id,
                    { status: "collected" },
                    eventNow("collected", "Todas as bancas coletadas", "delivery"),
                  );
                }
              }

              setStage(currentStage + 1);
            } else if (currentStage === pickupStagesLength) {
              patchUnifiedOrder(
                activeDelivery.id,
                { status: "out_for_delivery" },
                eventNow("out-for-delivery", "A caminho do cliente", "delivery"),
              );
              setStage(currentStage + 1);
            } else if (currentStage === pickupStagesLength + 1) {
              const unified = readUnifiedOrders().find((order) => order.id === activeDelivery.id);
              patchUnifiedOrder(
                activeDelivery.id,
                {
                  driver: unified?.driver
                    ? { ...unified.driver, etaMinutes: Math.min(unified.driver.etaMinutes ?? 5, 5) }
                    : undefined,
                },
                eventNow("approaching", "Pedido chegando", "delivery"),
              );
              setStage(currentStage + 1);
            } else if (currentStage === deliveryStages.length - 1) {
              consumeInventory(activeDelivery.id);
              const unified = readUnifiedOrders().find((order) => order.id === activeDelivery.id);
              patchUnifiedOrder(
                activeDelivery.id,
                {
                  status: "delivered",
                  paymentStatus:
                    unified?.paymentStatus === "due_on_delivery" ? "authorized" : unified?.paymentStatus,
                },
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
          {deliveryStages[currentStage]} <ChevronRight size={17} />
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
      {visibleDeliveries.filter((delivery) => delivery.id !== effectiveAccepted).length === 0 ? (
        <Empty
          title="Nenhuma corrida dentro dos seus filtros"
          text="Aumente o raio, altere as regiões ou aguarde uma nova corrida."
        />
      ) : (
        visibleDeliveries
          .filter((delivery) => delivery.id !== effectiveAccepted)
          .map((delivery) => {
            const compatibleVehicle = compatibleVehicleForWeight(delivery.weight);
            return (
              <article className="delivery-row" key={delivery.id}>
                <span>
                  <Bike />
                </span>
                <div>
                  <b>
                    {delivery.id} · {delivery.fair} · {delivery.bank}
                  </b>
                  <small>
                    Destino: {delivery.region} · {delivery.weight.toLocaleString("pt-BR")} kg ·{" "}
                    {delivery.items.length} item(ns)
                  </small>
                  <small>
                    Até a feira {delivery.toBankKm.toLocaleString("pt-BR")} km · feira → cliente{" "}
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
                  disabled={!availableNow || effectiveAccepted !== null || !compatibleVehicle}
                  onClick={() => {
                    if (!compatibleVehicle || !availableNow) return;
                    setAccepted(delivery.id);
                    setStage(0);
                    setCancelReason("");
                    setCancelDetails("");
                    patchUnifiedOrder(
                      delivery.id,
                      {
                        status: "driver_assigned",
                        driver: {
                          driverKey: session.email,
                          name: deliveryAccount.name || session.name,
                          vehicle: compatibleVehicle.type,
                          plateMasked: compatibleVehicle.plate
                            ? `***${compatibleVehicle.plate.slice(-4)}`
                            : undefined,
                          etaMinutes: delivery.etaMinutes,
                          distanceKm: delivery.totalDistanceKm,
                          location:
                            deliveryPreferences.baseLat !== null && deliveryPreferences.baseLng !== null
                              ? {
                                  lat: deliveryPreferences.baseLat,
                                  lng: deliveryPreferences.baseLng,
                                  updatedAt: new Date().toISOString(),
                                }
                              : undefined,
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
    <Panel
      title="Central do entregador"
      subtitle="Gerencie disponibilidade, veículos, filtros, corridas e ganhos."
      onBack={onBack}
    >
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
                  {approvalStatus === "Aprovado"
                    ? availableNow
                      ? "Disponível"
                      : "Indisponível"
                    : approvalStatus}
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
                <span>ganhos possíveis</span>
              </article>
            </div>
          </div>
          {approvalStatus !== "Aprovado" && (
            <OperationalOnboardingCard
              title="Complete seu cadastro para entregar"
              status={approvalStatus}
              text="Corridas só são liberadas depois da foto de perfil, dados pessoais, veículo, documentos e análises obrigatórias estarem prontos e aprovados."
              steps={["Conta e foto", "Veículo", "Documentos", "Aprovação"]}
              action={
                deliveryOnboardingTarget === "Conta"
                  ? "Completar minha conta"
                  : deliveryOnboardingTarget === "Veículos"
                    ? "Cadastrar veículo"
                    : "Revisar documentos"
              }
              onAction={() => setActive(deliveryOnboardingTarget)}
            />
          )}

          <FeiraeNotificationCard
            permission={notificationPermission}
            message={
              availableNow
                ? compatibleDeliveryCount > 0
                  ? `${compatibleDeliveryCount} corrida(s) compatível(is) disponível(is)`
                  : "Você está ativo e o Feiraê avisará quando uma corrida chegar"
                : "Ative sua disponibilidade para receber novas corridas"
            }
            onEnable={() => void enableFeiraeNotifications()}
          />

          {activeDelivery && activeDeliverySection}

          <section className="central-live-feed" aria-label="Corridas no painel principal">
            <ModuleHeader
              badge={availableNow ? "Ao vivo" : "Pausado"}
              title="Corridas no painel principal"
              description="Novas corridas compatíveis aparecem aqui automaticamente enquanto você estiver disponível."
            />
            {deliveryList}
          </section>

          <OperationsMenu modules={modules} details={deliveryModuleDetails} onOpen={setActive} />
        </div>
      ) : (
        <div className="module-screen">
          <button className="back-button" onClick={() => setActive("Central")}>
            <ArrowLeft size={17} /> Voltar para central
          </button>
          <div className="surface-card operation-card">
            <span className="eyebrow">{active}</span>
            {active === "Disponibilidade" ? (
              <>
                <div className="delivery-hero">
                  <span aria-hidden="true">
                    <Bike />
                  </span>
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
                    aria-pressed={availableNow}
                  >
                    {approvalStatus === "Aprovado"
                      ? online
                        ? "Desligar"
                        : "Ficar disponível"
                      : approvalStatus}
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
                        visibleDeliveries
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
                {requestedAmount > 0 && (
                  <button
                    className="secondary-action"
                    onClick={() =>
                      setDeliveryLedger((current) =>
                        current.map((entry) =>
                          entry.status === "withdrawal_requested"
                            ? { ...entry, status: "paid" as const }
                            : entry,
                        ),
                      )
                    }
                  >
                    Registrar repasse recebido
                  </button>
                )}
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
                        <small>
                          Ex.: um pedido de 10 kg pode ir em qualquer veículo ativo que suporte 10 kg ou mais.
                        </small>
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
                                  void readFileForLocalStorage(file)
                                    .then((stored) => {
                                      setVehicleDocumentName(stored.name);
                                      setVehicleDocumentFile(stored);
                                      setVehicleError("");
                                    })
                                    .catch((error: Error) => setVehicleError(error.message));
                                }}
                              />
                            </span>
                            <small>
                              {vehicleDocumentFile
                                ? `Arquivo armazenado: ${storedFileLabel(vehicleDocumentFile)}`
                                : "O documento entra em análise quando for novo ou substituído."}
                            </small>
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
                {!vehicles.length && (
                  <Empty
                    title="Nenhum veículo cadastrado"
                    text="Cadastre um veículo e defina a capacidade para receber corridas compatíveis."
                  />
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
                  <div className="region-strip">
                    <MapPin size={18} />
                    <div>
                      <b>Localização usada para calcular distância até a banca</b>
                      <p>{deliveryPreferences.baseLabel}</p>
                    </div>
                    <button
                      className="mini-toggle"
                      onClick={() => {
                        if (!navigator.geolocation) return;
                        navigator.geolocation.getCurrentPosition(
                          ({ coords }) =>
                            setDeliveryPreferences((current) => ({
                              ...current,
                              baseLat: coords.latitude,
                              baseLng: coords.longitude,
                              baseLabel: `Localização atual · ${coords.accuracy.toFixed(0)} m de precisão`,
                            })),
                          () =>
                            setDeliveryPreferences((current) => ({
                              ...current,
                              baseLabel: "Não foi possível acessar sua localização",
                            })),
                          { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 },
                        );
                      }}
                    >
                      Usar GPS
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <b>Estou disponível agora</b>
                      <p>
                        {availableNow
                          ? "Novas corridas compatíveis podem aparecer."
                          : "Você não receberá novas corridas agora."}
                      </p>
                    </div>
                    <button
                      className={availableNow ? "status-button active" : "status-button"}
                      disabled={approvalStatus !== "Aprovado"}
                      aria-pressed={availableNow}
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
                      <small className="block">
                        Fora do horário configurado o app fica indisponível para novas corridas.
                      </small>
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
                        Regiões:{" "}
                        {deliveryPreferences.regions.length
                          ? deliveryPreferences.regions.join(", ")
                          : "todas"}{" "}
                        · preferência até {deliveryPreferences.preferredDistanceKm} km.
                      </small>
                    </div>
                  </article>
                  <article>
                    <Truck />
                    <div>
                      <b>Veículos ativos · {activeVehicles.length}</b>
                      <small>
                        {activeVehicles.length
                          ? activeVehicles
                              .map((vehicle) => `${vehicle.type} ${vehicle.capacityKg} kg`)
                              .join(" · ")
                          : "Nenhum veículo ativo. Sem veículo compatível, a corrida não pode ser aceita."}
                      </small>
                    </div>
                    <button className="mini-toggle" onClick={() => setActive("Veículos")}>
                      Gerenciar
                    </button>
                  </article>
                </div>

                <div className="surface-card">
                  <span className="eyebrow">Resultado dos filtros</span>
                  <div className="operation-metrics">
                    <article>
                      <strong>{visibleDeliveries.length}</strong>
                      <span>dentro do raio/regiões</span>
                    </article>
                    <article>
                      <strong>{compatibleDeliveryCount}</strong>
                      <span>com peso compatível</span>
                    </article>
                    <article>
                      <strong>{availableNow ? "Ativo" : "Pausado"}</strong>
                      <span>recebimento de corridas</span>
                    </article>
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
                  badge="Após a entrega"
                  title="Avaliações cruzadas"
                  description="Avalie cliente e banca depois de concluir a corrida."
                />
                {deliveredReviewOrders.length ? (
                  <div className="operation-list detailed">
                    {deliveredReviewOrders.map((order) => (
                      <article key={order.id}>
                        <Star />
                        <div>
                          <b>
                            {order.id} · {order.customerName}
                          </b>
                          <small>{order.vendors?.map((vendor) => vendor.vendorName).join(" · ")}</small>
                          {deliveryReviewOrderId === order.id && (
                            <div className="form-card compact">
                              <label>
                                Nota
                                <select
                                  value={deliveryReviewScore}
                                  onChange={(event) => setDeliveryReviewScore(Number(event.target.value))}
                                >
                                  {[5, 4, 3, 2, 1].map((score) => (
                                    <option value={score} key={score}>
                                      {score} estrela{score === 1 ? "" : "s"}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                Comentário
                                <textarea
                                  rows={3}
                                  value={deliveryReviewComment}
                                  onChange={(event) => setDeliveryReviewComment(event.target.value)}
                                  placeholder="Como foi a coleta e o atendimento?"
                                />
                              </label>
                              <div className="module-action-row">
                                <button
                                  className="primary-action"
                                  onClick={() => {
                                    const reviewSequence = (order.reviews?.length ?? 0) + 1;
                                    appendReview(order.id, {
                                      id: `delivery-customer-${order.id}-${reviewSequence}`,
                                      authorRole: "delivery",
                                      targetRole: "customer",
                                      targetId: order.customerKey,
                                      rating: deliveryReviewScore,
                                      comment: deliveryReviewComment.trim(),
                                      createdAt: new Date().toISOString(),
                                    });
                                    for (const vendor of order.vendors ?? []) {
                                      appendReview(order.id, {
                                        id: `delivery-vendor-${vendor.vendorId}-${reviewSequence}`,
                                        authorRole: "delivery",
                                        targetRole: "vendor",
                                        targetId: vendor.vendorId,
                                        rating: deliveryReviewScore,
                                        comment: deliveryReviewComment.trim(),
                                        createdAt: new Date().toISOString(),
                                      });
                                    }
                                    setDeliveryReviewOrderId(null);
                                    setDeliveryReviewComment("");
                                    setDeliveryReviewScore(5);
                                  }}
                                >
                                  Enviar avaliação
                                </button>
                                <button
                                  className="secondary-action"
                                  onClick={() => setDeliveryReviewOrderId(null)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        {deliveryReviewOrderId !== order.id && (
                          <button className="mini-toggle" onClick={() => setDeliveryReviewOrderId(order.id)}>
                            Avaliar
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="operation-footnote">Nenhuma entrega concluída aguardando sua avaliação.</p>
                )}
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
                        <small>Registra ocorrência prioritária e pausa novas ofertas de corrida.</small>
                      </div>
                      <button
                        className="mini-toggle"
                        disabled={!activeDelivery}
                        onClick={() => {
                          if (!activeDelivery) return;
                          const ticketId = `URG-${activeDelivery.id}-${incidentNotice ? 2 : 1}`;
                          appendSupportTicket(activeDelivery.id, {
                            id: ticketId,
                            actor: "delivery",
                            topic: item,
                            details: `Ocorrência registrada durante a corrida ${activeDelivery.id}.`,
                            createdAt: new Date().toISOString(),
                            priority: "urgent",
                            status: "open",
                          });
                          patchUnifiedOrder(
                            activeDelivery.id,
                            {},
                            eventNow("urgent-support", `Alerta grave: ${item}`, "delivery"),
                          );
                          setOnline(false);
                          setIncidentNotice(`Protocolo ${ticketId} aberto. Novas corridas foram pausadas.`);
                        }}
                      >
                        Registrar alerta
                      </button>
                    </article>
                  ))}
                </div>
                {incidentNotice && (
                  <p className="inline-success" role="status">
                    {incidentNotice}
                  </p>
                )}
              </>
            ) : active === "Notificações" ? (
              <>
                <ModuleHeader
                  badge="Avisos"
                  title="Notificações operacionais"
                  description="Central para corridas novas, alteração de rota, pagamento e mensagens do suporte."
                />
                <div className="operation-list detailed">
                  {sharedOrders
                    .filter((order) => order.driver?.driverKey === session.email)
                    .flatMap((order) =>
                      order.events.map((event) => ({
                        key: `${order.id}:${event.key}:${event.at}`,
                        at: event.at,
                        message: orderEventNotification("delivery", order, event),
                      })),
                    )
                    .filter((item) => item.message)
                    .slice(-8)
                    .reverse()
                    .map((item) => (
                      <article key={item.key}>
                        <Bell />
                        <div>
                          <b>{item.message?.title}</b>
                          <small>{item.message?.body}</small>
                          <small>{item.at}</small>
                        </div>
                      </article>
                    ))}
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
                      aria-pressed={helpTopic === item}
                      onClick={() => {
                        setHelpTopic(item);
                        setHelpProtocol("");
                        setHelpDetail(
                          item === "Problema no pedido"
                            ? "Pedido com embalagem ou peso divergente"
                            : item === "Dúvida de repasse"
                              ? "Conferir taxa e data do próximo pagamento"
                              : "Preciso falar com o suporte da rota",
                        );
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <form
                  className="form-card compact"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!helpDetail.trim()) return;
                    const protocol = `SUP-${String(helpTickets.length + 1).padStart(4, "0")}`;
                    const createdAt = new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date());
                    setHelpTickets((current) => [
                      {
                        id: protocol,
                        topic: helpTopic,
                        details: helpDetail.trim(),
                        createdAt,
                        status: "Aberto",
                      },
                      ...current,
                    ]);
                    setHelpProtocol(protocol);
                  }}
                >
                  <label>
                    Assunto selecionado
                    <input value={helpTopic} readOnly />
                  </label>
                  <label>
                    Detalhe do atendimento
                    <input
                      value={helpDetail}
                      onChange={(event) => setHelpDetail(event.target.value)}
                      required
                    />
                  </label>
                  <button type="submit" className="primary-action">
                    Abrir atendimento
                  </button>
                  {helpProtocol && (
                    <p className="inline-success" role="status">
                      Protocolo {helpProtocol} aberto para {helpTopic}.
                    </p>
                  )}
                </form>
                {helpTickets.length > 0 && (
                  <div className="operation-list detailed">
                    {helpTickets.slice(0, 6).map((ticket) => (
                      <article key={ticket.id}>
                        <Info />
                        <div>
                          <b>
                            {ticket.id} · {ticket.topic}
                          </b>
                          <small>
                            {ticket.createdAt} · {ticket.status}
                          </small>
                          <p>{ticket.details}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
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
                    const nextAccount = {
                      name: deliveryAccountDraft.name.trim(),
                      cpf: deliveryAccountDraft.cpf.trim(),
                      birthDate: deliveryAccountDraft.birthDate,
                      email: deliveryAccountDraft.email.trim().toLocaleLowerCase("pt-BR"),
                      phone: deliveryAccountDraft.phone.trim(),
                      pixKey: deliveryAccountDraft.pixKey.trim(),
                      receivingMethod: deliveryAccountDraft.receivingMethod,
                      bankName: deliveryAccountDraft.bankName.trim(),
                      agency: deliveryAccountDraft.agency.trim(),
                      accountNumber: deliveryAccountDraft.accountNumber.trim(),
                      cnh: deliveryAccountDraft.cnh.trim(),
                      cnhCategory: deliveryAccountDraft.cnhCategory.trim(),
                      cep: deliveryAccountDraft.cep.trim(),
                      city: deliveryAccountDraft.city.trim(),
                      state: deliveryAccountDraft.state.trim().toUpperCase(),
                      photoDataUrl: deliveryAccountDraft.photoDataUrl ?? "",
                    };
                    const error = onAccountUpdate(
                      nextAccount.name,
                      nextAccount.email,
                      deliveryAccountDraft.newPassword.trim() || undefined,
                    );
                    if (error) {
                      setAccountError(error);
                      setAccountSaved(false);
                      return;
                    }
                    if (nextAccount.email !== session.email.trim().toLocaleLowerCase("pt-BR")) {
                      window.localStorage.setItem(
                        `feirae:delivery-account:${nextAccount.email}`,
                        JSON.stringify(nextAccount),
                      );
                    } else {
                      setDeliveryAccount(nextAccount);
                    }
                    setDeliveryAccountDraft({ ...nextAccount, newPassword: "" });
                    setAccountError("");
                    setAccountSaved(true);
                    window.setTimeout(() => setAccountSaved(false), 2200);
                  }}
                >
                  <div className="account-photo-field">
                    <div className="account-photo-field__preview">
                      {deliveryAccountDraft.photoDataUrl ? (
                        <img src={deliveryAccountDraft.photoDataUrl} alt="Prévia da foto do entregador" />
                      ) : (
                        <Upload size={24} />
                      )}
                    </div>
                    <div>
                      <b>Foto do entregador · obrigatória</b>
                      <small>
                        Usada para identificação no perfil e na entrega. Este protótipo não faz reconhecimento
                        facial. JPG, PNG ou WebP de até 1,5 MB.
                      </small>
                      <label className="secondary-action account-photo-field__button">
                        {deliveryAccountDraft.photoDataUrl ? "Trocar foto" : "Adicionar foto"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          aria-label="Foto do entregador"
                          onChange={(event) => {
                            const selected = event.target.files?.[0];
                            if (!selected) return;
                            if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
                              setAccountError("Use uma imagem JPG, PNG ou WebP.");
                              return;
                            }
                            void readFileForLocalStorage(selected)
                              .then((stored) => {
                                setDeliveryAccountDraft((current) => ({
                                  ...current,
                                  photoDataUrl: stored.dataUrl,
                                }));
                                setAccountError("");
                              })
                              .catch((error: unknown) =>
                                setAccountError(
                                  error instanceof Error
                                    ? error.message
                                    : "Não foi possível carregar a foto.",
                                ),
                              );
                          }}
                        />
                      </label>
                      {deliveryAccountDraft.photoDataUrl && !seedDemoData && (
                        <button
                          type="button"
                          className="account-photo-field__remove"
                          onClick={() =>
                            setDeliveryAccountDraft((current) => ({ ...current, photoDataUrl: "" }))
                          }
                        >
                          Remover foto
                        </button>
                      )}
                      {seedDemoData && <small>Conta de demonstração usa uma imagem de exemplo.</small>}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label>
                      Nome completo
                      <input
                        value={deliveryAccountDraft.name}
                        onChange={(event) =>
                          setDeliveryAccountDraft((current) => ({ ...current, name: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      CPF
                      <input
                        value={deliveryAccountDraft.cpf}
                        onChange={(event) =>
                          setDeliveryAccountDraft((current) => ({ ...current, cpf: event.target.value }))
                        }
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                      />
                    </label>
                    <label>
                      Data de nascimento
                      <input
                        type="date"
                        value={deliveryAccountDraft.birthDate}
                        onChange={(event) =>
                          setDeliveryAccountDraft((current) => ({
                            ...current,
                            birthDate: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Telefone
                      <input
                        value={deliveryAccountDraft.phone}
                        onChange={(event) =>
                          setDeliveryAccountDraft((current) => ({ ...current, phone: event.target.value }))
                        }
                        placeholder="(61) 99999-9999"
                      />
                    </label>
                  </div>
                  <label>
                    E-mail
                    <input
                      type="email"
                      value={deliveryAccountDraft.email}
                      onChange={(event) =>
                        setDeliveryAccountDraft((current) => ({ ...current, email: event.target.value }))
                      }
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label>
                      Forma de recebimento
                      <select
                        value={deliveryAccountDraft.receivingMethod}
                        onChange={(event) =>
                          setDeliveryAccountDraft((current) => ({
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
                        value={deliveryAccountDraft.cep}
                        onChange={(event) =>
                          setDeliveryAccountDraft((current) => ({ ...current, cep: event.target.value }))
                        }
                        placeholder="00000-000"
                      />
                    </label>
                  </div>
                  {deliveryAccountDraft.receivingMethod === "Pix" ? (
                    <label>
                      Chave Pix para repasse
                      <input
                        value={deliveryAccountDraft.pixKey}
                        onChange={(event) =>
                          setDeliveryAccountDraft((current) => ({ ...current, pixKey: event.target.value }))
                        }
                        placeholder="CPF, e-mail, telefone ou chave"
                      />
                    </label>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label>
                        Banco
                        <input
                          value={deliveryAccountDraft.bankName}
                          onChange={(event) =>
                            setDeliveryAccountDraft((current) => ({
                              ...current,
                              bankName: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Agência
                        <input
                          value={deliveryAccountDraft.agency}
                          onChange={(event) =>
                            setDeliveryAccountDraft((current) => ({
                              ...current,
                              agency: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Conta
                        <input
                          value={deliveryAccountDraft.accountNumber}
                          onChange={(event) =>
                            setDeliveryAccountDraft((current) => ({
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
                        value={deliveryAccountDraft.city}
                        onChange={(event) =>
                          setDeliveryAccountDraft((current) => ({ ...current, city: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Estado
                      <input
                        value={deliveryAccountDraft.state}
                        onChange={(event) =>
                          setDeliveryAccountDraft((current) => ({ ...current, state: event.target.value }))
                        }
                        maxLength={2}
                      />
                    </label>
                    <label>
                      CNH
                      <input
                        value={deliveryAccountDraft.cnh}
                        onChange={(event) =>
                          setDeliveryAccountDraft((current) => ({ ...current, cnh: event.target.value }))
                        }
                        placeholder="Para veículos que exigem habilitação"
                      />
                    </label>
                    <label>
                      Categoria da CNH
                      <input
                        value={deliveryAccountDraft.cnhCategory}
                        onChange={(event) =>
                          setDeliveryAccountDraft((current) => ({
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
                  <label>
                    Nova senha
                    <input
                      type="password"
                      value={deliveryAccountDraft.newPassword}
                      onChange={(event) =>
                        setDeliveryAccountDraft((current) => ({
                          ...current,
                          newPassword: event.target.value,
                        }))
                      }
                      minLength={6}
                      placeholder="Deixe vazio para manter a atual"
                      autoComplete="new-password"
                    />
                  </label>
                  {accountError && (
                    <p className="inline-error" role="alert">
                      {accountError}
                    </p>
                  )}
                  {accountSaved && (
                    <p className="inline-success" role="status">
                      Dados da conta salvos neste dispositivo.
                    </p>
                  )}
                  <div className="module-action-row">
                    <button type="submit" className="primary-action">
                      Salvar alterações
                    </button>
                    <button
                      type="button"
                      className="secondary-action"
                      onClick={() => {
                        setDeliveryAccountDraft({ ...deliveryAccount, newPassword: "" });
                        setAccountError("");
                        setAccountSaved(false);
                      }}
                    >
                      Descartar alterações
                    </button>
                  </div>
                </form>
              </>
            ) : active === "Documentos" ? (
              <>
                <PartnerDocumentsHero
                  roleLabel="Entregador"
                  status={approvalStatus}
                  progress={deliveryDocumentProgress}
                  termsSigned={deliveryTermsSigned}
                  termsTotal={deliveryRequiredTerms.length}
                  documentsSent={deliveryDocumentsSent}
                  documentsApproved={deliveryDocumentsApproved}
                  documentsTotal={deliveryRequiredDocuments.length}
                  pendingCount={deliveryPendingCount}
                  onShowPending={() => setDocumentFilter("Pendentes")}
                />

                <section className="documents-section-block">
                  <div className="documents-section-heading">
                    <div>
                      <span className="eyebrow">Termos jurídicos e privacidade</span>
                      <h3>Termos obrigatórios</h3>
                      <p>Leia as regras de segurança, autonomia, responsabilidade e LGPD antes de operar.</p>
                    </div>
                    <span className="documents-counter">
                      {deliveryTermsSigned}/{deliveryRequiredTerms.length} assinados
                    </span>
                  </div>
                  <div className="legal-terms-stack">
                    {deliveryRequiredTerms.map((term) => (
                      <LegalTermSignatureCard
                        key={term.id}
                        term={term}
                        acceptance={legalAcceptances.find(
                          (item) => item.termId === term.id && item.role === "delivery",
                        )}
                        signerName={deliveryAccount.name || session.name}
                        signerEmail={session.email}
                        onSign={signDeliveryLegalTerm}
                      />
                    ))}
                  </div>
                </section>

                <section className="documents-section-block" id="delivery-document-files">
                  <div className="documents-section-heading">
                    <div>
                      <span className="eyebrow">Arquivos e validação</span>
                      <h3>Seus documentos</h3>
                      <p>
                        Os documentos obrigatórios se ajustam aos veículos ativos. Acompanhe cada análise
                        aqui.
                      </p>
                    </div>
                    <span className="documents-counter">
                      {deliveryDocumentsApproved}/{deliveryRequiredDocuments.length} aprovados
                    </span>
                  </div>

                  <div className="document-filter-row" aria-label="Filtrar documentos">
                    {["Todos", "Pendentes", "Em análise", "Aprovados", "Correção necessária"].map(
                      (filter) => (
                        <button
                          type="button"
                          key={filter}
                          className={documentFilter === filter ? "active" : ""}
                          onClick={() => setDocumentFilter(filter)}
                        >
                          {filter}
                        </button>
                      ),
                    )}
                  </div>

                  <div className="documents-card-list">
                    {filteredDeliveryDocuments.map((document) => {
                      const requiredNow = requiredDocumentIds.includes(document.id);
                      return (
                        <article className="document-file-card" key={document.id}>
                          <div className="document-file-icon">
                            <Upload />
                          </div>
                          <div className="document-file-content">
                            <div className="document-file-heading">
                              <div>
                                <b>{document.name}</b>
                                <small>{requiredNow ? "Obrigatório agora" : "Não obrigatório agora"}</small>
                              </div>
                              <span
                                className={`document-status ${
                                  document.status === "approved"
                                    ? "status-approved"
                                    : document.status === "under_review"
                                      ? "status-review"
                                      : document.status === "correction_required"
                                        ? "status-error"
                                        : ""
                                }`}
                              >
                                {document.status === "approved"
                                  ? "Aprovado"
                                  : document.status === "under_review"
                                    ? "Em análise"
                                    : document.status === "correction_required"
                                      ? "Correção necessária"
                                      : "Pendente de envio"}
                              </span>
                            </div>
                            <p>{document.description}</p>
                            <DocumentStatusTimeline
                              status={document.status}
                              fileName={document.file ? storedFileLabel(document.file) : document.fileName}
                            />
                            <div className="document-file-actions">
                              {document.file?.dataUrl && (
                                <a
                                  className="secondary-action"
                                  href={document.file.dataUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Visualizar
                                </a>
                              )}
                              <label className="primary-action document-upload-action">
                                {document.fileName ? "Atualizar documento" : "Enviar documento"}
                                <input
                                  type="file"
                                  accept=".pdf,image/*"
                                  hidden
                                  onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (!file) return;
                                    void readFileForLocalStorage(file)
                                      .then((stored) => {
                                        setDeliveryDocuments((current) => {
                                          const merged = [
                                            ...defaultDeliveryDocuments.map(
                                              (fallback) =>
                                                current.find((item) => item.id === fallback.id) ?? fallback,
                                            ),
                                            ...current.filter(
                                              (item) =>
                                                !defaultDeliveryDocuments.some(
                                                  (fallback) => fallback.id === item.id,
                                                ),
                                            ),
                                          ];
                                          return merged.map((item) =>
                                            item.id === document.id
                                              ? {
                                                  ...item,
                                                  fileName: stored.name,
                                                  file: stored,
                                                  status: "under_review",
                                                }
                                              : item,
                                          );
                                        });
                                        if (requiredNow) setOnline(false);
                                      })
                                      .catch((error: Error) => setIncidentNotice(error.message));
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {filteredDeliveryDocuments.length === 0 && (
                    <div className="documents-filter-empty">
                      <Check size={20} />
                      <b>Nenhum documento neste filtro.</b>
                      <span>Escolha outra situação para continuar acompanhando seu cadastro.</span>
                    </div>
                  )}
                </section>

                <DocumentsGuidanceCard roleLabel="Entregador" />
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
