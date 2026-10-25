import type { Prisma } from "@prisma/client";
import { handler } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dayRange, isDateString } from "@/lib/date";

export const GET = handler(async (req) => {
  await requireAuth(req, "ADMIN");
  const sp = req.nextUrl.searchParams;
  const where: Prisma.AppointmentWhereInput = {};
  const date = sp.get("date");
  if (date && isDateString(date)) {
    const { start, end } = dayRange(date);
    where.startsAt = { gte: start, lt: end };
  }
  if (sp.get("doctorId")) where.doctorId = Number(sp.get("doctorId"));
  if (sp.get("status")) where.status = sp.get("status")!;
  return prisma.appointment.findMany({
    where,
    include: {
      patient: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
      doctor: { include: { user: { select: { firstName: true, lastName: true } }, department: true } },
      service: true,
    },
    orderBy: { startsAt: date ? "asc" : "desc" },
    take: 300,
  });
});
