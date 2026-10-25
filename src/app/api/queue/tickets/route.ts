import { z } from "zod";
import { created, handler, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { takeTicket } from "@/lib/services/queue.service";

const schema = z.object({ departmentId: z.coerce.number().int().positive() });

export const POST = handler(async (req) => {
  const user = await requireAuth(req);
  const { departmentId } = await parseBody(req, schema);
  const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
  return created(await takeTicket({ departmentId, patientId: patient?.id ?? null }));
});
