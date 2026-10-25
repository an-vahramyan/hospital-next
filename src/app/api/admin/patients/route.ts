import type { Prisma } from "@prisma/client";
import { handler } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const GET = handler(async (req) => {
  await requireAuth(req, "ADMIN");
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const where: Prisma.PatientWhereInput = q
    ? {
        OR: [q, q.toLowerCase(), q[0].toUpperCase() + q.slice(1)].flatMap((v) => [
          { user: { firstName: { contains: v } } },
          { user: { lastName: { contains: v } } },
          { user: { email: { contains: v } } },
          { user: { phone: { contains: v } } },
        ]),
      }
    : {};
  return prisma.patient.findMany({
    where,
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, createdAt: true } },
      _count: { select: { appointments: true, prescriptions: true, visits: true } },
    },
    orderBy: { id: "desc" },
    take: 100,
  });
});
