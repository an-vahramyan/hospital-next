// Wrapper for route handlers: a uniform response and error format
import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { HttpError } from "./errors";

type Ctx<P> = { params: Promise<P> };
type Handler<P> = (req: NextRequest, ctx: Ctx<P>) => Promise<Response | unknown>;

export function handler<P = Record<string, string>>(fn: Handler<P>) {
  return async (req: NextRequest, ctx: Ctx<P>) => {
    try {
      const result = await fn(req, ctx);
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function errorResponse(err: unknown) {
  if (err instanceof HttpError) {
    return NextResponse.json(
      { error: err.message, ...(err.code && { code: err.code }), ...(err.details !== undefined && { details: err.details }) },
      { status: err.status },
    );
  }
  if (err instanceof ZodError) {
    return NextResponse.json({ error: "Validation failed", details: err.flatten() }, { status: 400 });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (err.code === "P2002") return NextResponse.json({ error: "Already exists", code: "DUPLICATE", details: err.meta }, { status: 409 });
    if (err.code === "P2003") return NextResponse.json({ error: "Record is used by other records", code: "IN_USE" }, { status: 409 });
  }
  console.error(err);
  // do not show the client the details of a 500 error
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function parseBody<S extends ZodTypeAny>(req: Request, schema: S): Promise<z.infer<S>> {
  let data: unknown;
  try {
    data = await req.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
  const result = schema.safeParse(data);
  if (!result.success) throw new HttpError(400, "Validation failed", { details: result.error.flatten() });
  return result.data;
}

export function parseQuery<S extends ZodTypeAny>(req: NextRequest, schema: S): z.infer<S> {
  const obj = Object.fromEntries(req.nextUrl.searchParams.entries());
  const result = schema.safeParse(obj);
  if (!result.success) throw new HttpError(400, "Invalid query", { details: result.error.flatten() });
  return result.data;
}

export async function idParam(ctx: { params: Promise<{ id: string }> }): Promise<number> {
  const { id } = await ctx.params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, "Invalid id");
  return n;
}

export const created = (data: unknown) => NextResponse.json(data, { status: 201 });
export const noContent = () => new NextResponse(null, { status: 204 });
