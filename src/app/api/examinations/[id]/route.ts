import { handler, idParam, parseBody } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { examinationUpdateSchema } from "@/lib/schemas";

// Внести результат обследования
export const PATCH = handler<{ id: string }>(async (req, ctx) => {
  await requireAuth(req, "DOCTOR", "ADMIN");
  const id = await idParam(ctx);
  const d = await parseBody(req, examinationUpdateSchema);
  const status = d.status ?? (d.result ? "DONE" : undefined);
  return prisma.examination.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(d.result !== undefined && { result: d.result }),
      ...(d.fileUrl !== undefined && { fileUrl: d.fileUrl }),
      ...(status === "DONE" && { resultAt: new Date() }),
    },
  });
});
