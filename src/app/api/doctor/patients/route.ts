import { handler } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDoctorByUserId } from "@/lib/services/appointment.service";

// Doctor's patients (those who booked with them) — with prescriptions and examinations
export const GET = handler(async (req) => {
  const doctor = await getDoctorByUserId((await requireAuth(req, "DOCTOR")).id);
  return prisma.patient.findMany({
    where: { appointments: { some: { doctorId: doctor.id } } },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      examinations: { orderBy: { orderedAt: "desc" }, take: 10 },
      prescriptions: { where: { doctorId: doctor.id }, include: { items: true }, orderBy: { issuedAt: "desc" }, take: 5 },
    },
  });
});
