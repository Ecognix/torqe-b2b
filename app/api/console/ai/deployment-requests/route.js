import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../../../../lib/supabase/admin";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Complete the deployment request form." }, { status: 400 });
  }

  const workspaceId = body?.workspaceId;
  if (typeof workspaceId !== "string" || !/^[0-9a-f-]{36}$/i.test(workspaceId)) {
    return NextResponse.json({ error: "A valid workspace is required." }, { status: 400 });
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (membershipError) {
    console.error("Could not verify AI deployment request access:", membershipError.message);
    return NextResponse.json({ error: "Could not verify workspace access." }, { status: 500 });
  }
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Only workspace owners and admins can request a private model deployment." }, { status: 403 });
  }

  const deploymentType = body.deploymentType;
  const modelPreference = typeof body.modelPreference === "string" ? body.modelPreference.trim() : "";
  const region = typeof body.region === "string" ? body.region.trim() : "";
  const requirements = typeof body.requirements === "string" ? body.requirements.trim() : "";
  const endpoint = typeof body.endpoint === "string" ? body.endpoint.trim() : "";
  if (!["customer_hosted", "torqe_private_cloud", "private_endpoint"].includes(deploymentType)
    || !modelPreference || modelPreference.length > 128
    || !region || region.length > 100
    || requirements.length > 3000
    || endpoint.length > 500) {
    return NextResponse.json({ error: "Complete each required field using the listed length limits." }, { status: 400 });
  }
  if (deploymentType === "private_endpoint") {
    try {
      const url = new URL(endpoint);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
        throw new Error("Invalid endpoint");
      }
    } catch {
      return NextResponse.json({ error: "Enter a valid HTTP or HTTPS private endpoint without credentials or query parameters." }, { status: 400 });
    }
  } else if (endpoint) {
    return NextResponse.json({ error: "An endpoint is only required for a private endpoint request." }, { status: 400 });
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  const { data, error } = await admin
    .from("workspace_deployment_requests")
    .insert({
      organization_id: workspaceId,
      requested_by: user.id,
      contact_email: user.email || "",
      deployment_type: deploymentType,
      model_preference: modelPreference,
      region,
      endpoint: endpoint || null,
      requirements,
    })
    .select("id, status, created_at")
    .single();

  if (error) {
    console.error("Could not save private model deployment request:", error.message);
    return NextResponse.json({ error: "Could not submit the deployment request. Confirm the AI configuration migration is applied." }, { status: 500 });
  }
  return NextResponse.json({ request: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
