import { created, handler, parseBody } from "@/lib/api";
import { requireApiKey } from "@/lib/apiKey";
import { prisma } from "@/lib/db";
import { notificationSchema } from "@/lib/schemas";

// Notification from the pharmacy (medicines ready, out of stock, etc.)
export const POST = handler(async (req) => {
  requireApiKey(req);
  const data = await parseBody(req, notificationSchema);
  const prescription = data.prescriptionCode
    ? await prisma.prescription.findUnique({ where: { code: data.prescriptionCode.toUpperCase() } })
    : null;
  const n = await prisma.notification.create({
    data: {
      type: data.type,
      message: data.message,
      reservationId: data.reservationId || null,
      prescriptionCode: prescription?.code ?? data.prescriptionCode ?? null,
      patientId: prescription?.patientId ?? null,
    },
  });
  return created({ received: true, id: n.id, matchedPatient: Boolean(n.patientId) });
});
