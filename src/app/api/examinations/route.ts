import { created, handler, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { examinationSchema } from "@/lib/schemas";

// Назначить обследование
export const POST = handler(async (req) => {
  await requireAuth(req, "DOCTOR", "ADMIN");
  const data = await parseBody(req, examinationSchema);
  return created(await prisma.examination.create({ data }));
});
