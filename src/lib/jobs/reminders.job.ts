// Cron: reminders 24 hours before the appointment (every 15 minutes)
import cron from "node-cron";
import { prisma } from "../db";
import { sendAppointmentReminder } from "../services/reminder.service";

export async function runReminderPass(now = new Date()) {
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const due = await prisma.appointment.findMany({
    where: { status: "BOOKED", reminderSent: false, startsAt: { gte: now, lte: in24h } },
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true, department: true } },
    },
  });
  for (const a of due) {
    try {
      await sendAppointmentReminder(a);
      await prisma.appointment.update({ where: { id: a.id }, data: { reminderSent: true } });
    } catch (err) {
      console.error(`[reminder] appointment #${a.id} failed:`, (err as Error).message);
    }
  }
  return due.length;
}

const g = globalThis as unknown as { __reminderJob?: boolean };

export function startReminderJob() {
  if (g.__reminderJob) return;
  g.__reminderJob = true;
  cron.schedule("*/15 * * * *", () => {
    runReminderPass().catch((e) => console.error("[reminder] pass failed:", e));
  });
  console.log("Reminder job scheduled (every 15 min)");
}
