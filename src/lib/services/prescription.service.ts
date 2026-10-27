import type { Prisma } from "@prisma/client";
import { prisma } from "../db";

/** Next code like RX-2026-0001 (inside a transaction) */
export async function nextPrescriptionCode(tx: Prisma.TransactionClient, year = new Date().getFullYear()) {
  const prefix = `RX-${year}-`;
  const last = await tx.prescription.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: "desc" },
    select: { code: true },
  });
  const n = last ? Number(last.code.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(n).padStart(4, "0")}`;
}

export async function createPrescription(data: {
  patientId: number;
  doctorId: number;
  validDays: number;
  items: {
    medicineName: string;
    genericName?: string | null;
    dosage: string;
    frequency?: string | null;
    durationDays?: number | null;
    quantity: number;
  }[];
}) {
  return prisma.$transaction(async (tx) => {
    const code = await nextPrescriptionCode(tx);
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + data.validDays);
    return tx.prescription.create({
      data: {
        code,
        patientId: data.patientId,
        doctorId: data.doctorId,
        validUntil,
        items: { create: data.items },
      },
      include: { items: true },
    });
  });
}

/** Effective status: an expired ACTIVE one counts as EXPIRED */
export const effectiveStatus = (p: { status: string; validUntil: Date }) =>
  p.status === "ACTIVE" && p.validUntil.getTime() < Date.now() ? "EXPIRED" : p.status;
