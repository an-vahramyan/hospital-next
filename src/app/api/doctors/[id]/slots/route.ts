import { handler, idParam } from "@/lib/api";
import { HttpError } from "@/lib/errors";
import { isDateString } from "@/lib/date";
import { getAvailableSlots } from "@/lib/services/appointment.service";

export const GET = handler<{ id: string }>(async (req, ctx) => {
  const id = await idParam(ctx);
  const date = req.nextUrl.searchParams.get("date") || "";
  if (!isDateString(date)) throw new HttpError(400, "date=YYYY-MM-DD is required");
  return { date, slots: await getAvailableSlots(id, date) };
});
