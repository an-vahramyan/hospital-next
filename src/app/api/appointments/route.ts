import { created, handler, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { bookSchema } from "@/lib/schemas";
import { book, getPatientByUserId } from "@/lib/services/appointment.service";

export const POST = handler(async (req) => {
  const user = await requireAuth(req, "PATIENT");
  const data = await parseBody(req, bookSchema);
  const patient = await getPatientByUserId(user.id);
  return created(await book(patient.id, data));
});
