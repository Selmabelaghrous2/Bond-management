import { createHmac, timingSafeEqual } from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-only-insecure-secret-change-me";

if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  // Fail loudly rather than silently signing cookies with a public default.
  throw new Error(
    "SESSION_SECRET environment variable must be set in production. See .env.example."
  );
}

function sign(value: string): string {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
}

/** Packs a userId into `<userId>.<hmac>` so the cookie can't be forged or edited client-side. */
export function createSessionToken(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

/** Verifies the token's signature and returns the userId, or null if invalid/tampered. */
export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const [userId, signature] = token.split(".");
  if (!userId || !signature) return null;

  const expected = sign(userId);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return userId;
}
