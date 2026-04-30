import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const protectedPrefixes = ["/investments", "/api/investments"];

function isProtected(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function unauthorized(message = "Authentication required") {
  return new NextResponse(message, {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Investment Research Agent", charset="UTF-8"' },
  });
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export function proxy(req: NextRequest) {
  if (!isProtected(req.nextUrl.pathname)) return NextResponse.next();

  const user = process.env.INVESTMENTS_AUTH_USER;
  const pass = process.env.INVESTMENTS_AUTH_PASSWORD;

  // Local dev stays frictionless. Production should fail closed if auth is not configured.
  if (!user || !pass) {
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return new NextResponse("Investment app auth is not configured", { status: 503 });
  }

  const header = req.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return unauthorized();

  try {
    const decoded = atob(header.slice("Basic ".length));
    const index = decoded.indexOf(":");
    const incomingUser = decoded.slice(0, index);
    const incomingPass = decoded.slice(index + 1);
    if (timingSafeEqual(incomingUser, user) && timingSafeEqual(incomingPass, pass)) return NextResponse.next();
  } catch {
    // handled below
  }

  return unauthorized("Invalid credentials");
}

export const config = {
  matcher: ["/investments/:path*", "/api/investments/:path*"],
};
