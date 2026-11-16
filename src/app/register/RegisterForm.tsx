"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/context/AuthContext";
import type { ApiError } from "@/lib/client/api";

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
};

const EMPTY: Form = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthDate: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterForm() {
  const { t, lang } = useI18n();
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const today = new Date().toISOString().slice(0, 10); // upper limit for the birth date

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation before the request.
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = t("common.required");
    if (!form.lastName.trim()) next.lastName = t("common.required");
    if (!form.email.trim()) next.email = t("common.required");
    if (!form.password) next.password = t("auth.pwMin");
    else if (form.password.length < 8) next.password = t("auth.pwMin");
    if (form.password !== form.confirmPassword) next.confirmPassword = t("auth.pwMismatch");
    if (form.birthDate && form.birthDate > today) next.birthDate = t("common.required");

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      // confirmPassword is not sent to the server.
      const { confirmPassword: _omit, ...payload } = form;
      await register({ ...payload, language: lang });
      router.push("/patient");
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 409) setErrors({ email: t("auth.emailTaken") });
      else setError(apiErr.message);
      setLoading(false);
    }
  }

  return (
    <div className="container section" style={{ maxWidth: 620 }}>
      <div className="card" style={{ padding: 28 }}>
        <h1 style={{ fontSize: "1.8rem" }}>{t("auth.registerTitle")}</h1>
        <p className="mt-1 mb-3">{t("auth.registerSubtitle")}</p>
        <form className="form-grid" noValidate onSubmit={submit}>
          {error && <div className="alert alert-error full" role="alert">{error}</div>}

          <label className="field">
            <span>{t("auth.firstName")} *</span>
            <input className="input" autoComplete="given-name" value={form.firstName} onChange={set("firstName")} />
            {errors.firstName && <span className="field-error">{errors.firstName}</span>}
          </label>
          <label className="field">
            <span>{t("auth.lastName")} *</span>
            <input className="input" autoComplete="family-name" value={form.lastName} onChange={set("lastName")} />
            {errors.lastName && <span className="field-error">{errors.lastName}</span>}
          </label>
          <label className="field">
            <span>{t("auth.email")} *</span>
            <input className="input" type="email" autoComplete="email" value={form.email} onChange={set("email")} />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>
          <label className="field">
            <span>{t("auth.phone")}</span>
            <input
              className="input"
              type="tel"
              autoComplete="tel"
              placeholder="+374 ..."
              value={form.phone}
              onChange={set("phone")}
            />
          </label>
          <label className="field full">
            <span>{t("auth.birthDate")}</span>
            <input className="input" type="date" max={today} value={form.birthDate} onChange={set("birthDate")} />
            {errors.birthDate && <span className="field-error">{errors.birthDate}</span>}
          </label>
          <label className="field">
            <span>{t("auth.password")} *</span>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={set("password")}
            />
            {errors.password ? (
              <span className="field-error">{errors.password}</span>
            ) : (
              <span className="hint">{t("auth.pwMin")}</span>
            )}
          </label>
          <label className="field">
            <span>{t("auth.confirmPassword")} *</span>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={set("confirmPassword")}
            />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </label>
          <button className="btn btn-primary btn-lg full" disabled={loading}>{t("auth.registerBtn")}</button>
        </form>
        <p className="mt-3 center small">
          {t("auth.haveAccount")} <Link href="/login">{t("auth.loginLink")}</Link>
        </p>
      </div>
    </div>
  );
}
