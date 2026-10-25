import { handler } from "@/lib/api";
import { requireApiKey } from "@/lib/apiKey";

export const dynamic = "force-dynamic";

export const GET = handler(async (req) => {
  requireApiKey(req);
  return { status: "ok", service: "hospital", time: new Date().toISOString() };
});
