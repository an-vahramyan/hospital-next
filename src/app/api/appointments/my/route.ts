import { handler } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getPatientByUserId, myAppointments } from "@/lib/services/appointment.service";

export const GET = handler(async (req) => {
  const user = await requireAuth(req, "PATIENT");
  const patient = await getPatientByUserId(user.id);
  return myAppointments(patient.id);
});
