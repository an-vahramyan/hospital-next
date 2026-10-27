// Appointment reminders (email via SMTP or console.log in dev)
import nodemailer from "nodemailer";
import { config } from "../config";

type ReminderAppointment = {
  startsAt: Date;
  patient: { user: { email: string; firstName: string; language?: string } };
  doctor: { user: { firstName: string; lastName: string }; department?: { name: string } | null };
};

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;
function getTransporter() {
  if (!config.smtp.host) return null;
  transporter ??= nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  });
  return transporter;
}

export function reminderText(a: ReminderAppointment) {
  const when = a.startsAt.toLocaleString("hy-AM", { dateStyle: "long", timeStyle: "short" });
  const doctor = `${a.doctor.user.firstName} ${a.doctor.user.lastName}`;
  return [
    `Հարգելի ${a.patient.user.firstName},`,
    ``,
    `Հիշեցնում ենք, որ ${when}-ին Դուք գրանցված եք ընդունելության բժիշկ ${doctor}-ի մոտ${a.doctor.department ? ` (${a.doctor.department.name})` : ""}։`,
    `Հասցե՝ ${config.hospitalAddress}`,
    ``,
    `Напоминаем: ${when} у вас приём у врача ${doctor}. Адрес: ${config.hospitalAddress}`,
    ``,
    config.hospitalName,
  ].join("\n");
}

export async function sendAppointmentReminder(a: ReminderAppointment) {
  const text = reminderText(a);
  const t = getTransporter();
  if (!t) {
    console.log(`[reminder] → ${a.patient.user.email}\n${text}\n`);
    return { sent: false, logged: true };
  }
  await t.sendMail({
    from: config.smtp.from,
    to: a.patient.user.email,
    subject: `Հիշեցում ընդունելության մասին / Напоминание о приёме — ${config.hospitalName}`,
    text,
  });
  return { sent: true };
}
