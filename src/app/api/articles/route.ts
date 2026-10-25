import { z } from "zod";
import { handler, parseQuery } from "@/lib/api";
import { listArticles } from "@/lib/services/catalog.service";

const query = z.object({
  lang: z.enum(["hy", "en", "ru"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const GET = handler(async (req) => {
  const { lang, page, limit } = parseQuery(req, query);
  return listArticles({ lang, page, pageSize: limit });
});
