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
    return NextResponse.json({ error: "Choose an approval decision." }, { status: 400 });
  }
  if (!["approved", "rejected", "edited"].includes(body?.status)) {
    return NextResponse.json({ error: "Choose a valid approval decision." }, { status: 400 });
  }

  const { approvalId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(approvalId || "")) return NextResponse.json({ error: "Invalid approval." }, { status: 400 });

  const { data, error } = await supabase
    .from("approvals")
    .update({ status: body.status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", approvalId)
    .eq("status", "pending")
    .select("id, status, reviewed_at")
    .maybeSingle();

  if (error) {
    console.error("Could not update approval:", error.message);
    return NextResponse.json({ error: "Could not update this approval. Check your workspace role." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "This approval is no longer pending or is not accessible to your workspace." }, { status: 404 });
  return NextResponse.json({ approval: data }, { headers: { "Cache-Control": "no-store" } });
}
