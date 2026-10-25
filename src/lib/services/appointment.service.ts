import { prisma } from "../db";
import { HttpError } from "../errors";
import { addMinutes, buildDaySlots, dayRange } from "../date";

export { buildDaySlots };

export async function getPatientByUserId(userId: number) {
  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) throw new HttpError(403, "Patient profile not found");
  return patient;
}

export async function getDoctorByUserId(userId: number) {
  const doctor = await prisma.doctor.findUnique({ where: { userId }, include: { department: true } });
  if (!doctor) throw new HttpError(403, "Doctor profile not found");
  return doctor;
}

export async function getAvailableSlots(doctorId: number, dateStr: string): Promise<string[]> {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) throw new HttpError(404, "Doctor not found");

  const { start, end } = dayRange(dateStr);
  const booked = await prisma.appointment.findMany({
    where: { doctorId, status: "BOOKED", startsAt: { gte: start, lt: end } },
    select: { startsAt: true },
  });
  const taken = new Set(booked.map((a) => a.startsAt.getTime()));
  const now = Date.now();

  return buildDaySlots(dateStr, doctor.workStart, doctor.workEnd, doctor.slotMinutes)
    .filter((s) => s.getTime() > now && !taken.has(s.getTime()))
    .map((s) => s.toISOString());
}

export async function book(
  patientId: number,
  data: { doctorId: number; serviceId?: number | null; startsAt: string; notes?: string | null },
) {
  const doctor = await prisma.doctor.findUnique({ where: { id: data.doctorId } });
  if (!doctor) throw new HttpError(404, "Doctor not found");

  const startsAt = new Date(data.startsAt);
  if (Number.isNaN(startsAt.getTime())) throw new HttpError(400, "Invalid startsAt");
  if (startsAt.getTime() <= Date.now()) throw new HttpError(400, "Cannot book in the past");

  // время должно совпадать с одним из слотов графика
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${startsAt.getFullYear()}-${pad(startsAt.getMonth() + 1)}-${pad(startsAt.getDate())}`;
  const valid = buildDaySlots(dateStr, doctor.workStart, doctor.workEnd, doctor.slotMinutes).some(
    (s) => s.getTime() === startsAt.getTime(),
  );
  if (!valid) throw new HttpError(400, "Time is outside of the doctor's schedule", { code: "INVALID_SLOT" });

  if (data.serviceId) {
    const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!service) throw new HttpError(404, "Service not found");
  }

  const endsAt = addMinutes(startsAt, doctor.slotMinutes);

  // транзакция: проверка + создание, чтобы двое не заняли одно время
  return prisma.$transaction(async (tx) => {
    const clash = await tx.appointment.findFirst({
      where: { doctorId: doctor.id, status: "BOOKED", startsAt },
    });
    if (clash) throw new HttpError(409, "This time slot is already booked", { code: "SLOT_TAKEN" });

    const ownClash = await tx.appointment.findFirst({
      where: { patientId, status: "BOOKED", startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
    });
    if (ownClash) throw new HttpError(409, "You already have an appointment at this time", { code: "PATIENT_BUSY" });

    return tx.appointment.create({
      data: {
        patientId,
        doctorId: doctor.id,
        serviceId: data.serviceId ?? null,
        startsAt,
        endsAt,
        notes: data.notes || null,
      },
      include: appointmentInclude,
    });
  });
}

export const appointmentInclude = {
  doctor: { include: { user: { select: { firstName: true, lastName: true } }, department: true } },
  service: true,
} as const;

export async function myAppointments(patientId: number) {
  return prisma.appointment.findMany({
    where: { patientId },
    include: appointmentInclude,
    orderBy: { startsAt: "desc" },
  });
}

export async function cancel(userId: number, appointmentId: number) {
  const patient = await getPatientByUserId(userId);
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt || appt.patientId !== patient.id) throw new HttpError(404, "Appointment not found");
  if (appt.status !== "BOOKED") throw new HttpError(400, "Only booked appointments can be cancelled");
  if (appt.startsAt.getTime() <= Date.now()) throw new HttpError(400, "Past appointments cannot be cancelled");
  return prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED" },
    include: appointmentInclude,
  });
}

export async function doctorSchedule(doctorId: number, dateStr: string) {
  const { start, end } = dayRange(dateStr);
  return prisma.appointment.findMany({
    where: { doctorId, startsAt: { gte: start, lt: end } },
    include: {
      service: true,
      patient: {
        include: { user: { select: { firstName: true, lastName: true, phone: true, email: true } } },
      },
    },
    orderBy: { startsAt: "asc" },
  });
}
