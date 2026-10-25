import { z } from "zod";
import { handler, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { pharmacyItemSchema } from "@/lib/schemas";
import { checkCustomList } from "@/lib/services/pharmacy.service";

const schema = z.object({ items: z.array(pharmacyItemSchema).min(1).max(30) });

export const POST = handler(async (req) => {
  const user = await requireAuth(req, "DOCTOR", "ADMIN");
  const { items } = await parseBody(req, schema);
  return checkCustomList(user, items);
});
