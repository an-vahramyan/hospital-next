import { handler } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getHistory } from "@/lib/services/pharmacy.service";

export const GET = handler(async (req) => getHistory(await requireAuth(req)));
