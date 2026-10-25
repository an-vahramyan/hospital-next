// Простейший in-memory rate limit (по IP)
import type { NextRequest } from "next/server";
import { HttpError } from "./errors";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(req: NextRequest, key: string, limit = 20, windowMs = 60_000) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
  const id = `${key}:${ip}`;
  const now = Date.now();
  const b = buckets.get(id);
  if (!b || b.resetAt < now) {
    buckets.set(id, { count: 1, resetAt: now + windowMs });
    return;
  }
  b.count++;
  if (b.count > limit) throw new HttpError(429, "Too many requests, try again later");
}
