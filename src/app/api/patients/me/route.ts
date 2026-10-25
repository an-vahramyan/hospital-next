import { handler, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { profileSchema } from "@/lib/schemas";
import { publicUser } from "@/lib/services/auth.service";

const load = async (userId: number) =>
  publicUser(await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { patient: true } }));

export const GET = handler(async (req) => {
  const user = await requireAuth(req, "PATIENT");
  return load(user.id);
});

export const PUT = handler(async (req) => {
  const user = await requireAuth(req, "PATIENT");
  const d = await parseBody(req, profileSchema);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(d.firstName && { firstName: d.firstName }),
      ...(d.lastName && { lastName: d.lastName }),
      ...(d.phone !== undefined && { phone: d.phone || null }),
      ...(d.language && { language: d.language }),
      patient: {
        update: {
          ...(d.birthDate !== undefined && { birthDate: d.birthDate ? new Date(d.birthDate) : null }),
          ...(d.gender !== undefined && { gender: d.gender || null }),
          ...(d.bloodType !== undefined && { bloodType: d.bloodType || null }),
          ...(d.allergies !== undefined && { allergies: d.allergies || null }),
        },
      },
    },
  });
  return load(user.id);
});
