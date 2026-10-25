import { z } from "zod";

const optStr = z.string().trim().max(5000).optional().nullable().transform((v) => (v ? v : null));
const lang = z.enum(["hy", "en", "ru"]);
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM");

export const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(30).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")).transform((v) => v || undefined),
  language: lang.optional(),
});

export const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });

export const bookSchema = z.object({
  doctorId: z.coerce.number().int().positive(),
  serviceId: z.coerce.number().int().positive().optional().nullable(),
  startsAt: z.string().datetime({ offset: true }),
  notes: z.string().max(1000).optional().nullable(),
});

export const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(30).optional().nullable(),
  language: lang.optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable().or(z.literal("")),
  bloodType: z.string().max(10).optional().nullable(),
  allergies: z.string().max(2000).optional().nullable(),
});

export const pharmacyItemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  genericName: z.string().trim().max(200).optional().nullable(),
  dosage: z.string().trim().max(100).optional().nullable(),
  quantity: z.coerce.number().int().positive().max(10000),
});

export const chatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(20),
  language: lang.optional(),
});

export const prescriptionSchema = z.object({
  patientId: z.coerce.number().int().positive(),
  doctorId: z.coerce.number().int().positive().optional(),
  validDays: z.coerce.number().int().min(1).max(365).default(30),
  items: z
    .array(
      z.object({
        medicineName: z.string().trim().min(1).max(200),
        genericName: optStr,
        dosage: z.string().trim().min(1).max(100),
        frequency: optStr,
        durationDays: z.coerce.number().int().positive().max(365).optional().nullable(),
        quantity: z.coerce.number().int().positive().max(10000),
      }),
    )
    .min(1)
    .max(20),
});

export const examinationSchema = z.object({
  patientId: z.coerce.number().int().positive(),
  type: z.string().trim().min(1).max(200),
});

export const examinationUpdateSchema = z.object({
  status: z.enum(["ORDERED", "DONE"]).optional(),
  result: z.string().max(5000).optional().nullable(),
  fileUrl: z.string().max(500).optional().nullable(),
});

export const appointmentStatusSchema = z.object({
  status: z.enum(["BOOKED", "CANCELLED", "COMPLETED", "NO_SHOW"]),
  diagnosis: z.string().max(2000).optional().nullable(),
  visitNotes: z.string().max(5000).optional().nullable(),
});

export const notificationSchema = z.object({
  type: z.enum(["RESERVATION_READY", "OUT_OF_STOCK", "RESERVATION_EXPIRED", "INFO"]),
  message: z.string().trim().min(1).max(2000),
  reservationId: z.string().max(100).optional().nullable(),
  prescriptionCode: z.string().max(50).optional().nullable(),
});

// ---- Admin ----
export const departmentSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(60).regex(/^[a-z0-9-]+$/, "lowercase latin, digits, -"),
  description: optStr,
});

export const serviceSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: optStr,
  price: z.coerce.number().int().min(0),
  durationMin: z.coerce.number().int().min(5).max(600),
  departmentId: z.coerce.number().int().positive(),
});

const optDate = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v ? new Date(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "Invalid date");

export const equipmentSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: optStr,
  imageUrl: optStr,
  acquiredAt: optDate,
  isNew: z.boolean().default(false),
  status: z.enum(["ACTIVE", "MAINTENANCE", "RETIRED"]).default("ACTIVE"),
});

export const articleSchema = z.object({
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/, "lowercase latin, digits, -"),
  title: z.string().trim().min(1).max(300),
  content: z.string().min(1).max(100_000),
  language: lang.default("hy"),
  coverUrl: optStr,
  isPublished: z.boolean().default(false),
  publishedAt: optDate.transform((d) => d ?? new Date()),
});

const doctorFields = {
  departmentId: z.coerce.number().int().positive(),
  specialty: z.string().trim().min(1).max(200),
  bio: optStr,
  photoUrl: optStr,
  experienceYears: z.coerce.number().int().min(0).max(80).default(0),
  workStart: hhmm.default("09:00"),
  workEnd: hhmm.default("17:00"),
  slotMinutes: z.coerce.number().int().min(5).max(240).default(30),
};

export const doctorCreateSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  phone: z.string().trim().max(30).optional().nullable(),
  ...doctorFields,
});

export const doctorUpdateSchema = z.object({
  email: z.string().trim().email().optional(),
  password: z.string().min(8).optional().or(z.literal("")),
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  phone: z.string().trim().max(30).optional().nullable(),
  ...Object.fromEntries(Object.entries(doctorFields).map(([k, v]) => [k, (v as z.ZodTypeAny).optional()])),
}) as z.ZodType<{
  email?: string; password?: string; firstName?: string; lastName?: string; phone?: string | null;
  departmentId?: number; specialty?: string; bio?: string | null; photoUrl?: string | null;
  experienceYears?: number; workStart?: string; workEnd?: string; slotMinutes?: number;
}>;
