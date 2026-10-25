import { z } from "zod";
import { handler, parseQuery } from "@/lib/api";
import { listDoctors } from "@/lib/services/catalog.service";

const query = z.object({
  q: z.string().max(100).optional(),
  department: z.string().max(60).optional(),
  specialty: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const GET = handler(async (req) => {
  const { limit, ...rest } = parseQuery(req, query);
  return listDoctors({ ...rest, take: limit });
});
