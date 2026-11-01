import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

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
    return NextResponse.json({ error: "Enter a workspace name." }, { status: 400 });
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: "Workspace names must be 2–80 characters." }, { status: 400 });
  }

  const { data: id, error } = await supabase.rpc("create_console_workspace", { workspace_name: name });
  if (error) {
    console.error("Could not create Console workspace:", error.message);
    return NextResponse.json({ error: "Could not create the workspace. Confirm the Console database migration is applied." }, { status: 500 });
  }

  return NextResponse.json({ workspace: { id, name, role: "owner" } }, { status: 201 });
}
