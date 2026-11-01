import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations!inner(id, name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (membershipError) {
    console.error("Could not load Console workspaces:", membershipError.message);
    return NextResponse.json({ error: "Could not load your workspaces." }, { status: 500 });
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.user_metadata?.full_name || "" },
    workspaces: (memberships || []).map((membership) => ({
      id: membership.organizations.id,
      name: membership.organizations.name,
      role: membership.role,
    })),
    supabase: { configured: true },
    model: { configured: Boolean(process.env.NVIDIA_API_KEY) },
  }, { headers: { "Cache-Control": "no-store" } });
}
