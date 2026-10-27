// Runs once when the Next.js server starts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.REMINDERS_ENABLED !== "false") {
    const { startReminderJob } = await import("./lib/jobs/reminders.job");
    startReminderJob();
  }
}
