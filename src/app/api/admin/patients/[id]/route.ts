import { handler, idParam } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { prisma } from "@/lib/db";

const doctorName = { include: { user: { select: { firstName: true, lastName: true } } } } as const;

// Full patient history
export const GET = handler<{ id: string }>(async (req, ctx) => {
  await requireAuth(req, "ADMIN");
  const p = await prisma.patient.findUnique({
    where: { id: await idParam(ctx) },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, language: true, createdAt: true } },
      appointments: { include: { doctor: doctorName, service: true }, orderBy: { startsAt: "desc" } },
      visits: { include: { doctor: doctorName }, orderBy: { date: "desc" } },
      prescriptions: { include: { items: true, doctor: doctorName }, orderBy: { issuedAt: "desc" } },
      examinations: { orderBy: { orderedAt: "desc" } },
      notifications: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!p) throw new HttpError(404, "Patient not found");
  return p;
});
