"use client";
// Клиентские API-функции (cookie с токеном отправляется автоматически)

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type Opts = { method?: string; body?: unknown; query?: Record<string, string | number | undefined | null> };

export async function request<T = unknown>(path: string, { method = "GET", body, query }: Opts = {}): Promise<T> {
  let url = path;
  if (query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    const s = qs.toString();
    if (s) url += (url.includes("?") ? "&" : "?") + s;
  }
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Network error", "NETWORK");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data?.error || res.statusText, data?.code, data?.details);
  return data as T;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any;

export const authApi = {
  login: (email: string, password: string) => request<{ user: Any; token: string }>("/api/auth/login", { method: "POST", body: { email, password } }),
  register: (data: Record<string, unknown>) => request<{ user: Any; token: string }>("/api/auth/register", { method: "POST", body: data }),
  me: () => request<Any>("/api/auth/me"),
  logout: () => request("/api/auth/logout", { method: "POST" }),
};

export const doctorsApi = {
  list: (params: { q?: string; department?: string; limit?: number } = {}) => request<Any[]>("/api/doctors", { query: params }),
  get: (id: number | string) => request<Any>(`/api/doctors/${id}`),
  slots: (id: number | string, date: string) => request<{ date: string; slots: string[] }>(`/api/doctors/${id}/slots`, { query: { date } }),
};

export const publicApi = {
  departments: () => request<Any[]>("/api/departments"),
  services: (department?: string) => request<Any[]>("/api/services", { query: { department } }),
  equipment: () => request<Any[]>("/api/equipment"),
  articles: (lang?: string, page = 1) => request<Any>("/api/articles", { query: { lang, page } }),
  article: (slug: string) => request<Any>(`/api/articles/${slug}`),
};

export const appointmentsApi = {
  my: () => request<Any[]>("/api/appointments/my"),
  book: (data: { doctorId: number; serviceId?: number | null; startsAt: string; notes?: string }) =>
    request<Any>("/api/appointments", { method: "POST", body: data }),
  cancel: (id: number) => request<Any>(`/api/appointments/${id}/cancel`, { method: "PATCH" }),
  doctorSchedule: (date: string) => request<Any>("/api/appointments/doctor", { query: { date } }),
  setStatus: (id: number, data: { status: string; diagnosis?: string; visitNotes?: string }) =>
    request<Any>(`/api/appointments/${id}/status`, { method: "PATCH", body: data }),
};

export const patientApi = {
  profile: () => request<Any>("/api/patients/me"),
  updateProfile: (data: Record<string, unknown>) => request<Any>("/api/patients/me", { method: "PUT", body: data }),
  visits: () => request<Any[]>("/api/patients/me/visits"),
  prescriptions: () => request<Any[]>("/api/patients/me/prescriptions"),
  examinations: () => request<Any[]>("/api/patients/me/examinations"),
  notifications: (unread = false) => request<Any[]>("/api/patients/me/notifications", { query: { unread: unread ? "true" : undefined } }),
  markNotificationsRead: () => request<Any>("/api/patients/me/notifications", { method: "PATCH" }),
};

export const pharmacyApi = {
  health: () => request<{ online: boolean; error?: string }>("/api/pharmacy/health"),
  checkPrescription: (id: number) => request<Any>(`/api/pharmacy/prescriptions/${id}/check`, { method: "POST" }),
  reserve: (id: number) => request<Any>(`/api/pharmacy/prescriptions/${id}/reserve`, { method: "POST" }),
  checkList: (items: { name: string; dosage?: string; quantity: number }[]) => request<Any>("/api/pharmacy/check", { method: "POST", body: { items } }),
  history: () => request<Any[]>("/api/pharmacy/history"),
};

export const chatbotApi = {
  send: (messages: { role: "user" | "assistant"; content: string }[], language: string) =>
    request<{ reply: string; department: string | null; doctors: Any[]; source: string }>("/api/chatbot", {
      method: "POST",
      body: { messages, language },
    }),
};

export const queueApi = {
  take: (departmentId: number) => request<Any>("/api/queue/tickets", { method: "POST", body: { departmentId } }),
  status: (id: number) => request<Any>(`/api/queue/tickets/${id}`),
  board: (departmentId: number) => request<Any>(`/api/queue/departments/${departmentId}/board`),
  next: (departmentId: number) => request<Any>(`/api/queue/departments/${departmentId}/next`, { method: "POST" }),
};

export const clinicalApi = {
  prescribe: (data: Record<string, unknown>) => request<Any>("/api/prescriptions", { method: "POST", body: data }),
  orderExam: (data: { patientId: number; type: string }) => request<Any>("/api/examinations", { method: "POST", body: data }),
  setExamResult: (id: number, data: { result: string; status?: string; fileUrl?: string | null }) =>
    request<Any>(`/api/examinations/${id}`, { method: "PATCH", body: data }),
  myPatients: () => request<Any[]>("/api/doctor/patients"),
};

export const adminApi = {
  stats: () => request<Any>("/api/admin/stats"),
  list: (resource: string, query?: Record<string, string | undefined>) => request<Any[]>(`/api/admin/${resource}`, { query }),
  get: (resource: string, id: number) => request<Any>(`/api/admin/${resource}/${id}`),
  create: (resource: string, data: unknown) => request<Any>(`/api/admin/${resource}`, { method: "POST", body: data }),
  update: (resource: string, id: number, data: unknown) => request<Any>(`/api/admin/${resource}/${id}`, { method: "PUT", body: data }),
  patch: (resource: string, id: number, data: unknown) => request<Any>(`/api/admin/${resource}/${id}`, { method: "PATCH", body: data }),
  remove: (resource: string, id: number) => request<void>(`/api/admin/${resource}/${id}`, { method: "DELETE" }),
};
