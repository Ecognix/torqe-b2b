import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    return NextResponse.json({ authorized: false, error: error.message }, { status: 503 });
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    if (error.name !== "AuthSessionMissingError") {
      console.error("Could not verify the Console session:", error.message);
      return NextResponse.json({ authorized: false, error: "Could not verify your session. Please try again." }, { status: 503 });
    }
  }

  return NextResponse.json({ authorized: Boolean(user), user: user ? { id: user.id, email: user.email } : null });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter your invitation email and password." }, { status: 400 });
  }

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 256) {
    return NextResponse.json({ error: "Enter a valid email address and password." }, { status: 400 });
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.warn("Console sign-in was rejected:", error.message);
    return NextResponse.json({ error: "Sign-in failed. Check your credentials and accept your workspace invitation first." }, { status: 401 });
  }

  return NextResponse.json({ authorized: true });
}

export async function DELETE() {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Could not sign out of the Console:", error.message);
    return NextResponse.json({ error: "Could not sign out. Please try again." }, { status: 503 });
  }

  return NextResponse.json({ authorized: false });
}
