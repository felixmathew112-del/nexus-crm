import { createHmac, timingSafeEqual } from "crypto";

// Pure token helpers with no next/headers or db import, so they're safe to
// use both from Route Handlers/Server Components and from proxy.ts (which
// runs on every request and should stay cheap - cookie-only, no DB hit).

export const SESSION_COOKIE = "session";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;

// Set SESSION_SECRET in production. This fallback is fine for local/demo use
// only - anyone with it can forge session cookies.
const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-only-insecure-secret-change-me";

function sign(data: string): string {
  return createHmac("sha256", SESSION_SECRET).update(data).digest("hex");
}

export function createSessionToken(userId: string): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const data = `${userId}.${expiresAt}`;
  return `${data}.${sign(data)}`;
}

export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  const signature = parts.pop();
  const data = parts.join(".");
  if (!signature || !data) return null;

  const expected = sign(data);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const [userId, expiresAtStr] = data.split(".");
  const expiresAt = Number(expiresAtStr);
  if (!userId || !expiresAt || Date.now() > expiresAt) return null;
  return userId;
}
