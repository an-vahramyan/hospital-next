import { handler, idParam, noContent, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { getResource } from "@/lib/admin/resources";

type P = { resource: string; id: string };

export const GET = handler<P>(async (req, ctx) => {
  await requireAuth(req, "ADMIN");
  const r = getResource((await ctx.params).resource);
  const item = await r.delegate().findUnique({ where: { id: await idParam(ctx) }, include: r.include });
  if (!item) throw new HttpError(404, "Not found");
  return item;
});

export const PUT = handler<P>(async (req, ctx) => {
  await requireAuth(req, "ADMIN");
  const r = getResource((await ctx.params).resource);
  const data = await parseBody(req, r.schema.partial());
  return r.delegate().update({ where: { id: await idParam(ctx) }, data, include: r.include });
});

export const DELETE = handler<P>(async (req, ctx) => {
  await requireAuth(req, "ADMIN");
  const r = getResource((await ctx.params).resource);
  await r.delegate().delete({ where: { id: await idParam(ctx) } });
  return noContent();
});
