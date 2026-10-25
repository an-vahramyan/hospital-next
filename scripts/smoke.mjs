// Smoke-тест всего API. Сервер должен быть запущен (npm run dev / start), mock-аптека — по желанию.
// Запуск: npm run smoke   (BASE_URL=http://localhost:4000 по умолчанию)
const BASE = process.env.BASE_URL || "http://localhost:4000";
const INTEGRATION_KEY = process.env.INTEGRATION_API_KEY || "hospital-key-for-milena";
let passed = 0, failed = 0;

async function call(method, path, { body, token, headers = {} } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body && { "Content-Type": "application/json" }), ...(token && { Authorization: `Bearer ${token}` }), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

function check(name, cond, extra) {
  if (cond) { passed++; console.log(`  ✔ ${name}`); }
  else { failed++; console.log(`  ✘ ${name}`, extra !== undefined ? JSON.stringify(extra).slice(0, 300) : ""); }
}

const login = async (email, password) => (await call("POST", "/api/auth/login", { body: { email, password } })).data?.token;

(async () => {
  console.log(`Smoke test → ${BASE}\n`);

  console.log("Public");
  let r = await call("GET", "/api/health"); check("GET /api/health", r.status === 200 && r.data.status === "ok", r);
  r = await call("GET", "/api/departments"); check("departments", r.status === 200 && r.data.length >= 1, r);
  const deps = r.data;
  r = await call("GET", "/api/doctors?department=cardiology"); check("doctors by department", r.status === 200 && r.data.length >= 1 && !r.data[0].user.email, r);
  const doctor = r.data[0];
  r = await call("GET", `/api/doctors?q=${encodeURIComponent(doctor.user.firstName)}`); check("doctor search q=", r.status === 200 && r.data.some((d) => d.id === doctor.id), r);
  r = await call("GET", `/api/doctors/${doctor.id}`); check("doctor details", r.status === 200 && r.data.department, r);
  r = await call("GET", "/api/doctors/99999"); check("doctor 404", r.status === 404, r);
  r = await call("GET", "/api/services"); check("services", r.status === 200 && r.data.length > 0, r);
  r = await call("GET", "/api/equipment"); check("equipment (new first)", r.status === 200 && r.data[0].isNew === true, r);
  r = await call("GET", "/api/articles?lang=hy"); check("articles hy", r.status === 200 && r.data.items.every((a) => a.language === "hy"), r);
  if (r.data.items[0]) { const s = r.data.items[0].slug; r = await call("GET", `/api/articles/${s}`); check("article by slug", r.status === 200, r); }
  r = await call("GET", "/api/articles/draft-article"); check("unpublished article hidden", r.status === 404, r);

  console.log("\nAuth");
  const email = `smoke${Date.now()}@test.am`;
  r = await call("POST", "/api/auth/register", { body: { email, password: "short", firstName: "A", lastName: "B" } });
  check("register validation (password min 8) → 400", r.status === 400, r);
  r = await call("POST", "/api/auth/register", { body: { email, password: "Password1!", firstName: "Smoke", lastName: "Test", phone: "+37499000000" } });
  check("register → 201 + token, no passwordHash", r.status === 201 && r.data.token && !r.data.user.passwordHash, r);
  const pToken = r.data.token;
  r = await call("POST", "/api/auth/register", { body: { email, password: "Password1!", firstName: "x", lastName: "y" } });
  check("duplicate email → 409", r.status === 409, r);
  r = await call("POST", "/api/auth/login", { body: { email, password: "wrong-pass" } }); check("wrong password → 401", r.status === 401, r);
  r = await call("GET", "/api/auth/me", { token: pToken }); check("GET /me", r.status === 200 && r.data.email === email && r.data.patient, r);
  r = await call("GET", "/api/auth/me"); check("GET /me without token → 401", r.status === 401, r);

  console.log("\nBooking");
  const d = new Date(); d.setDate(d.getDate() + 2);
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  r = await call("GET", `/api/doctors/${doctor.id}/slots?date=${date}`); check("free slots", r.status === 200 && r.data.slots.length > 0, r);
  const slot = r.data.slots[0];
  r = await call("POST", "/api/appointments", { token: pToken, body: { doctorId: doctor.id, startsAt: slot, notes: "smoke" } });
  check("book → 201", r.status === 201 && r.data.status === "BOOKED", r);
  const apptId = r.data.id;
  r = await call("POST", "/api/appointments", { token: pToken, body: { doctorId: doctor.id, startsAt: slot } }); check("double booking → 409", r.status === 409, r);
  r = await call("GET", `/api/doctors/${doctor.id}/slots?date=${date}`); check("booked slot removed", !r.data.slots.includes(slot), r);
  r = await call("POST", "/api/appointments", { token: pToken, body: { doctorId: doctor.id, startsAt: new Date(new Date(slot).getTime() + 7 * 60000).toISOString() } });
  check("off-grid time → 400", r.status === 400, r);
  r = await call("GET", "/api/appointments/my", { token: pToken }); check("my appointments", r.status === 200 && r.data.some((a) => a.id === apptId), r);
  r = await call("PATCH", `/api/appointments/${apptId}/cancel`, { token: pToken }); check("cancel", r.status === 200 && r.data.status === "CANCELLED", r);
  r = await call("PATCH", `/api/appointments/${apptId}/cancel`, { token: pToken }); check("cancel twice → 400", r.status === 400, r);

  console.log("\nPatient (seed)");
  const seedPatient = await login("patient@hospital.am", "Patient123!");
  check("seed patient login", !!seedPatient);
  r = await call("GET", "/api/patients/me/prescriptions", { token: seedPatient }); check("prescriptions", r.status === 200 && r.data.length >= 1, r);
  const rx = r.data.find((p) => p.status === "ACTIVE");
  check("expired prescription status computed", r.data.some((p) => p.status === "EXPIRED"), r.data.map((p) => p.status));
  r = await call("GET", "/api/patients/me/visits", { token: seedPatient }); check("visits", r.status === 200 && r.data.length >= 1, r);
  r = await call("GET", "/api/patients/me/examinations", { token: seedPatient }); check("examinations", r.status === 200 && r.data.length >= 1, r);
  r = await call("PUT", "/api/patients/me", { token: seedPatient, body: { allergies: "Պենիցիլին", bloodType: "A+" } }); check("update profile", r.status === 200 && r.data.patient.bloodType === "A+", r);
  r = await call("GET", "/api/admin/stats", { token: seedPatient }); check("patient → admin API → 403", r.status === 403, r);

  console.log("\nPharmacy (outgoing)");
  r = await call("GET", "/api/pharmacy/health", { token: seedPatient });
  const pharmacyOnline = r.status === 200 && r.data.online;
  check(`pharmacy health (${pharmacyOnline ? "online" : "offline"})`, r.status === 200, r);
  r = await call("POST", `/api/pharmacy/prescriptions/${rx.id}/check`, { token: seedPatient });
  if (pharmacyOnline) {
    check("availability check", r.status === 200 && r.data.items.length === rx.items.length, r);
    r = await call("POST", `/api/pharmacy/prescriptions/${rx.id}/reserve`, { token: seedPatient });
    check("reserve", r.status === 201 && r.data.reservationId, r);
  } else {
    check("pharmacy offline → 503", r.status === 503, r);
  }
  r = await call("POST", `/api/pharmacy/prescriptions/${rx.id}/check`, { token: pToken }); check("someone else's prescription → 404", r.status === 404, r);
  r = await call("GET", "/api/pharmacy/history", { token: seedPatient }); check("pharmacy history logged", r.status === 200 && r.data.length >= 1, r);

  console.log("\nIntegration (incoming, /integration/v1)");
  r = await call("GET", "/integration/v1/health"); check("no API key → 401", r.status === 401, r);
  r = await call("GET", "/integration/v1/health", { headers: { "X-API-Key": "wrong" } }); check("wrong API key → 401", r.status === 401, r);
  const K = { "X-API-Key": INTEGRATION_KEY };
  r = await call("GET", "/integration/v1/health", { headers: K }); check("health with key", r.status === 200 && r.data.status === "ok", r);
  r = await call("GET", `/integration/v1/prescriptions/${rx.code}`, { headers: K });
  check("prescription by code (no patient data)", r.status === 200 && r.data.code === rx.code && !JSON.stringify(r.data).includes("patient"), r);
  r = await call("GET", "/integration/v1/prescriptions/RX-0000-0000", { headers: K }); check("unknown code → 404", r.status === 404, r);
  r = await call("POST", "/integration/v1/notifications", { headers: K, body: { type: "INFO", message: "smoke test", prescriptionCode: rx.code } });
  check("notification → 201 matched patient", r.status === 201 && r.data.matchedPatient, r);
  r = await call("GET", "/api/patients/me/notifications?unread=true", { token: seedPatient }); check("patient sees notification", r.data.some((n) => n.message === "smoke test"), r);

  console.log("\nChatbot");
  r = await call("POST", "/api/chatbot", { body: { messages: [{ role: "user", content: "Սիրտս ցավում է" }], language: "hy" } });
  check("chatbot reply + department", r.status === 200 && r.data.reply && r.data.department === "cardiology" && r.data.doctors.length > 0, r);
  r = await call("POST", "/api/chatbot", { body: { messages: [] } }); check("chatbot validation → 400", r.status === 400, r);

  console.log("\nQueue");
  const therapy = deps.find((x) => x.slug === "therapy") || deps[0];
  r = await call("POST", "/api/queue/tickets", { token: pToken, body: { departmentId: therapy.id } }); check("take ticket", r.status === 201 && r.data.number > 0, r);
  const ticket = r.data;
  r = await call("POST", "/api/queue/tickets", { token: pToken, body: { departmentId: therapy.id } }); check("same ticket returned again", r.data.id === ticket.id, r);
  r = await call("GET", `/api/queue/tickets/${ticket.id}`); check("ticket status", r.status === 200 && typeof r.data.ahead === "number", r);
  r = await call("GET", `/api/queue/departments/${therapy.id}/board`); check("board", r.status === 200 && Array.isArray(r.data.next), r);
  r = await call("POST", `/api/queue/departments/${therapy.id}/next`, { token: pToken }); check("patient cannot call next → 403", r.status === 403, r);

  console.log("\nDoctor");
  const docToken = await login("doctor@hospital.am", "Doctor123!");
  r = await call("GET", "/api/appointments/doctor", { token: docToken }); check("doctor schedule", r.status === 200 && r.data.doctor, r);
  r = await call("POST", `/api/queue/departments/${therapy.id}/next`, { token: docToken }); check("doctor calls next", r.status === 200, r);
  r = await call("GET", "/api/doctor/patients", { token: docToken }); check("doctor's patients", r.status === 200 && r.data.length >= 1, r);
  const seedPatientId = r.data[0].id;
  r = await call("POST", "/api/prescriptions", { token: docToken, body: { patientId: seedPatientId, validDays: 10, items: [{ medicineName: "Ibuprofen", genericName: "ibuprofen", dosage: "200mg", quantity: 10 }] } });
  check("doctor issues prescription RX-YYYY-NNNN", r.status === 201 && /^RX-\d{4}-\d{4}$/.test(r.data.code), r);
  r = await call("POST", "/api/examinations", { token: docToken, body: { patientId: seedPatientId, type: "ԷՍԳ" } }); check("order exam", r.status === 201, r);
  r = await call("PATCH", `/api/examinations/${r.data.id}`, { token: docToken, body: { result: "Նորմա" } }); check("exam result → DONE", r.status === 200 && r.data.status === "DONE", r);

  console.log("\nAdmin");
  const admin = await login("admin@hospital.am", "Admin123!");
  r = await call("GET", "/api/admin/stats", { token: admin }); check("stats", r.status === 200 && r.data.doctors > 0, r);
  r = await call("POST", "/api/admin/services", { token: admin, body: { name: "Smoke service", price: 1000, durationMin: 15, departmentId: therapy.id } });
  check("create service", r.status === 201, r);
  const sid = r.data.id;
  r = await call("PUT", `/api/admin/services/${sid}`, { token: admin, body: { price: 2000 } }); check("update service", r.status === 200 && r.data.price === 2000, r);
  r = await call("DELETE", `/api/admin/services/${sid}`, { token: admin }); check("delete service → 204", r.status === 204, r);
  r = await call("GET", "/api/admin/unknown", { token: admin }); check("unknown resource → 404", r.status === 404, r);
  r = await call("POST", "/api/admin/doctors", { token: admin, body: { email: `doc${Date.now()}@hospital.am`, password: "Doctor123!", firstName: "Նոր", lastName: "Բժիշկ", departmentId: therapy.id, specialty: "Թերապևտ" } });
  check("create doctor (User + Doctor)", r.status === 201 && r.data.user, r);
  const newDoc = r.data.id;
  r = await call("PUT", `/api/admin/doctors/${newDoc}`, { token: admin, body: { specialty: "Ընտանեկան բժիշկ", workStart: "10:00" } }); check("update doctor", r.status === 200 && r.data.workStart === "10:00", r);
  r = await call("DELETE", `/api/admin/doctors/${newDoc}`, { token: admin }); check("delete doctor", r.status === 204, r);
  r = await call("DELETE", `/api/admin/doctors/${doctor.id}`, { token: admin }); check("delete doctor with appointments → 409", r.status === 409, r);
  r = await call("GET", "/api/admin/patients?q=smoke", { token: admin }); check("search patients", r.status === 200 && r.data.length >= 1, r);
  r = await call("GET", `/api/admin/patients/${seedPatientId}`, { token: admin }); check("patient full history", r.status === 200 && r.data.prescriptions.length >= 1, r);
  r = await call("GET", `/api/admin/appointments?date=${date}`, { token: admin }); check("appointments by date", r.status === 200, r);
  r = await call("PATCH", `/api/admin/appointments/${apptId}`, { token: admin, body: { status: "BOOKED" } }); check("admin changes status", r.status === 200, r);

  console.log(`\n${failed ? "❌" : "✅"} ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
