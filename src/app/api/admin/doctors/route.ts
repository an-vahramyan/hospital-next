import bcrypt from "bcryptjs";
import { created, handler, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { doctorCreateSchema } from "@/lib/schemas";

const adminDoctorInclude = {
  user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
  department: { select: { id: true, name: true, slug: true } },
} as const;

export const GET = handler(async (req) => {
  await requireAuth(req, "ADMIN");
  return prisma.doctor.findMany({ include: adminDoctorInclude, orderBy: { id: "asc" } });
});

// Creates User (role DOCTOR) + Doctor
export const POST = handler(async (req) => {
  await requireAuth(req, "ADMIN");
  const { email, password, firstName, lastName, phone, ...doctor } = await parseBody(req, doctorCreateSchema);
  if (doctor.workStart >= doctor.workEnd) throw new HttpError(400, "workStart must be before workEnd");
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 10),
      role: "DOCTOR",
      firstName,
      lastName,
      phone: phone || null,
      doctor: { create: doctor },
    },
    include: { doctor: { include: adminDoctorInclude } },
  });
  return created(user.doctor);
});
