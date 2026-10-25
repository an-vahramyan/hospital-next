import { created, handler, idParam } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { reservePrescription } from "@/lib/services/pharmacy.service";

export const POST = handler<{ id: string }>(async (req, ctx) =>
  created(await reservePrescription(await requireAuth(req), await idParam(ctx))),
);
