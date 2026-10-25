import { handler } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dayRange, toLocalDateString } from "@/lib/date";

export const dynamic = "force-dynamic";

export const GET = handler(async (req) => {
  await requireAuth(req, "ADMIN");
  const { start, end } = dayRange(toLocalDateString());
  const [patients, doctors, todayAppointments, equipment, departments, articles, pendingPharmacy, today] = await Promise.all([
    prisma.patient.count(),
    prisma.doctor.count(),
    prisma.appointment.count({ where: { startsAt: { gte: start, lt: end }, status: { not: "CANCELLED" } } }),
    prisma.equipment.count({ where: { status: "ACTIVE" } }),
    prisma.department.count(),
    prisma.article.count({ where: { isPublished: true } }),
    prisma.pharmacyRequest.count({ where: { status: "FAILED" } }),
    prisma.appointment.findMany({
      where: { startsAt: { gte: start, lt: end } },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true } } } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } }, department: true } },
        service: true,
      },
      orderBy: { startsAt: "asc" },
    }),
  ]);
  return { patients, doctors, todayAppointments, equipment, departments, articles, failedPharmacyRequests: pendingPharmacy, today };
});
