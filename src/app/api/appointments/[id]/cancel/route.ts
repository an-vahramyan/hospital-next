import { handler, idParam } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { cancel } from "@/lib/services/appointment.service";

export const PATCH = handler<{ id: string }>(async (req, ctx) => {
  const user = await requireAuth(req, "PATIENT");
  return cancel(user.id, await idParam(ctx));
});
