import { handler, idParam } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { callNext } from "@/lib/services/queue.service";

export const POST = handler<{ id: string }>(async (req, ctx) => {
  await requireAuth(req, "DOCTOR", "ADMIN");
  return callNext(await idParam(ctx));
});
