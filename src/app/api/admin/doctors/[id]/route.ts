import bcrypt from "bcryptjs";
import { handler, idParam, noContent, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { doctorUpdateSchema } from "@/lib/schemas";

const include = {
  user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
  department: { select: { id: true, name: true, slug: true } },
} as const;

export const GET = handler<{ id: string }>(async (req, ctx) => {
  await requireAuth(req, "ADMIN");
  const d = await prisma.doctor.findUnique({ where: { id: await idParam(ctx) }, include });
  if (!d) throw new HttpError(404, "Doctor not found");
  return d;
});

export const PUT = handler<{ id: string }>(async (req, ctx) => {
  await requireAuth(req, "ADMIN");
  const id = await idParam(ctx);
  const { email, password, firstName, lastName, phone, departmentId, ...doctor } = await parseBody(req, doctorUpdateSchema);
  const existing = await prisma.doctor.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Doctor not found");
  return prisma.doctor.update({
    where: { id },
    data: {
      ...doctor,
      ...(departmentId && { department: { connect: { id: departmentId } } }),
      user: {
        update: {
          ...(email && { email: email.toLowerCase() }),
          ...(password && { passwordHash: await bcrypt.hash(password, 10) }),
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone !== undefined && { phone: phone || null }),
        },
      },
    },
    include,
  });
});

// Delete the user (Doctor is removed by cascade). If there are appointments — 409.
export const DELETE = handler<{ id: string }>(async (req, ctx) => {
  await requireAuth(req, "ADMIN");
  const doctor = await prisma.doctor.findUnique({
    where: { id: await idParam(ctx) },
    include: { _count: { select: { appointments: true, visits: true, prescriptions: true } } },
  });
  if (!doctor) throw new HttpError(404, "Doctor not found");
  const c = doctor._count;
  if (c.appointments + c.visits + c.prescriptions > 0) {
    throw new HttpError(409, "Doctor has appointments/visits/prescriptions and cannot be deleted", { code: "IN_USE" });
  }
  await prisma.user.delete({ where: { id: doctor.userId } });
  return noContent();
});
