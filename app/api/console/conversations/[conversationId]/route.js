import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
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
    return NextResponse.json({ error: "Invalid conversation update." }, { status: 400 });
  }

  const { conversationId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(conversationId || "") || typeof body?.workspaceId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.workspaceId) || typeof body?.agent_paused !== "boolean") {
    return NextResponse.json({ error: "A valid workspace and pause setting are required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("conversations")
    .update({ agent_paused: body.agent_paused })
    .eq("id", conversationId)
    .eq("organization_id", body.workspaceId)
    .select("id, agent_paused")
    .maybeSingle();

  if (error) {
    console.error("Could not update conversation controls:", error.message);
    return NextResponse.json({ error: "Could not update conversation controls. Check your workspace role." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Conversation not found in this workspace." }, { status: 404 });
  return NextResponse.json({ conversation: data }, { headers: { "Cache-Control": "no-store" } });
}
