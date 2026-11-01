import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const organizationId = new URL(request.url).searchParams.get("workspaceId");
  if (!organizationId || !/^[0-9a-f-]{36}$/i.test(organizationId)) {
    return NextResponse.json({ error: "A valid workspace is required." }, { status: 400 });
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    console.error("Could not verify workspace data access:", membershipError.message);
    return NextResponse.json({ error: "Could not verify workspace access." }, { status: 500 });
  }
  if (!membership) return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });

  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select("id, contact_name, company, channel, status, assigned_to, agent_paused, metadata, created_at, updated_at")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (conversationsError) {
    console.error("Could not load workspace conversations:", conversationsError.message);
    return NextResponse.json({ error: "Could not load workspace conversations." }, { status: 500 });
  }

  const conversationIds = (conversations || []).map((conversation) => conversation.id);
  const [messagesResult, approvalsResult, activityResult, settingsResult, integrationsResult] = await Promise.all([
    conversationIds.length
      ? supabase.from("messages").select("id, conversation_id, sender_type, body, created_at").eq("organization_id", organizationId).in("conversation_id", conversationIds).order("created_at", { ascending: false }).limit(1000)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("approvals").select("id, conversation_id, action_type, title, draft, status, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100),
    supabase.from("audit_logs").select("id, action, resource_type, resource_id, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100),
    supabase.from("agent_settings").select("autopilot_enabled, instructions, approval_rules, model_provider, model_name").eq("organization_id", organizationId).maybeSingle(),
    supabase.from("integrations").select("provider, status, updated_at").eq("organization_id", organizationId),
  ]);

  const failedResult = [messagesResult, approvalsResult, activityResult, settingsResult, integrationsResult].find((result) => result.error);
  if (failedResult) {
    console.error("Could not load Console workspace data:", failedResult.error.message);
    return NextResponse.json({ error: "Could not load all workspace data." }, { status: 500 });
  }

  return NextResponse.json({
    conversations: conversations || [],
    messages: messagesResult.data || [],
    approvals: approvalsResult.data || [],
    activity: activityResult.data || [],
    settings: settingsResult.data,
    integrations: integrationsResult.data || [],
    role: membership.role,
  }, { headers: { "Cache-Control": "no-store" } });
}
