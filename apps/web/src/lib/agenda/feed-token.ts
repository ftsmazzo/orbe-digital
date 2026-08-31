import { createHmac, timingSafeEqual } from "crypto";

function secret() {
  return process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me-32chars-min";
}

export function signCalendarToken(orgId: string) {
  const sig = createHmac("sha256", secret()).update(`orbe-cal:${orgId}`).digest("base64url").slice(0, 22);
  return `${orgId}.${sig}`;
}

export function verifyCalendarToken(token: string) {
  const trimmed = token.trim();
  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot < 1) return null;
  const orgId = trimmed.slice(0, lastDot);
  const sig = trimmed.slice(lastDot + 1);
  const expected = signCalendarToken(orgId).slice(orgId.length + 1);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  return orgId;
}

export function publicAppOrigin() {
  return (
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
    "https://orbe-app.kxryyk.easypanel.host"
  ).replace(/\/$/, "");
}

export function calendarSubscribeUrls(orgId: string) {
  const httpsUrl = `${publicAppOrigin()}/api/cal/${signCalendarToken(orgId)}`;
  return {
    httpsUrl,
    webcalUrl: httpsUrl.replace(/^https:/, "webcal:").replace(/^http:/, "webcal:"),
  };
}
