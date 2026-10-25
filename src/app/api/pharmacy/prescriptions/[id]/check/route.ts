import { handler, idParam } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { checkPrescriptionAvailability } from "@/lib/services/pharmacy.service";

export const POST = handler<{ id: string }>(async (req, ctx) =>
  checkPrescriptionAvailability(await requireAuth(req), await idParam(ctx)),
);
