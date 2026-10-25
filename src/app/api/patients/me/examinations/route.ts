import { handler } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPatientByUserId } from "@/lib/services/appointment.service";

export const GET = handler(async (req) => {
  const patient = await getPatientByUserId((await requireAuth(req, "PATIENT")).id);
  return prisma.examination.findMany({ where: { patientId: patient.id }, orderBy: { orderedAt: "desc" } });
});
