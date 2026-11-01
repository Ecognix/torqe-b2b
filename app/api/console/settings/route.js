import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request) {
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
    return NextResponse.json({ error: "Invalid workspace settings." }, { status: 400 });
  }

  const organizationId = body?.workspaceId;
  if (typeof organizationId !== "string" || !/^[0-9a-f-]{36}$/i.test(organizationId)) {
    return NextResponse.json({ error: "A valid workspace is required." }, { status: 400 });
  }
  const updates = {};
  if (typeof body.instructions === "string") {
    if (body.instructions.length > 12000) return NextResponse.json({ error: "Instructions must be 12,000 characters or fewer." }, { status: 400 });
    updates.instructions = body.instructions;
  }
  if (typeof body.autopilot_enabled === "boolean") updates.autopilot_enabled = body.autopilot_enabled;
  if (!Object.keys(updates).length) return NextResponse.json({ error: "No supported settings were provided." }, { status: 400 });
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("agent_settings")
    .update(updates)
    .eq("organization_id", organizationId)
    .select("autopilot_enabled, instructions")
    .maybeSingle();

  if (error) {
    console.error("Could not update workspace agent settings:", error.message);
    return NextResponse.json({ error: "Could not save workspace settings. Check your workspace role." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "You do not have permission to change these workspace settings." }, { status: 403 });
  return NextResponse.json({ settings: data }, { headers: { "Cache-Control": "no-store" } });
}
