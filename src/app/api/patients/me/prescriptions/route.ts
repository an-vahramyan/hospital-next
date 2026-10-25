import { handler } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPatientByUserId } from "@/lib/services/appointment.service";
import { effectiveStatus } from "@/lib/services/prescription.service";

export const GET = handler(async (req) => {
  const patient = await getPatientByUserId((await requireAuth(req, "PATIENT")).id);
  const list = await prisma.prescription.findMany({
    where: { patientId: patient.id },
    include: {
      items: true,
      doctor: { include: { user: { select: { firstName: true, lastName: true } }, department: true } },
    },
    orderBy: { issuedAt: "desc" },
  });
  return list.map((p) => ({ ...p, status: effectiveStatus(p) }));
});
