// X-API-Key check for pharmacy requests (service-to-service)
import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { HttpError } from "./errors";
import { config } from "./config";

export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb) && a.length === b.length;
}

export function requireApiKey(req: NextRequest) {
  const key = req.headers.get("x-api-key") || "";
  if (!config.integrationApiKey || !key || !safeEqual(key, config.integrationApiKey)) {
    throw new HttpError(401, "Invalid or missing API key", { code: "UNAUTHORIZED" });
  }
}
