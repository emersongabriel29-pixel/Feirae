import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });

type AdminContext = {
  id: string;
  isSuperadmin: boolean;
  permissions: Set<string>;
};

const orderTransitions: Record<string, string[]> = {
  pending_payment: ["paid", "canceled"],
  paid: ["accepted", "canceled", "refunded"],
  accepted: ["preparing", "canceled"],
  preparing: ["ready_for_pickup", "canceled"],
  ready_for_pickup: ["driver_assigned", "canceled"],
  driver_assigned: ["collected", "canceled"],
  collected: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: ["refunded"],
  canceled: ["refunded"],
  refunded: [],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json({ error: "server_not_configured" }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "unauthorized" }, 401);

  const adminDb = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "unauthorized" }, 401);

  const adminId = userData.user.id;
  const [{ data: profile }, { data: access }, { data: permissionRows }] = await Promise.all([
    adminDb.from("profiles").select("id,role").eq("id", adminId).maybeSingle(),
    adminDb.from("admin_access").select("active,is_superadmin").eq("profile_id", adminId).maybeSingle(),
    adminDb.from("admin_permissions").select("permission").eq("profile_id", adminId),
  ]);

  if (profile?.role !== "admin" || !access?.active) return json({ error: "forbidden" }, 403);

  const ctx: AdminContext = {
    id: adminId,
    isSuperadmin: Boolean(access.is_superadmin),
    permissions: new Set((permissionRows ?? []).map((row) => String(row.permission))),
  };

  const has = (permission: string) =>
    ctx.isSuperadmin || ctx.permissions.has("*") || ctx.permissions.has(permission);

  const requirePermission = (permission: string) => {
    if (!has(permission)) throw new ResponseError("forbidden", 403);
  };

  const audit = async (
    action: string,
    entity: string,
    entityId: string | null,
    beforeData: unknown,
    afterData: unknown,
    metadata: Record<string, unknown> = {},
  ) => {
    const { error } = await adminDb.from("admin_audit_logs").insert({
      admin_id: ctx.id,
      action,
      entity,
      entity_id: entityId,
      before_data: beforeData,
      after_data: afterData,
      metadata,
    });
    if (error) throw new ResponseError("audit_failed", 500, error.message);
  };

  try {
    const body = await req.json();
    const action = String(body?.action ?? "");

    if (action === "order_transition") {
      requirePermission("operations.manage");
      const orderId = String(body.order_id ?? "");
      const nextStatus = String(body.next_status ?? "");
      const reason = String(body.reason ?? "").trim() || null;
      const { data: order, error } = await adminDb.from("orders").select("*").eq("id", orderId).single();
      if (error || !order) throw new ResponseError("order_not_found", 404);
      const allowed = orderTransitions[String(order.status)] ?? [];
      if (!allowed.includes(nextStatus)) {
        throw new ResponseError("invalid_order_transition", 409, `${order.status} -> ${nextStatus}`);
      }
      const { data: updated, error: updateError } = await adminDb
        .from("orders")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId)
        .select()
        .single();
      if (updateError) throw new ResponseError("order_update_failed", 400, updateError.message);
      await adminDb.from("order_events").insert({
        order_id: orderId,
        actor_id: ctx.id,
        actor_role: "admin",
        event_key: "admin_status_transition",
        label: `Status alterado por administrador: ${order.status} → ${nextStatus}`,
        reason,
      });
      await audit("order_transition", "orders", orderId, order, updated, { reason });
      return json({ data: updated });
    }

    if (["delivery_remove_driver", "delivery_reassign", "delivery_cancel"].includes(action)) {
      requirePermission("operations.manage");
      const deliveryId = String(body.delivery_id ?? "");
      const { data: delivery, error } = await adminDb
        .from("deliveries")
        .select("*")
        .eq("id", deliveryId)
        .single();
      if (error || !delivery) throw new ResponseError("delivery_not_found", 404);
      if (["collected", "out_for_delivery", "delivered"].includes(String(delivery.status))) {
        throw new ResponseError("delivery_action_not_allowed_after_collection", 409);
      }
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (action === "delivery_remove_driver") {
        patch.delivery_id = null;
        patch.vehicle_id = null;
        patch.status = "pending";
      }
      if (action === "delivery_reassign") {
        const nextDriver = String(body.next_delivery_id ?? "");
        if (!nextDriver) throw new ResponseError("delivery_driver_required", 400);
        const { data: driver } = await adminDb
          .from("delivery_profiles")
          .select("id,approved")
          .eq("id", nextDriver)
          .maybeSingle();
        if (!driver?.approved) throw new ResponseError("delivery_driver_not_approved", 409);
        patch.delivery_id = nextDriver;
        patch.status = "assigned";
      }
      if (action === "delivery_cancel") {
        const reason = String(body.reason ?? "").trim();
        if (!reason) throw new ResponseError("cancel_reason_required", 400);
        patch.status = "canceled";
        patch.cancel_reason = reason;
        patch.canceled_at = new Date().toISOString();
      }
      const { data: updated, error: updateError } = await adminDb
        .from("deliveries")
        .update(patch)
        .eq("id", deliveryId)
        .select()
        .single();
      if (updateError) throw new ResponseError("delivery_update_failed", 400, updateError.message);
      await audit(action, "deliveries", deliveryId, delivery, updated);
      return json({ data: updated });
    }

    if (action === "payment_reconcile") {
      requirePermission("finance.manage");
      const paymentId = String(body.payment_id ?? "");
      const reconciled = Boolean(body.reconciled);
      const { data: before, error } = await adminDb.from("payments").select("*").eq("id", paymentId).single();
      if (error || !before) throw new ResponseError("payment_not_found", 404);
      const patch = {
        reconciled,
        reconciled_by: reconciled ? ctx.id : null,
        reconciled_at: reconciled ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };
      const { data: updated, error: updateError } = await adminDb
        .from("payments")
        .update(patch)
        .eq("id", paymentId)
        .select()
        .single();
      if (updateError) throw new ResponseError("payment_reconcile_failed", 400, updateError.message);
      await audit("payment_reconcile", "payments", paymentId, before, updated);
      return json({ data: updated });
    }

    if (action === "document_review") {
      requirePermission("documents.review");
      const documentId = String(body.document_id ?? "");
      const status = String(body.status ?? "");
      if (!["under_review", "approved", "correction_required", "rejected"].includes(status)) {
        throw new ResponseError("invalid_document_status", 400);
      }
      const reason = String(body.correction_reason ?? "").trim() || null;
      if (["correction_required", "rejected"].includes(status) && !reason) {
        throw new ResponseError("document_reason_required", 400);
      }
      const { data: before, error } = await adminDb
        .from("onboarding_documents")
        .select("*")
        .eq("id", documentId)
        .single();
      if (error || !before) throw new ResponseError("document_not_found", 404);
      const patch = {
        status,
        correction_reason: reason,
        expires_at: body.expires_at || null,
        reviewed_by: ctx.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { data: updated, error: updateError } = await adminDb
        .from("onboarding_documents")
        .update(patch)
        .eq("id", documentId)
        .select()
        .single();
      if (updateError) throw new ResponseError("document_review_failed", 400, updateError.message);
      await audit("document_review", "onboarding_documents", documentId, before, updated);
      return json({ data: updated });
    }

    if (action === "review_moderate") {
      requirePermission("finance.manage");
      const reviewId = String(body.review_id ?? "");
      const visible = Boolean(body.visible);
      const reason = String(body.reason ?? "").trim() || null;
      const { data: before, error } = await adminDb.from("order_reviews").select("*").eq("id", reviewId).single();
      if (error || !before) throw new ResponseError("review_not_found", 404);
      const { data: updated, error: updateError } = await adminDb
        .from("order_reviews")
        .update({
          visible,
          moderation_reason: reason,
          moderated_by: ctx.id,
          moderated_at: new Date().toISOString(),
        })
        .eq("id", reviewId)
        .select()
        .single();
      if (updateError) throw new ResponseError("review_moderation_failed", 400, updateError.message);
      await audit("review_moderate", "order_reviews", reviewId, before, updated);
      return json({ data: updated });
    }

    if (action === "privacy_update") {
      requirePermission("settings.manage");
      const requestId = String(body.request_id ?? "");
      const status = String(body.status ?? "");
      if (!["open", "in_review", "completed", "rejected"].includes(status)) {
        throw new ResponseError("invalid_privacy_status", 400);
      }
      const { data: before, error } = await adminDb.from("privacy_requests").select("*").eq("id", requestId).single();
      if (error || !before) throw new ResponseError("privacy_request_not_found", 404);
      const resolved = ["completed", "rejected"].includes(status);
      const { data: updated, error: updateError } = await adminDb
        .from("privacy_requests")
        .update({
          status,
          resolution_notes: String(body.resolution_notes ?? "").trim() || null,
          handled_by: ctx.id,
          resolved_at: resolved ? new Date().toISOString() : null,
        })
        .eq("id", requestId)
        .select()
        .single();
      if (updateError) throw new ResponseError("privacy_update_failed", 400, updateError.message);
      await audit("privacy_update", "privacy_requests", requestId, before, updated);
      return json({ data: updated });
    }

    if (action === "support_update") {
      requirePermission("operations.manage");
      const ticketId = String(body.ticket_id ?? "");
      const { data: before, error } = await adminDb.from("support_tickets").select("*").eq("id", ticketId).single();
      if (error || !before) throw new ResponseError("support_ticket_not_found", 404);
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.priority !== undefined) {
        const priority = String(body.priority);
        if (!["normal", "urgent"].includes(priority)) throw new ResponseError("invalid_support_priority", 400);
        patch.priority = priority;
      }
      if (body.status !== undefined) {
        const status = String(body.status);
        if (!["open", "resolved", "closed"].includes(status)) throw new ResponseError("invalid_support_status", 400);
        patch.status = status;
        if (["resolved", "closed"].includes(status)) {
          patch.resolved_at = new Date().toISOString();
          patch.resolved_by = ctx.id;
        } else {
          patch.resolved_at = null;
          patch.resolved_by = null;
        }
      }
      if (body.details !== undefined) patch.details = String(body.details ?? "").trim() || null;
      patch.assigned_to = body.assigned_to || ctx.id;
      const { data: updated, error: updateError } = await adminDb
        .from("support_tickets")
        .update(patch)
        .eq("id", ticketId)
        .select()
        .single();
      if (updateError) throw new ResponseError("support_update_failed", 400, updateError.message);
      await audit("support_update", "support_tickets", ticketId, before, updated);
      return json({ data: updated });
    }

    if (action === "enforcement_create") {
      requirePermission("accounts.enforce");
      const profileId = String(body.profile_id ?? "");
      const actionType = String(body.action_type ?? "");
      const reason = String(body.reason ?? "").trim();
      if (!["suspension", "ban", "orders_block", "sales_block", "deliveries_block"].includes(actionType)) {
        throw new ResponseError("invalid_enforcement_type", 400);
      }
      if (!reason) throw new ResponseError("enforcement_reason_required", 400);
      if (actionType === "suspension" && !body.ends_at) throw new ResponseError("enforcement_end_required", 400);
      const payload = {
        profile_id: profileId,
        action_type: actionType,
        status: "active",
        reason,
        starts_at: body.starts_at || new Date().toISOString(),
        ends_at: body.ends_at || null,
        created_by: ctx.id,
      };
      const { data: inserted, error } = await adminDb.from("account_enforcements").insert(payload).select().single();
      if (error) throw new ResponseError("enforcement_create_failed", 400, error.message);
      await audit("enforcement_create", "account_enforcements", inserted.id, null, inserted);
      return json({ data: inserted });
    }

    if (action === "enforcement_revoke") {
      requirePermission("accounts.enforce");
      const enforcementId = String(body.enforcement_id ?? "");
      const { data: before, error } = await adminDb
        .from("account_enforcements")
        .select("*")
        .eq("id", enforcementId)
        .single();
      if (error || !before) throw new ResponseError("enforcement_not_found", 404);
      const { data: updated, error: updateError } = await adminDb
        .from("account_enforcements")
        .update({
          status: "revoked",
          revoked_by: ctx.id,
          revoked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", enforcementId)
        .select()
        .single();
      if (updateError) throw new ResponseError("enforcement_revoke_failed", 400, updateError.message);
      await audit("enforcement_revoke", "account_enforcements", enforcementId, before, updated);
      return json({ data: updated });
    }

    if (action === "admin_promote") {
      requirePermission("permissions.manage");
      const profileId = String(body.profile_id ?? "");
      const { data: before, error } = await adminDb.from("profiles").select("*").eq("id", profileId).single();
      if (error || !before) throw new ResponseError("profile_not_found", 404);
      const { error: roleError } = await adminDb.from("profiles").update({ role: "admin" }).eq("id", profileId);
      if (roleError) throw new ResponseError("admin_promote_failed", 400, roleError.message);
      const { error: accessError } = await adminDb.from("admin_access").upsert(
        { profile_id: profileId, active: true, is_superadmin: false, updated_by: ctx.id, updated_at: new Date().toISOString() },
        { onConflict: "profile_id" },
      );
      if (accessError) throw new ResponseError("admin_access_failed", 400, accessError.message);
      await audit("admin_promote", "profiles", profileId, before, { ...before, role: "admin" });
      return json({ ok: true });
    }

    if (action === "admin_access_update") {
      requirePermission("permissions.manage");
      const profileId = String(body.profile_id ?? "");
      const { data: before } = await adminDb.from("admin_access").select("*").eq("profile_id", profileId).maybeSingle();
      if (!before) throw new ResponseError("admin_access_not_found", 404);
      const patch: Record<string, unknown> = {
        updated_by: ctx.id,
        updated_at: new Date().toISOString(),
      };
      if (body.active !== undefined) patch.active = Boolean(body.active);
      if (body.is_superadmin !== undefined) {
        if (!ctx.isSuperadmin) throw new ResponseError("superadmin_required", 403);
        const nextSuper = Boolean(body.is_superadmin);
        if (!nextSuper && before.is_superadmin) {
          const { count } = await adminDb
            .from("admin_access")
            .select("*", { count: "exact", head: true })
            .eq("active", true)
            .eq("is_superadmin", true);
          if ((count ?? 0) <= 1) throw new ResponseError("last_superadmin_cannot_be_removed", 409);
        }
        patch.is_superadmin = nextSuper;
      }
      if (profileId === ctx.id && patch.active === false) {
        throw new ResponseError("cannot_disable_current_admin", 409);
      }
      const { data: updated, error } = await adminDb
        .from("admin_access")
        .update(patch)
        .eq("profile_id", profileId)
        .select()
        .single();
      if (error) throw new ResponseError("admin_access_update_failed", 400, error.message);
      await audit("admin_access_update", "admin_access", profileId, before, updated);
      return json({ data: updated });
    }

    if (action === "admin_permissions_replace") {
      requirePermission("permissions.manage");
      const profileId = String(body.profile_id ?? "");
      const permissions = Array.isArray(body.permissions) ? body.permissions.map(String) : [];
      const allowedPermissions = new Set([
        "*",
        "operations.manage",
        "documents.review",
        "accounts.enforce",
        "registrations.manage",
        "rules.manage",
        "finance.manage",
        "communications.manage",
        "settings.manage",
        "permissions.manage",
        "audit.view",
        "reports.view",
      ]);
      if (permissions.some((permission) => !allowedPermissions.has(permission))) {
        throw new ResponseError("invalid_permission", 400);
      }
      const { data: before } = await adminDb.from("admin_permissions").select("*").eq("profile_id", profileId);
      const { error: deleteError } = await adminDb.from("admin_permissions").delete().eq("profile_id", profileId);
      if (deleteError) throw new ResponseError("permission_delete_failed", 400, deleteError.message);
      if (permissions.length) {
        const { error: insertError } = await adminDb.from("admin_permissions").insert(
          permissions.map((permission) => ({ profile_id: profileId, permission, granted_by: ctx.id })),
        );
        if (insertError) throw new ResponseError("permission_insert_failed", 400, insertError.message);
      }
      await audit("permissions_replace", "admin_permissions", profileId, before, { permissions });
      return json({ ok: true });
    }

    if (action === "alert_acknowledge" || action === "alert_resolve") {
      requirePermission("operations.manage");
      const alertId = String(body.alert_id ?? "");
      const { data: before, error } = await adminDb.from("operational_alerts").select("*").eq("id", alertId).single();
      if (error || !before) throw new ResponseError("alert_not_found", 404);
      const now = new Date().toISOString();
      const patch =
        action === "alert_acknowledge"
          ? { status: "acknowledged", acknowledged_by: ctx.id, acknowledged_at: now }
          : { status: "resolved", resolved_by: ctx.id, resolved_at: now };
      const { data: updated, error: updateError } = await adminDb
        .from("operational_alerts")
        .update(patch)
        .eq("id", alertId)
        .select()
        .single();
      if (updateError) throw new ResponseError("alert_update_failed", 400, updateError.message);
      await audit(action, "operational_alerts", alertId, before, updated);
      return json({ data: updated });
    }

    if (action === "refresh_alerts") {
      requirePermission("operations.manage");
      const settingsResult = await adminDb
        .from("platform_settings")
        .select("key,value")
        .in("key", ["alerts.order_stale_minutes", "alerts.delivery_stale_minutes", "alerts.document_expiry_days"]);
      const settings = Object.fromEntries(
        (settingsResult.data ?? []).map((row) => [row.key, Number(row.value)]),
      );
      const orderMinutes = settings["alerts.order_stale_minutes"] || 45;
      const deliveryMinutes = settings["alerts.delivery_stale_minutes"] || 30;
      const expiryDays = settings["alerts.document_expiry_days"] || 30;
      const now = Date.now();
      const orderCutoff = new Date(now - orderMinutes * 60000).toISOString();
      const deliveryCutoff = new Date(now - deliveryMinutes * 60000).toISOString();
      const expiryDate = new Date(now + expiryDays * 86400000).toISOString().slice(0, 10);

      const [orders, deliveries, documents, payments, payouts, integrations] = await Promise.all([
        adminDb
          .from("orders")
          .select("id,status,updated_at")
          .not("status", "in", "(delivered,canceled,refunded)")
          .lt("updated_at", orderCutoff),
        adminDb
          .from("deliveries")
          .select("id,order_id,status,updated_at")
          .not("status", "in", "(delivered,canceled)")
          .lt("updated_at", deliveryCutoff),
        adminDb
          .from("onboarding_documents")
          .select("id,profile_id,document_type,status,expires_at")
          .neq("status", "rejected")
          .lte("expires_at", expiryDate),
        adminDb
          .from("payments")
          .select("id,order_id,status,failure_reason")
          .in("status", ["failed", "error", "declined"]),
        adminDb.from("payouts").select("id,profile_id,status").eq("status", "failed"),
        adminDb.from("integration_registry").select("key,label,status").eq("enabled", true).neq("status", "ok"),
      ]);

      const candidates: Array<Record<string, unknown>> = [];
      for (const row of orders.data ?? []) {
        candidates.push(alertRow("order_stale", "warning", "orders", row.id, "Pedido sem atualização", `Pedido ${row.id} parado além do limite.`));
      }
      for (const row of deliveries.data ?? []) {
        candidates.push(alertRow("delivery_stale", "critical", "deliveries", row.id, "Entrega sem atualização", `Entrega ${row.id} parada além do limite.`));
      }
      for (const row of documents.data ?? []) {
        candidates.push(alertRow("document_expiry", "warning", "onboarding_documents", row.id, "Documento vencendo", `${row.document_type} do perfil ${row.profile_id} exige atenção.`));
      }
      for (const row of payments.data ?? []) {
        candidates.push(alertRow("payment_failure", "critical", "payments", row.id, "Falha de pagamento", row.failure_reason || `Pagamento do pedido ${row.order_id} falhou.`));
      }
      for (const row of payouts.data ?? []) {
        candidates.push(alertRow("payout_failure", "critical", "payouts", row.id, "Falha de repasse", `Repasse ${row.id} falhou.`));
      }
      for (const row of integrations.data ?? []) {
        candidates.push(alertRow("integration_failure", "critical", "integration_registry", row.key, `Integração: ${row.label}`, `Status atual: ${row.status}.`));
      }

      const activeKeys = new Set<string>();
      for (const candidate of candidates) {
        activeKeys.add(String(candidate.alert_key));
        await adminDb.from("operational_alerts").upsert(
          { ...candidate, status: "open", last_seen_at: new Date().toISOString() },
          { onConflict: "alert_key" },
        );
      }

      const { data: existing } = await adminDb
        .from("operational_alerts")
        .select("id,alert_key,status")
        .neq("status", "resolved");
      for (const alert of existing ?? []) {
        if (!activeKeys.has(String(alert.alert_key))) {
          await adminDb
            .from("operational_alerts")
            .update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_by: ctx.id })
            .eq("id", alert.id);
        }
      }
      return json({ ok: true, active: candidates.length });
    }

    throw new ResponseError("unknown_action", 400);
  } catch (error) {
    if (error instanceof ResponseError) {
      return json({ error: error.code, detail: error.detail ?? null }, error.status);
    }
    console.error(error);
    return json({ error: "internal_error" }, 500);
  }
});

function alertRow(
  type: string,
  severity: "info" | "warning" | "critical",
  entity: string,
  entityId: string,
  title: string,
  message: string,
) {
  return {
    alert_key: `${type}:${entityId}`,
    alert_type: type,
    severity,
    entity,
    entity_id: String(entityId),
    title,
    message,
    detected_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
  };
}

class ResponseError extends Error {
  code: string;
  status: number;
  detail?: string;
  constructor(code: string, status: number, detail?: string) {
    super(code);
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}
