import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(token, secret) {
  if (!token || !secret) return false;
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature || !/^\d+$/.test(expiresAt) || Number(expiresAt) < Math.floor(Date.now() / 1000)) return false;
  const expected = createHmac("sha256", secret).update(`console:${expiresAt}`).digest("hex");
  const actualBytes = Buffer.from(signature, "hex");
  const expectedBytes = Buffer.from(expected, "hex");
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

export async function GET() {
  const cookieStore = await cookies();
  if (!isAuthorized(cookieStore.get("torqe_console_access")?.value, process.env.CONSOLE_SESSION_SECRET?.trim())) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return NextResponse.json({
    supabase: { configured: supabaseConfigured },
    model: { configured: Boolean(process.env.NVIDIA_API_KEY) },
    workspace: "Torqe preview workspace",
  });
}
