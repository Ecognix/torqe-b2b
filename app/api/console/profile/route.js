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
    return NextResponse.json({ error: "Enter a profile name." }, { status: 400 });
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (name.length < 2 || name.length > 80) return NextResponse.json({ error: "Your name must be 2–80 characters." }, { status: 400 });

  const { data, error } = await supabase.auth.updateUser({ data: { ...user.user_metadata, full_name: name } });
  if (error) {
    console.error("Could not update Console profile:", error.message);
    return NextResponse.json({ error: "Could not save your profile." }, { status: 500 });
  }
  return NextResponse.json({ user: { id: data.user.id, email: data.user.email, name } }, { headers: { "Cache-Control": "no-store" } });
}
