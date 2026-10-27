import { handler } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPatientByUserId } from "@/lib/services/appointment.service";

export const GET = handler(async (req) => {
  const patient = await getPatientByUserId((await requireAuth(req, "PATIENT")).id);
  const unread = req.nextUrl.searchParams.get("unread") === "true";
  return prisma.notification.findMany({
    where: { patientId: patient.id, ...(unread && { isRead: false }) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
});

// Mark all as read
export const PATCH = handler(async (req) => {
  const patient = await getPatientByUserId((await requireAuth(req, "PATIENT")).id);
  const { count } = await prisma.notification.updateMany({
    where: { patientId: patient.id, isRead: false },
    data: { isRead: true },
  });
  return { updated: count };
});
