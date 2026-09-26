/* global Deno */
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

const maxBytes = 5 * 1024 * 1024;
const allowed: Record<string, { extension: string; signature: number[] }> = {
  "application/pdf": { extension: "pdf", signature: [0x25, 0x50, 0x44, 0x46, 0x2d] },
  "image/jpeg": { extension: "jpg", signature: [0xff, 0xd8, 0xff] },
  "image/png": { extension: "png", signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceRoleKey || !anonKey) return json({ error: "server_not_configured" }, 500);

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "unauthorized" }, 401);

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminDb = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "unauthorized" }, 401);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "invalid_multipart" }, 400);
  }

  const file = form.get("file");
  const documentType = String(form.get("document_type") ?? "").trim();
  if (!(file instanceof File) || !documentType) return json({ error: "file_and_document_type_required" }, 400);
  if (file.size <= 0 || file.size > maxBytes) return json({ error: "invalid_file_size" }, 413);

  const rule = allowed[file.type];
  if (!rule) return json({ error: "unsupported_file_type" }, 415);

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesSignature(bytes, rule.signature)) return json({ error: "file_signature_mismatch" }, 415);

  const userId = userData.user.id;
  const { data: currentDocument } = await adminDb
    .from("onboarding_documents")
    .select("id,file_path,status")
    .eq("profile_id", userId)
    .eq("document_type", documentType)
    .maybeSingle();
  const path = `${userId}/${crypto.randomUUID()}.${rule.extension}`;

  const { error: uploadError } = await adminDb.storage
    .from("onboarding-documents")
    .upload(path, bytes, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });
  if (uploadError) return json({ error: "storage_upload_failed", detail: uploadError.message }, 400);

  const { data: documentRow, error: documentError } = await adminDb
    .from("onboarding_documents")
    .upsert(
      {
        profile_id: userId,
        document_type: documentType,
        file_path: path,
        status: "pending",
        correction_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id,document_type" },
    )
    .select()
    .single();

  if (documentError) {
    await adminDb.storage.from("onboarding-documents").remove([path]);
    return json({ error: "document_record_failed", detail: documentError.message }, 400);
  }

  if (currentDocument?.file_path && currentDocument.file_path !== path) {
    await adminDb.storage.from("onboarding-documents").remove([currentDocument.file_path]);
  }

  return json({
    data: {
      id: documentRow.id,
      document_type: documentRow.document_type,
      status: documentRow.status,
      file_path: documentRow.file_path,
    },
  });
});

function matchesSignature(bytes: Uint8Array, signature: number[]) {
  if (bytes.length < signature.length) return false;
  return signature.every((value, index) => bytes[index] === value);
}
