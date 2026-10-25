import { handler } from "@/lib/api";
import { getArticle } from "@/lib/services/catalog.service";

export const GET = handler<{ slug: string }>(async (_req, ctx) => getArticle((await ctx.params).slug));
