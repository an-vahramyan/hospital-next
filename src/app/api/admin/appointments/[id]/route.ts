import { z } from "zod";
import { handler, idParam, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  status: z.enum(["BOOKED", "CANCELLED", "COMPLETED", "NO_SHOW"]).optional(),
  notes: z.string().max(1000).optional().nullable(),
});

export const PATCH = handler<{ id: string }>(async (req, ctx) => {
  await requireAuth(req, "ADMIN");
  const data = await parseBody(req, schema);
  return prisma.appointment.update({ where: { id: await idParam(ctx) }, data });
});
