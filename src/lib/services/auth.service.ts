import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { prisma } from "../db";
import { HttpError } from "../errors";
import { signToken, type Role } from "../session";

export type PublicUser = Omit<User, "passwordHash">;

export function publicUser<T extends { passwordHash?: string }>(user: T): Omit<T, "passwordHash"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = user;
  return rest;
}

export const tokenFor = (user: User) => signToken({ id: user.id, role: user.role as Role, email: user.email });

export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string;
  language?: string;
}) {
  const email = data.email.toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new HttpError(409, "Email is already registered", { code: "EMAIL_TAKEN" });

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(data.password, 10),
      role: "PATIENT",
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone || null,
      language: data.language || "hy",
      patient: { create: { birthDate: data.birthDate ? new Date(data.birthDate) : null } },
    },
  });
  return { user: publicUser(user), token: await tokenFor(user) };
}

export async function login({ email, password }: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  // одинаковое сообщение — не раскрываем, что именно неверно
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, "Invalid email or password", { code: "INVALID_CREDENTIALS" });
  }
  return { user: publicUser(user), token: await tokenFor(user) };
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { patient: true, doctor: { include: { department: true } } },
  });
  if (!user) throw new HttpError(401, "User no longer exists");
  return publicUser(user);
}
