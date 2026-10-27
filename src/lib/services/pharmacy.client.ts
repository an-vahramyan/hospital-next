// HTTP client for the pharmacy API (OUTGOING requests). Contract: docs/pharmacy-api-contract.md, section A
import { config } from "../config";
import { HttpError } from "../errors";

export type PharmacyItem = { name: string; genericName?: string | null; dosage?: string | null; quantity: number };

export type AvailabilityResponse = {
  requestId: string;
  checkedAt: string;
  items: {
    name: string;
    available: boolean;
    quantityAvailable: number;
    price: number | null;
    alternatives?: { name: string; quantityAvailable?: number; price?: number }[];
  }[];
};

export type ReservationResponse = {
  reservationId: string;
  status: string;
  prescriptionCode: string;
  expiresAt?: string;
  total?: number;
  items?: unknown[];
};

async function call<T>(path: string, { method = "GET", body }: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(config.pharmacy.url + path, {
      method,
      headers: { "Content-Type": "application/json", "X-API-Key": config.pharmacy.apiKey },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(config.pharmacy.timeoutMs),
      cache: "no-store",
    });
  } catch {
    throw new HttpError(503, "Pharmacy is unreachable", { code: "PHARMACY_UNREACHABLE" });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new HttpError(502, `Pharmacy error: ${data?.error || res.status}`, {
      code: data?.code || "PHARMACY_ERROR",
      details: data,
    });
  }
  return data as T;
}

export const pharmacyClient = {
  health: () => call<{ status: string; service?: string }>("/api/v1/health"),
  checkAvailability: (requestId: string, items: PharmacyItem[]) =>
    call<AvailabilityResponse>("/api/v1/availability/check", {
      method: "POST",
      body: { requestId, source: "hospital", items },
    }),
  reserve: (requestId: string, prescriptionCode: string, items: PharmacyItem[]) =>
    call<ReservationResponse>("/api/v1/reservations", {
      method: "POST",
      body: { requestId, source: "hospital", prescriptionCode, items },
    }),
  getReservation: (id: string) => call<ReservationResponse>(`/api/v1/reservations/${encodeURIComponent(id)}`),
};
