import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "torqe_console_access";
const SESSION_SECONDS = 60 * 60 * 8;

function getSessionToken(secret, expiresAt) {
  const signature = createHmac("sha256", secret).update(`console:${expiresAt}`).digest("hex");
  return `${expiresAt}.${signature}`;
}

function isAuthorized(request) {
  const secret = process.env.CONSOLE_SESSION_SECRET?.trim();
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!secret || !token) return false;

  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature || !/^\d+$/.test(expiresAt) || Number(expiresAt) < Math.floor(Date.now() / 1000)) return false;

  const expected = getSessionToken(secret, expiresAt).split(".")[1];
  const actualBytes = Buffer.from(signature, "hex");
  const expectedBytes = Buffer.from(expected, "hex");
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

export async function GET(request) {
  return NextResponse.json({ authorized: isAuthorized(request) });
}

export async function POST(request) {
  const inviteCode = process.env.CONSOLE_INVITE_CODE?.trim();
  const secret = process.env.CONSOLE_SESSION_SECRET?.trim();

  if (!inviteCode || !secret || secret.length < 32) {
    return NextResponse.json({
      error: "Console invitations are not configured for this deployment. Set CONSOLE_INVITE_CODE and a CONSOLE_SESSION_SECRET of at least 32 characters in Vercel for this environment, then redeploy.",
    }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter a valid invitation code." }, { status: 400 });
  }

  const submitted = typeof body?.code === "string" ? Buffer.from(body.code.trim()) : Buffer.alloc(0);
  const expected = Buffer.from(inviteCode);
  if (submitted.length !== expected.length || !timingSafeEqual(submitted, expected)) {
    return NextResponse.json({ error: "That invitation code is not valid." }, { status: 401 });
  }

  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const response = NextResponse.json({ authorized: true });
  response.cookies.set(COOKIE_NAME, getSessionToken(secret, expiresAt), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authorized: false });
  response.cookies.set(COOKIE_NAME, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
