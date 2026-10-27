// JWT (jose) — works in both Node and proxy.ts
import { SignJWT, jwtVerify } from "jose";

export type Role = "PATIENT" | "DOCTOR" | "ADMIN";
export type SessionUser = { id: number; role: Role; email: string };

export const TOKEN_COOKIE = "token";

const secret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || "dev-only-secret-change-me");

export async function signToken(user: SessionUser, expiresIn = process.env.JWT_EXPIRES_IN || "7d") {
  return new SignJWT({ role: user.role, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret());
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return { id: Number(payload.sub), role: payload.role as Role, email: String(payload.email) };
  } catch {
    return null;
  }
}

export const homeFor = (role: Role) => (role === "ADMIN" ? "/admin" : role === "DOCTOR" ? "/doctor-cabinet" : "/patient");
