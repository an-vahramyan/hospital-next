"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";

export default function RegisterForm() {
  const { t } = useI18n();

  // TODO 1 — State:
  //   form: { firstName, lastName, email, phone, birthDate, password, confirmPassword }   (one object)
  //   errors: Record<string, string>  — per-field messages shown under the inputs
  //   error: string | null            — general server error
  //   loading: boolean
  //   Tip: a helper `set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))` avoids 7 copies.
  //
  // TODO 2 — Tools you will need:
  //   const { register } = useAuth();      from "@/context/AuthContext"
  //   const { lang } = useI18n();          (sent to the server as the user's language)
  //   const router = useRouter();          from "next/navigation"
  //   type ApiError                        from "@/lib/client/api"
  //
  // TODO 3 — Client-side validation (before the request). Messages already exist in the dictionaries:
  //   password length >= 8      → t("auth.pwMin")
  //   password === confirm      → t("auth.pwMismatch")
  //   Think about more: required names, email format, phone format, birthDate not in the future.
  //   Write errors into `errors` and stop if there are any.
  //
  // TODO 4 — Submit: call register({ ...everything except confirmPassword, language: lang }), then
  //   router.push("/patient"). On error: 409 → t("auth.emailTaken"), otherwise err.message. Reset loading on failure.
  //   The server validates too (see registerSchema in src/lib/schemas.ts) — errors come back as 400 with details.
  //
  // TODO 5 — Wire all inputs (value/onChange), show errors[...] in <span className="field-error">,
  //   and disable the submit button while loading.

  const today = new Date().toISOString().slice(0, 10); // upper limit for the birth date

  return (
    <div className="container section" style={{ maxWidth: 620 }}>
      <div className="card" style={{ padding: 28 }}>
        <h1 style={{ fontSize: "1.8rem" }}>{t("auth.registerTitle")}</h1>
        <p className="mt-1 mb-3">{t("auth.registerSubtitle")}</p>
        <form className="form-grid" noValidate>
          {/* TODO: when `error` is set, render: <div className="alert alert-error full" role="alert">{error}</div> */}
          <label className="field">
            <span>{t("auth.firstName")} *</span>
            <input className="input" autoComplete="given-name" />
          </label>
          <label className="field">
            <span>{t("auth.lastName")} *</span>
            <input className="input" autoComplete="family-name" />
          </label>
          <label className="field">
            <span>{t("auth.email")} *</span>
            <input className="input" type="email" autoComplete="email" />
          </label>
          <label className="field">
            <span>{t("auth.phone")}</span>
            <input className="input" type="tel" autoComplete="tel" placeholder="+374 ..." />
          </label>
          <label className="field full">
            <span>{t("auth.birthDate")}</span>
            <input className="input" type="date" max={today} />
          </label>
          <label className="field">
            <span>{t("auth.password")} *</span>
            <input className="input" type="password" autoComplete="new-password" />
            {/* TODO: show <span className="field-error">…</span> when invalid, otherwise the hint below */}
            <span className="hint">{t("auth.pwMin")}</span>
          </label>
          <label className="field">
            <span>{t("auth.confirmPassword")} *</span>
            <input className="input" type="password" autoComplete="new-password" />
            {/* TODO: <span className="field-error">…</span> for the mismatch message */}
          </label>
          <button className="btn btn-primary btn-lg full">{t("auth.registerBtn")}</button>
        </form>
        <p className="mt-3 center small">
          {t("auth.haveAccount")} <Link href="/login">{t("auth.loginLink")}</Link>
        </p>
      </div>
    </div>
  );
}
