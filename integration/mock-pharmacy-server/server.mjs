// ============================================================
// Mock-server pharamcy (for test)
// docs/pharmacy-api-contract.md, port 5000.
// for run: npm run pharmacy:mock   (node:http)
// ============================================================
import http from "node:http";
import crypto from "node:crypto";

const PORT = Number(process.env.PORT || 5000);
const API_KEY = process.env.PHARMACY_API_KEY || "pharmacy-key-from-milena";
// where to send messages (section B of the contract)
const HOSPITAL_URL = process.env.HOSPITAL_API_URL || "http://localhost:4000";
const HOSPITAL_KEY = process.env.INTEGRATION_API_KEY || "hospital-key-for-milena";
const READY_AFTER_MS = Number(process.env.READY_AFTER_MS || 5000);

const stock = {
  amoxicillin: { qty: 120, price: 1800 },
  paracetamol: { qty: 300, price: 600 },
  ibuprofen: { qty: 80, price: 900 },
  lisinopril: { qty: 0, price: 2500, alternatives: [{ name: "Enalapril 10mg", quantityAvailable: 40, price: 1900 }] },
  metformin: { qty: 50, price: 1500 },
  omeprazole: { qty: 15, price: 2100 },
};
const reservations = new Map();

const key = (item) => String(item.genericName || item.name || "").trim().toLowerCase();

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return null;
  }
}

function availability(items) {
  return items.map((i) => {
    const s = stock[key(i)];
    return {
      name: i.name,
      available: Boolean(s && s.qty >= (i.quantity || 1)),
      quantityAvailable: s?.qty ?? 0,
      price: s?.price ?? null,
      alternatives: s?.alternatives ?? [],
    };
  });
}

async function notifyHospital(body) {
  try {
    const r = await fetch(`${HOSPITAL_URL}/integration/v1/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": HOSPITAL_KEY },
      body: JSON.stringify(body),
    });
    console.log(`→ hospital notification ${body.type}: ${r.status}`);
  } catch (e) {
    console.log(`→ hospital notification failed: ${e.message}`);
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  console.log(`${new Date().toISOString()} ${req.method} ${url.pathname}`);

  if (req.headers["x-api-key"] !== API_KEY) return send(res, 401, { error: "Invalid API key", code: "UNAUTHORIZED" });

  if (req.method === "GET" && url.pathname === "/api/v1/health") {
    return send(res, 200, { status: "ok", service: "pharmacy-mock", time: new Date().toISOString() });
  }

  if (req.method === "POST" && url.pathname === "/api/v1/availability/check") {
    const body = await readJson(req);
    if (!body || !Array.isArray(body.items)) return send(res, 400, { error: "items[] required", code: "BAD_REQUEST" });
    return send(res, 200, { requestId: body.requestId || crypto.randomUUID(), checkedAt: new Date().toISOString(), items: availability(body.items) });
  }

  if (req.method === "POST" && url.pathname === "/api/v1/reservations") {
    const body = await readJson(req);
    if (!body || !body.prescriptionCode || !Array.isArray(body.items)) {
      return send(res, 400, { error: "prescriptionCode and items[] required", code: "BAD_REQUEST" });
    }
    const result = availability(body.items);
    const missing = result.filter((r) => !r.available);
    if (missing.length) {
      return send(res, 409, { error: `Out of stock: ${missing.map((m) => m.name).join(", ")}`, code: "OUT_OF_STOCK", items: result });
    }
    for (const i of body.items) stock[key(i)].qty -= i.quantity || 1;
    const id = `R-${reservations.size + 1}`;
    const total = body.items.reduce((sum, i) => sum + (stock[key(i)].price || 0) * (i.quantity || 1), 0);
    const reservation = {
      reservationId: id,
      status: "RESERVED",
      prescriptionCode: body.prescriptionCode,
      expiresAt: new Date(Date.now() + 48 * 3600_000).toISOString(),
      total,
      items: result,
    };
    reservations.set(id, reservation);
    setTimeout(() => {
      reservation.status = "READY";
      notifyHospital({
        type: "RESERVATION_READY",
        reservationId: id,
        prescriptionCode: body.prescriptionCode,
        message: `Դեղերը պատրաստ են (${id}), կարող եք վերցնել։ Ընդհանուր՝ ${total} ֏`,
      });
    }, READY_AFTER_MS);
    return send(res, 201, reservation);
  }

  const m = url.pathname.match(/^\/api\/v1\/reservations\/([^/]+)$/);
  if (req.method === "GET" && m) {
    const r = reservations.get(decodeURIComponent(m[1]));
    return r ? send(res, 200, r) : send(res, 404, { error: "Reservation not found", code: "NOT_FOUND" });
  }

  send(res, 404, { error: `Not found: ${req.method} ${url.pathname}`, code: "NOT_FOUND" });
});

server.listen(PORT, "0.0.0.0", () => console.log(`💊 Mock pharmacy on http://0.0.0.0:${PORT} (key: ${API_KEY})`));
