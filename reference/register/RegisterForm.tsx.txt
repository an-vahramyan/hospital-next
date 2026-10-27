"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n/I18nProvider";
import type { ApiError } from "@/lib/client/api";

export default function RegisterForm() {
  const { t, lang } = useI18n();
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", birthDate: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.password.length < 8) errs.password = t("auth.pwMin");
    if (form.password !== form.confirmPassword) errs.confirmPassword = t("auth.pwMismatch");
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...data } = form;
      await register({ ...data, language: lang });
      router.push("/patient");
    } catch (err) {
      const e = err as ApiError;
      setError(e.status === 409 ? t("auth.emailTaken") : e.message);
      setLoading(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="container section" style={{ maxWidth: 620 }}>
      <div className="card" style={{ padding: 28 }}>
        <h1 style={{ fontSize: "1.8rem" }}>{t("auth.registerTitle")}</h1>
        <p className="mt-1 mb-3">{t("auth.registerSubtitle")}</p>
        <form onSubmit={submit} className="form-grid" noValidate>
          {error && <div className="alert alert-error full" role="alert">{error}</div>}
          <label className="field">
            <span>{t("auth.firstName")} *</span>
            <input className="input" required autoComplete="given-name" value={form.firstName} onChange={set("firstName")} />
          </label>
          <label className="field">
            <span>{t("auth.lastName")} *</span>
            <input className="input" required autoComplete="family-name" value={form.lastName} onChange={set("lastName")} />
          </label>
          <label className="field">
            <span>{t("auth.email")} *</span>
            <input className="input" type="email" required autoComplete="email" value={form.email} onChange={set("email")} />
          </label>
          <label className="field">
            <span>{t("auth.phone")}</span>
            <input className="input" type="tel" autoComplete="tel" placeholder="+374 ..." value={form.phone} onChange={set("phone")} />
          </label>
          <label className="field full">
            <span>{t("auth.birthDate")}</span>
            <input className="input" type="date" max={today} value={form.birthDate} onChange={set("birthDate")} />
          </label>
          <label className="field">
            <span>{t("auth.password")} *</span>
            <input className="input" type="password" required autoComplete="new-password" value={form.password} onChange={set("password")} />
            {errors.password ? <span className="field-error">{errors.password}</span> : <span className="hint">{t("auth.pwMin")}</span>}
          </label>
          <label className="field">
            <span>{t("auth.confirmPassword")} *</span>
            <input className="input" type="password" required autoComplete="new-password" value={form.confirmPassword} onChange={set("confirmPassword")} />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </label>
          <button className="btn btn-primary btn-lg full" disabled={loading || !form.firstName || !form.lastName || !form.email}>
            {loading ? t("common.loading") : t("auth.registerBtn")}
          </button>
        </form>
        <p className="mt-3 center small">
          {t("auth.haveAccount")} <Link href="/login">{t("auth.loginLink")}</Link>
        </p>
      </div>
    </div>
  );
}
