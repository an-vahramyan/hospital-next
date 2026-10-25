"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/client/api";

export type AuthUser = {
  id: number;
  email: string;
  role: "PATIENT" | "DOCTOR" | "ADMIN";
  firstName: string;
  lastName: string;
  phone?: string | null;
  language?: string;
};

type Ctx = {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: Record<string, unknown>) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

export const homeForRole = (role: AuthUser["role"]) =>
  role === "ADMIN" ? "/admin" : role === "DOCTOR" ? "/doctor-cabinet" : "/patient";

export function AuthProvider({ initialUser, children }: { initialUser: AuthUser | null; children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const router = useRouter();

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await authApi.login(email, password);
    setUser(user);
    router.refresh();
    return user;
  }, [router]);

  const register = useCallback(async (data: Record<string, unknown>) => {
    const { user } = await authApi.register(data);
    setUser(user);
    router.refresh();
    return user;
  }, [router]);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    setUser(null);
    router.push("/");
    router.refresh();
  }, [router]);

  const refresh = useCallback(async () => {
    try {
      setUser(await authApi.me());
    } catch {
      setUser(null);
    }
  }, []);

  return <AuthContext.Provider value={{ user, login, register, logout, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
