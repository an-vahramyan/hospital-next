import { handler } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { pharmacyClient } from "@/lib/services/pharmacy.client";

export const dynamic = "force-dynamic";

// Do not throw — the frontend needs the online/offline status
export const GET = handler(async (req) => {
  await requireAuth(req);
  try {
    const r = await pharmacyClient.health();
    return { online: true, ...r };
  } catch (err) {
    return { online: false, error: (err as Error).message };
  }
});
