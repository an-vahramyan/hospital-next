// Бизнес-логика работы с аптекой
import crypto from "node:crypto";
import { prisma } from "../db";
import { HttpError } from "../errors";
import type { SessionUser } from "../session";
import { pharmacyClient, type PharmacyItem } from "./pharmacy.client";
import { effectiveStatus } from "./prescription.service";

async function loadPrescriptionFor(user: SessionUser, prescriptionId: number) {
  const p = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: { items: true, patient: true },
  });
  if (!p) throw new HttpError(404, "Prescription not found");
  // пациент — только свой рецепт; врач/админ — любой
  if (user.role === "PATIENT" && p.patient.userId !== user.id) throw new HttpError(404, "Prescription not found");
  return p;
}

/** Только данные о лекарствах — БЕЗ персональных данных пациента */
const toPharmacyItems = (items: { medicineName: string; genericName: string | null; dosage: string; quantity: number }[]): PharmacyItem[] =>
  items.map((i) => ({ name: i.medicineName, genericName: i.genericName, dosage: i.dosage, quantity: i.quantity }));

async function logged<T>(
  user: SessionUser,
  kind: "CHECK" | "RESERVE",
  prescriptionId: number | null,
  payload: unknown,
  run: (requestId: string) => Promise<T>,
): Promise<T> {
  const requestId = crypto.randomUUID();
  const log = await prisma.pharmacyRequest.create({
    data: { requestId, kind, prescriptionId, requestedById: user.id, payload: JSON.stringify(payload) },
  });
  try {
    const response = await run(requestId);
    await prisma.pharmacyRequest.update({
      where: { id: log.id },
      data: { status: "SUCCESS", response: JSON.stringify(response) },
    });
    return response;
  } catch (err) {
    await prisma.pharmacyRequest.update({
      where: { id: log.id },
      data: { status: "FAILED", response: JSON.stringify({ error: (err as Error).message }) },
    });
    throw err;
  }
}

export async function checkPrescriptionAvailability(user: SessionUser, prescriptionId: number) {
  const p = await loadPrescriptionFor(user, prescriptionId);
  const items = toPharmacyItems(p.items);
  const result = await logged(user, "CHECK", p.id, { items }, (rid) => pharmacyClient.checkAvailability(rid, items));
  return { prescription: { id: p.id, code: p.code, status: effectiveStatus(p) }, requested: items, ...result };
}

export async function checkCustomList(user: SessionUser, items: PharmacyItem[]) {
  return logged(user, "CHECK", null, { items }, (rid) => pharmacyClient.checkAvailability(rid, items));
}

export async function reservePrescription(user: SessionUser, prescriptionId: number) {
  const p = await loadPrescriptionFor(user, prescriptionId);
  const status = effectiveStatus(p);
  if (status !== "ACTIVE") throw new HttpError(400, `Prescription is ${status}`, { code: `PRESCRIPTION_${status}` });
  const items = toPharmacyItems(p.items);
  return logged(user, "RESERVE", p.id, { prescriptionCode: p.code, items }, (rid) =>
    pharmacyClient.reserve(rid, p.code, items),
  );
}

export async function getHistory(user: SessionUser) {
  const where = user.role === "PATIENT" ? { requestedById: user.id } : {};
  const rows = await prisma.pharmacyRequest.findMany({
    where,
    include: { prescription: { select: { code: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows.map((r) => ({
    ...r,
    payload: safeJson(r.payload),
    response: r.response ? safeJson(r.response) : null,
  }));
}

const safeJson = (s: string) => {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
};
