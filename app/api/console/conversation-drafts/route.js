import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isUuid = (value) => typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);

async function getContext(request) {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    return { response: NextResponse.json({ error: error.message }, { status: 503 }) };
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const conversationId = url.searchParams.get("conversationId");
  if (!isUuid(workspaceId) || !isUuid(conversationId)) {
    return { response: NextResponse.json({ error: "A valid workspace and conversation are required." }, { status: 400 }) };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("organization_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (membershipError) {
    console.error("Could not verify conversation draft access:", membershipError.message);
    return { response: NextResponse.json({ error: "Could not verify workspace access." }, { status: 500 }) };
  }
  if (!membership) return { response: NextResponse.json({ error: "Workspace access denied." }, { status: 403 }) };

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id")
    .eq("organization_id", workspaceId)
    .eq("id", conversationId)
    .maybeSingle();
  if (conversationError) {
    console.error("Could not verify conversation draft target:", conversationError.message);
    return { response: NextResponse.json({ error: "Could not verify this conversation." }, { status: 500 }) };
  }
  if (!conversation) return { response: NextResponse.json({ error: "Conversation not found in this workspace." }, { status: 404 }) };

  return { supabase, user, workspaceId, conversationId };
}

export async function GET(request) {
  const context = await getContext(request);
  if (context.response) return context.response;

  const { data, error } = await context.supabase
    .from("conversation_drafts")
    .select("body, updated_at")
    .eq("organization_id", context.workspaceId)
    .eq("conversation_id", context.conversationId)
    .eq("user_id", context.user.id)
    .maybeSingle();
  if (error) {
    console.error("Could not load conversation draft:", error.message);
    return NextResponse.json({ error: "Could not load this draft. Confirm the conversation-drafts migration is applied." }, { status: 500 });
  }

  return NextResponse.json({ draft: data || { body: "", updated_at: null } }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request) {
  const context = await getContext(request);
  if (context.response) return context.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter a draft before saving." }, { status: 400 });
  }

  if (typeof body?.body !== "string" || body.body.length > 10000) {
    return NextResponse.json({ error: "Drafts must be 10,000 characters or fewer." }, { status: 400 });
  }

  const updatedAt = new Date().toISOString();
  const { data, error } = await context.supabase
    .from("conversation_drafts")
    .upsert({
      organization_id: context.workspaceId,
      conversation_id: context.conversationId,
      user_id: context.user.id,
      body: body.body,
      updated_at: updatedAt,
    }, { onConflict: "organization_id,conversation_id,user_id" })
    .select("body, updated_at")
    .single();
  if (error) {
    console.error("Could not save conversation draft:", error.message);
    return NextResponse.json({ error: "Could not save this draft. Confirm the conversation-drafts migration is applied." }, { status: 500 });
  }

  return NextResponse.json({ draft: data }, { headers: { "Cache-Control": "no-store" } });
}
