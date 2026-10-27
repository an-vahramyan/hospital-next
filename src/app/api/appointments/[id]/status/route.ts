import { handler, idParam, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { appointmentStatusSchema } from "@/lib/schemas";

// The doctor (own appointments) or an admin changes the status. COMPLETED + diagnosis → a Visit is created
export const PATCH = handler<{ id: string }>(async (req, ctx) => {
  const user = await requireAuth(req, "DOCTOR", "ADMIN");
  const id = await idParam(ctx);
  const data = await parseBody(req, appointmentStatusSchema);
  const appt = await prisma.appointment.findUnique({ where: { id }, include: { doctor: true } });
  if (!appt) throw new HttpError(404, "Appointment not found");
  if (user.role === "DOCTOR" && appt.doctor.userId !== user.id) throw new HttpError(403, "Forbidden");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.appointment.update({ where: { id }, data: { status: data.status } });
    if (data.status === "COMPLETED" && (data.diagnosis || data.visitNotes)) {
      await tx.visit.create({
        data: {
          patientId: appt.patientId,
          doctorId: appt.doctorId,
          date: appt.startsAt,
          diagnosis: data.diagnosis || null,
          notes: data.visitNotes || null,
        },
      });
    }
    return updated;
  });
});
