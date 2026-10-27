// Public data (used by both the API and server components)
import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { HttpError } from "../errors";

export const doctorPublicInclude = {
  user: { select: { firstName: true, lastName: true } },
  department: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.DoctorInclude;

export async function listDoctors(params: { q?: string; department?: string; specialty?: string; take?: number } = {}) {
  const where: Prisma.DoctorWhereInput = {};
  const q = params.q?.trim();
  if (q) {
    // SQLite: contains is case-sensitive for non-ASCII, so we search several variants
    const variants = Array.from(new Set([q, q.toLowerCase(), q[0].toUpperCase() + q.slice(1).toLowerCase()]));
    where.OR = variants.flatMap((v) => [
      { user: { firstName: { contains: v } } },
      { user: { lastName: { contains: v } } },
      { specialty: { contains: v } },
    ]);
  }
  if (params.department) where.department = { slug: params.department };
  if (params.specialty) where.specialty = { contains: params.specialty };
  return prisma.doctor.findMany({
    where,
    include: doctorPublicInclude,
    orderBy: [{ experienceYears: "desc" }, { id: "asc" }],
    take: params.take,
  });
}

export async function getDoctor(id: number) {
  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: {
      ...doctorPublicInclude,
      department: { include: { services: { orderBy: { price: "asc" } } } },
    },
  });
  if (!doctor) throw new HttpError(404, "Doctor not found");
  return doctor;
}

export const listDepartments = () =>
  prisma.department.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { doctors: true, services: true } } },
  });

export const listServices = (department?: string, take?: number) =>
  prisma.service.findMany({
    where: department ? { department: { slug: department } } : {},
    include: { department: { select: { id: true, name: true, slug: true } } },
    orderBy: [{ departmentId: "asc" }, { price: "asc" }],
    take,
  });

export async function getService(id: number) {
  const s = await prisma.service.findUnique({ where: { id }, include: { department: true } });
  if (!s) throw new HttpError(404, "Service not found");
  return s;
}

export const listEquipment = (opts: { onlyNew?: boolean; take?: number } = {}) =>
  prisma.equipment.findMany({
    where: { status: "ACTIVE", ...(opts.onlyNew && { isNew: true }) },
    orderBy: [{ isNew: "desc" }, { acquiredAt: "desc" }],
    take: opts.take,
  });

export async function getEquipment(id: number) {
  const e = await prisma.equipment.findUnique({ where: { id } });
  if (!e || e.status === "RETIRED") throw new HttpError(404, "Equipment not found");
  return e;
}

export const ARTICLES_PAGE_SIZE = 10;

export async function listArticles({ lang, page = 1, pageSize = ARTICLES_PAGE_SIZE }: { lang?: string; page?: number; pageSize?: number }) {
  const where: Prisma.ArticleWhereInput = { isPublished: true, ...(lang && { language: lang }) };
  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.article.count({ where }),
  ]);
  return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getArticle(slug: string) {
  const a = await prisma.article.findUnique({ where: { slug } });
  if (!a || !a.isPublished) throw new HttpError(404, "Article not found");
  return a;
}

export async function publicStats() {
  const [doctors, patients, departments] = await Promise.all([
    prisma.doctor.count(),
    prisma.patient.count(),
    prisma.department.count(),
  ]);
  return { doctors, patients, departments };
}
