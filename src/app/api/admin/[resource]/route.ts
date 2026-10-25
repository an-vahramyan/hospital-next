import { created, handler, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { getResource } from "@/lib/admin/resources";

type P = { resource: string };

export const GET = handler<P>(async (req, ctx) => {
  await requireAuth(req, "ADMIN");
  const r = getResource((await ctx.params).resource);
  return r.delegate().findMany({ include: r.include, orderBy: r.orderBy });
});

export const POST = handler<P>(async (req, ctx) => {
  await requireAuth(req, "ADMIN");
  const r = getResource((await ctx.params).resource);
  const data = await parseBody(req, r.schema);
  return created(await r.delegate().create({ data, include: r.include }));
});
