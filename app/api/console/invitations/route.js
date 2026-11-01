import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../../../lib/supabase/admin";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getManager(request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };

  const organizationId = new URL(request.url).searchParams.get("workspaceId");
  if (!organizationId || !/^[0-9a-f-]{36}$/i.test(organizationId)) {
    return { response: NextResponse.json({ error: "A valid workspace is required." }, { status: 400 }) };
  }

  const { data: membership, error } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Could not verify workspace invitation permissions:", error.message);
    return { response: NextResponse.json({ error: "Could not verify workspace permissions." }, { status: 500 }) };
  }
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { response: NextResponse.json({ error: "Only workspace owners and admins can manage invitations." }, { status: 403 }) };
  }

  return { supabase, user, organizationId };
}

export async function GET(request) {
  let manager;
  try {
    manager = await getManager(request);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
  if (manager.response) return manager.response;

  const { data, error } = await manager.supabase
    .from("workspace_invitations")
    .select("id, email, role, status, created_at")
    .eq("organization_id", manager.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Could not load workspace invitations:", error.message);
    return NextResponse.json({ error: "Could not load workspace invitations." }, { status: 500 });
  }
  return NextResponse.json({ invitations: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  let manager;
  try {
    manager = await getManager(request);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
  if (manager.response) return manager.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter an email address and role." }, { status: 400 });
  }

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body?.role;
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !["admin", "operator", "viewer"].includes(role)) {
    return NextResponse.json({ error: "Enter a valid email address and workspace role." }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) {
    return NextResponse.json({ error: "Invitation email redirects are not configured. Set NEXT_PUBLIC_SITE_URL." }, { status: 503 });
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  const { data: invitation, error: insertError } = await admin
    .from("workspace_invitations")
    .insert({
      organization_id: manager.organizationId,
      email,
      role,
      invited_by: manager.user.id,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "An invitation for this email is already pending." }, { status: 409 });
    }
    console.error("Could not create workspace invitation:", insertError.message);
    return NextResponse.json({ error: "Could not create the workspace invitation." }, { status: 500 });
  }

  let redirectTo;
  try {
    const origin = new URL(siteUrl);
    if (!["https:", "http:"].includes(origin.protocol) || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) throw new Error("Invalid site URL");
    redirectTo = new URL("/auth/callback?next=%2Fset-password", origin).toString();
  } catch {
    const { error } = await admin.from("workspace_invitations").delete().eq("id", invitation.id);
    if (error) console.error("Could not clean up invalid workspace invitation:", error.message);
    return NextResponse.json({ error: "NEXT_PUBLIC_SITE_URL must be a valid HTTP or HTTPS origin." }, { status: 503 });
  }

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (inviteError) {
    const { error: cleanupError } = await admin.from("workspace_invitations").delete().eq("id", invitation.id);
    if (cleanupError) console.error("Could not remove failed workspace invitation:", cleanupError.message);
    console.error("Supabase could not send a workspace invitation:", inviteError.message);
    return NextResponse.json({ error: "Supabase could not send the invitation. Check the email configuration and try again." }, { status: 502 });
  }

  return NextResponse.json({ invited: true }, { status: 201 });
}
