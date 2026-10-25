#  Hospital — Next.js (React) with a fully working backend

A hospital website: public pages, online appointment booking, patient and doctor cabinets, an admin panel,
an online queue, an AI chatbot, and a pharmacy integration (the pharmacy team's server) over the local network.
The interface is available in three languages: **հայերեն / English / Русский**.

## Tech stack
| Layer | Technology |
|---|---|
| Frontend | **Next.js 16 (App Router) + React 19**, TypeScript, plain CSS (dark theme, responsive) |
| Backend | **Next.js Route Handlers** (`src/app/api/*`, `src/app/integration/v1/*`) |
| Database | Prisma 6 + SQLite (switching to PostgreSQL takes two lines) |
| Auth | JWT (jose) in an httpOnly cookie **or** `Authorization: Bearer`, bcrypt |
| Validation | zod |
| AI | Claude API (`@anthropic-ai/sdk`); without a key, a keyword-based fallback (hy/ru/en) |
| Reminders | node-cron (every 15 min) + nodemailer (or console output) |

Frontend and backend are **one project on one port, `4000`**: the site at `/`, the API at `/api/*`, and the pharmacy entry point at `/integration/v1/*`.

## Getting started
```bash
npm install
cp .env.example .env          # Windows: copy .env.example .env
npm run setup                 # creates the DB (prisma migrate) and seeds test data
npm run dev                   # http://localhost:4000

# in a second terminal (until the real pharmacy server is available):
npm run pharmacy:mock         # mock pharmacy on :5000
```
Production: `npm run build && npm start`.

### Test accounts
| Role | Email | Password |
|---|---|---|
| Admin | admin@hospital.am | Admin123! |
| Doctor | doctor@hospital.am (and all other doctors) | Doctor123! |
| Patient | patient@hospital.am | Patient123! |

On the login page you can click an account to fill in the fields automatically.

### Checks
```bash
npm test          # unit tests (dates, slots, i18n, JWT)
npm run smoke     # 70 checks across the whole API against a running server (best with the mock pharmacy running)
npm run typecheck
```

## Features
**Public site:** home page (hero, statistics, services, doctors, new equipment, articles, contacts + map),
doctors with debounced search and department filter, doctor page, services by department, equipment, paginated articles (per language), online queue with a display board.

**Patient** (`/patient`): overview (next appointment, latest prescription/exam, pharmacy notifications, visit history),
appointments (upcoming/past, cancel), prescriptions, examinations, **medicine availability at the pharmacy** (online/offline status, check, reserve), profile.
Step-by-step **booking** (`/book`): department → doctor → service → date → free time slot → comment. Double booking of the same slot is impossible (transaction + HTTP 409).

**Doctor** (`/doctor-cabinet`): daily schedule, complete an appointment with a diagnosis (creates a visit), mark no-show, issue a prescription (code `RX-YYYY-NNNN`), order an examination and enter its result, call the next patient in the queue.

**Admin** (`/admin`): dashboard with statistics and today's appointments; CRUD for doctors (creates User + Doctor), departments, services, equipment and articles; patients with search and full history; appointments with filters and status changes.

**Chatbot:** a floating window on every page that suggests a department and three doctors with a "Book" button. It does not give diagnoses; for dangerous symptoms it points to emergency numbers (911/103).

## Project structure
```
prisma/schema.prisma, seed.ts         — data models and seed data
src/app/                              — pages (App Router)
  api/…                               — REST API for the frontend
  integration/v1/…                    — API for the pharmacy (X-API-Key)
  patient/ doctor-cabinet/ admin/     — role-based cabinets
src/proxy.ts                          — page protection by role (Next 16 "proxy", formerly middleware)
src/instrumentation.ts                — starts cron reminders when the server boots
src/lib/                              — config, db, auth, errors, zod schemas
src/lib/services/                     — business logic (booking, pharmacy, queue, chatbot, prescriptions…)
src/lib/client/api.ts                 — frontend functions for calling the API
src/i18n/dictionaries/{hy,en,ru}.ts   — all interface texts
src/app/globals.css                   — all styles (tokens, components, responsive, dark mode)
src/components/                       — Header, Footer, DoctorCard, ChatbotWidget, ResourceTable…
integration/mock-pharmacy-server/     — test pharmacy (no dependencies)
docs/                                 — pharmacy API contract, network setup
scripts/smoke.mjs                     — end-to-end API check
```

## API (overview)
| Area | Method and path | Access |
|---|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` | public / any user |
| Catalog | `GET /api/departments`, `/api/doctors?q=&department=`, `/api/doctors/:id`, `/api/doctors/:id/slots?date=`, `/api/services`, `/api/equipment`, `/api/articles?lang=&page=`, `/api/articles/:slug` | public |
| Booking | `POST /api/appointments`, `GET /api/appointments/my`, `PATCH /api/appointments/:id/cancel` | PATIENT |
| Doctor | `GET /api/appointments/doctor?date=`, `PATCH /api/appointments/:id/status`, `GET /api/doctor/patients`, `POST /api/prescriptions`, `POST /api/examinations`, `PATCH /api/examinations/:id` | DOCTOR (+ADMIN) |
| Patient | `GET/PUT /api/patients/me`, `GET /api/patients/me/{visits,prescriptions,examinations,notifications}`, `PATCH …/notifications` | PATIENT |
| Pharmacy | `GET /api/pharmacy/health`, `POST /api/pharmacy/prescriptions/:id/check`, `…/reserve`, `POST /api/pharmacy/check`, `GET /api/pharmacy/history` | authenticated |
| Chatbot | `POST /api/chatbot` (20 requests/min per IP) | public |
| Queue | `POST /api/queue/tickets`, `GET /api/queue/tickets/:id`, `GET /api/queue/departments/:id/board`, `POST …/next` | see code |
| Admin | `GET /api/admin/stats`, CRUD `/api/admin/{services,equipment,articles,departments,doctors}`, `/api/admin/patients[?q=]`, `/api/admin/appointments`, `PATCH /api/admin/appointments/:id` | ADMIN |
| Integration | `GET /integration/v1/health`, `GET /integration/v1/prescriptions/:code`, `POST /integration/v1/notifications` | X-API-Key |

Error format everywhere: `{ "error": "Message", "code"?: "...", "details"?: {...} }`.

## Switching to PostgreSQL
In `prisma/schema.prisma` set `provider = "postgresql"`, in `.env` set `DATABASE_URL="postgresql://postgres:pass@localhost:5432/hospital"`,
delete `prisma/migrations`, and run `npm run setup` again.

## Notes
- If `ANTHROPIC_API_KEY` is empty in `.env`, the chatbot runs on keyword matching.
- Without `SMTP_HOST`, reminders are printed to the server console.
- To open the site from another computer on the network: `http://<your IP>:4000` (see `docs/network-setup.md`).