import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const verificationType = requestUrl.searchParams.get("type");
  const nextPath = requestUrl.searchParams.get("next");
  const next = nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";

  if (code || (tokenHash && verificationType === "invite")) {
    const supabase = await createSupabaseServerClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "invite" });
    if (!error) {
      if (next === "/set-password") {
        const { error: inviteError } = await supabase.rpc("accept_console_invitations");
        if (inviteError) {
          console.error("Could not accept Console workspace invitations:", inviteError.message);
          return NextResponse.redirect(new URL("/?authError=setup", requestUrl.origin));
        }
      }
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
    console.error("Supabase invitation callback failed:", error.message);
  }

  return NextResponse.redirect(new URL("/?authError=invite", requestUrl.origin));
}
