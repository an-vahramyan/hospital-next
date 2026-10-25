// Аутентификация в route handlers и server components
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { HttpError } from "./errors";
import { TOKEN_COOKIE, verifyToken, type Role, type SessionUser } from "./session";

export type { Role, SessionUser };

/** Токен берём из "Authorization: Bearer ..." или из httpOnly cookie */
export async function getSessionUser(req?: NextRequest): Promise<SessionUser | null> {
  let token: string | undefined;
  const header = req?.headers.get("authorization");
  if (header?.startsWith("Bearer ")) token = header.slice(7);
  if (!token) token = req ? req.cookies.get(TOKEN_COOKIE)?.value : (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(req: NextRequest, ...roles: Role[]): Promise<SessionUser> {
  const user = await getSessionUser(req);
  if (!user) throw new HttpError(401, "Unauthorized");
  if (roles.length && !roles.includes(user.role)) throw new HttpError(403, "Forbidden");
  return user;
}

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(TOKEN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
