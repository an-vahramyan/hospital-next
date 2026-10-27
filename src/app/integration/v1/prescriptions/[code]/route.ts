import { handler } from "@/lib/api";
import { requireApiKey } from "@/lib/apiKey";
import { HttpError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { effectiveStatus } from "@/lib/services/prescription.service";

// Prescription authenticity check. Patient personal data is NOT returned.
export const GET = handler<{ code: string }>(async (req, ctx) => {
  requireApiKey(req);
  const { code } = await ctx.params;
  const p = await prisma.prescription.findUnique({
    where: { code: decodeURIComponent(code).toUpperCase() },
    include: { items: true, doctor: { include: { user: { select: { firstName: true, lastName: true } } } } },
  });
  if (!p) throw new HttpError(404, "Prescription not found", { code: "PRESCRIPTION_NOT_FOUND" });
  return {
    code: p.code,
    status: effectiveStatus(p),
    issuedAt: p.issuedAt.toISOString(),
    validUntil: p.validUntil.toISOString(),
    doctor: `${p.doctor.user.firstName} ${p.doctor.user.lastName}`,
    items: p.items.map((i) => ({
      name: i.medicineName,
      genericName: i.genericName,
      dosage: i.dosage,
      quantity: i.quantity,
      frequency: i.frequency,
      durationDays: i.durationDays,
    })),
  };
});
