// Защита страниц по ролям (API-маршруты проверяют права сами)
import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_COOKIE, homeFor, verifyToken, type Role } from "@/lib/session";

const rules: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/doctor-cabinet", roles: ["DOCTOR"] },
  { prefix: "/patient", roles: ["PATIENT"] },
  { prefix: "/book", roles: ["PATIENT"] },
];

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const rule = rules.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
  if (!rule) return NextResponse.next();

  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (!rule.roles.includes(user.role)) return NextResponse.redirect(new URL(homeFor(user.role), req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/doctor-cabinet/:path*", "/patient/:path*", "/book"],
};
