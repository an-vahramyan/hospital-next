import { created, handler, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { prescriptionSchema } from "@/lib/schemas";
import { createPrescription } from "@/lib/services/prescription.service";

// Выписать рецепт (врач — от своего имени, админ — указывает doctorId)
export const POST = handler(async (req) => {
  const user = await requireAuth(req, "DOCTOR", "ADMIN");
  const data = await parseBody(req, prescriptionSchema);
  let doctorId = data.doctorId;
  if (user.role === "DOCTOR") {
    const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
    if (!doctor) throw new HttpError(403, "Doctor profile not found");
    doctorId = doctor.id;
  }
  if (!doctorId) throw new HttpError(400, "doctorId is required");
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
  if (!patient) throw new HttpError(404, "Patient not found");
  return created(await createPrescription({ ...data, doctorId }));
});
