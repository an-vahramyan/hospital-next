import { handler } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPatientByUserId } from "@/lib/services/appointment.service";

export const GET = handler(async (req) => {
  const patient = await getPatientByUserId((await requireAuth(req, "PATIENT")).id);
  return prisma.visit.findMany({
    where: { patientId: patient.id },
    include: { doctor: { include: { user: { select: { firstName: true, lastName: true } }, department: true } } },
    orderBy: { date: "desc" },
  });
});
