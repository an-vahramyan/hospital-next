// Online queue
import { prisma } from "../db";
import { HttpError } from "../errors";
import { toLocalDateString } from "../date";

export const MINUTES_PER_PATIENT = 10;

export async function takeTicket({ departmentId, patientId }: { departmentId: number; patientId: number | null }) {
  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!department) throw new HttpError(404, "Department not found");
  const date = toLocalDateString();

  if (patientId) {
    const existing = await prisma.queueTicket.findFirst({
      where: { departmentId, date, patientId, status: { in: ["WAITING", "CALLED"] } },
    });
    if (existing) return existing;
  }

  // transaction: last number today + 1 (unique [departmentId, date, number] protects against a race)
  return prisma.$transaction(async (tx) => {
    const last = await tx.queueTicket.findFirst({
      where: { departmentId, date },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    return tx.queueTicket.create({
      data: { departmentId, date, patientId, number: (last?.number ?? 0) + 1 },
    });
  });
}

export async function getStatus(ticketId: number) {
  const ticket = await prisma.queueTicket.findUnique({
    where: { id: ticketId },
    include: { department: { select: { id: true, name: true, slug: true } } },
  });
  if (!ticket) throw new HttpError(404, "Ticket not found");
  const ahead =
    ticket.status === "WAITING"
      ? await prisma.queueTicket.count({
          where: { departmentId: ticket.departmentId, date: ticket.date, status: "WAITING", number: { lt: ticket.number } },
        })
      : 0;
  const current = await prisma.queueTicket.findFirst({
    where: { departmentId: ticket.departmentId, date: ticket.date, status: "CALLED" },
    orderBy: { calledAt: "desc" },
    select: { number: true },
  });
  return { ticket, ahead, current: current?.number ?? null, estimatedWaitMin: ahead * MINUTES_PER_PATIENT };
}

export async function getBoard(departmentId: number) {
  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!department) throw new HttpError(404, "Department not found");
  const date = toLocalDateString();
  const [current, next, waitingCount] = await Promise.all([
    prisma.queueTicket.findFirst({
      where: { departmentId, date, status: "CALLED" },
      orderBy: { calledAt: "desc" },
    }),
    prisma.queueTicket.findMany({
      where: { departmentId, date, status: "WAITING" },
      orderBy: { number: "asc" },
      take: 5,
    }),
    prisma.queueTicket.count({ where: { departmentId, date, status: "WAITING" } }),
  ]);
  return { department, date, current: current?.number ?? null, next: next.map((t) => t.number), waitingCount };
}

export async function callNext(departmentId: number) {
  const date = toLocalDateString();
  return prisma.$transaction(async (tx) => {
    await tx.queueTicket.updateMany({ where: { departmentId, date, status: "CALLED" }, data: { status: "DONE" } });
    const next = await tx.queueTicket.findFirst({
      where: { departmentId, date, status: "WAITING" },
      orderBy: { number: "asc" },
    });
    if (!next) return { called: null };
    const called = await tx.queueTicket.update({
      where: { id: next.id },
      data: { status: "CALLED", calledAt: new Date() },
    });
    return { called };
  });
}
