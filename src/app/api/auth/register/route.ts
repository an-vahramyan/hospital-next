import { NextResponse } from "next/server";
import { handler, parseBody } from "@/lib/api";
import { setAuthCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/schemas";
import { register } from "@/lib/services/auth.service";
import { rateLimit } from "@/lib/rateLimit";

export const POST = handler(async (req) => {
  rateLimit(req, "register", 10);
  const data = await parseBody(req, registerSchema);
  const result = await register(data);
  const res = NextResponse.json(result, { status: 201 });
  setAuthCookie(res, result.token);
  return res;
});
