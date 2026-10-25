// Реестр ресурсов для универсального CRUD (admin)
import type { ZodObject, ZodRawShape } from "zod";
import { prisma } from "../db";
import { HttpError } from "../errors";
import { articleSchema, departmentSchema, equipmentSchema, serviceSchema } from "../schemas";

type Delegate = {
  findMany: (args?: object) => Promise<unknown[]>;
  findUnique: (args: object) => Promise<unknown | null>;
  create: (args: object) => Promise<unknown>;
  update: (args: object) => Promise<unknown>;
  delete: (args: object) => Promise<unknown>;
};

type Resource = {
  delegate: () => Delegate;
  schema: ZodObject<ZodRawShape>;
  include?: object;
  orderBy?: object;
};

export const resources: Record<string, Resource> = {
  services: {
    delegate: () => prisma.service as unknown as Delegate,
    schema: serviceSchema as unknown as ZodObject<ZodRawShape>,
    include: { department: { select: { id: true, name: true, slug: true } } },
    orderBy: { id: "asc" },
  },
  equipment: {
    delegate: () => prisma.equipment as unknown as Delegate,
    schema: equipmentSchema as unknown as ZodObject<ZodRawShape>,
    orderBy: { id: "asc" },
  },
  articles: {
    delegate: () => prisma.article as unknown as Delegate,
    schema: articleSchema as unknown as ZodObject<ZodRawShape>,
    orderBy: { publishedAt: "desc" },
  },
  departments: {
    delegate: () => prisma.department as unknown as Delegate,
    schema: departmentSchema as unknown as ZodObject<ZodRawShape>,
    include: { _count: { select: { doctors: true, services: true } } },
    orderBy: { id: "asc" },
  },
};

export function getResource(name: string): Resource {
  const r = resources[name];
  if (!r) throw new HttpError(404, `Unknown resource: ${name}`);
  return r;
}
