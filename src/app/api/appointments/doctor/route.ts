import { handler } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { isDateString, toLocalDateString } from "@/lib/date";
import { doctorSchedule, getDoctorByUserId } from "@/lib/services/appointment.service";

// Расписание врача на день
export const GET = handler(async (req) => {
  const user = await requireAuth(req, "DOCTOR");
  const date = req.nextUrl.searchParams.get("date") || toLocalDateString();
  if (!isDateString(date)) throw new HttpError(400, "date=YYYY-MM-DD");
  const doctor = await getDoctorByUserId(user.id);
  return { date, doctor, appointments: await doctorSchedule(doctor.id, date) };
});
