// Configuration from .env — process.env is read only here

const isProd = process.env.NODE_ENV === "production";

if (isProd && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production");
}

export const config = {
  hospitalName: process.env.HOSPITAL_NAME || "Արմենիա Բժշկական Կենտրոն",
  hospitalAddress: process.env.HOSPITAL_ADDRESS || "Երևան, Մաշտոցի պող. 1",
  jwtSecret: process.env.JWT_SECRET || "dev-only-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  pharmacy: {
    url: (process.env.PHARMACY_API_URL || "http://localhost:5000").replace(/\/$/, ""),
    apiKey: process.env.PHARMACY_API_KEY || "",
    timeoutMs: Number(process.env.PHARMACY_TIMEOUT_MS || 5000),
  },
  integrationApiKey: process.env.INTEGRATION_API_KEY || "",
  ai: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    model: process.env.AI_MODEL || "claude-sonnet-5-5",
  },
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.MAIL_FROM || "Hospital <no-reply@hospital.am>",
  },
  remindersEnabled: process.env.REMINDERS_ENABLED !== "false",
};
