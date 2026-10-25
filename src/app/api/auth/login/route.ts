import { NextResponse } from "next/server";
import { handler, parseBody } from "@/lib/api";
import { setAuthCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/schemas";
import { login } from "@/lib/services/auth.service";
import { rateLimit } from "@/lib/rateLimit";

export const POST = handler(async (req) => {
  rateLimit(req, "login", 20);
  const result = await login(await parseBody(req, loginSchema));
  const res = NextResponse.json(result);
  setAuthCookie(res, result.token);
  return res;
});
