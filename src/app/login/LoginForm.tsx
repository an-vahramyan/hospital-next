"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";

// Demo accounts: clicking one should fill the form (see TODO 5).
const DEMO = [
  ["patient@hospital.am", "Patient123!"],
  ["doctor@hospital.am", "Doctor123!"],
  ["admin@hospital.am", "Admin123!"],
];

export default function LoginForm() {
  const { t } = useI18n();

  // TODO 1 — State: email, password, error (string | null), loading (boolean).        [useState]
  // TODO 2 — Tools you will need:
  //   const { login } = useAuth();                        from "@/context/AuthContext" (also exports homeForRole)
  //   const router = useRouter();                         from "next/navigation"
  //   const next = useSearchParams().get("next");         from "next/navigation"
  //   type ApiError                                       from "@/lib/client/api" (has .status, .code, .message)
  //
  // TODO 3 — async function submit(e: React.FormEvent):
  //   a) e.preventDefault(); set loading = true, clear the error
  //   b) client-side validation BEFORE the request (empty email, bad format, empty password)
  //   c) const user = await login(email, password)   (inside try/catch)
  //   d) redirect: to `next` ONLY if it starts with "/" and not with "//" (open-redirect protection),
  //      otherwise to homeForRole(user.role)
  //   e) on error show a human message: 401 → t("auth.invalid"), 429 → t("errors.tooMany"), else err.message;
  //      always set loading back to false on failure
  //
  // TODO 4 — Wire the inputs below: value + onChange (controlled inputs), disable the button while loading.
  // TODO 5 — Demo buttons: onClick should set email and password to the chosen account.

  return (
    <div className="container section" style={{ maxWidth: 460 }}>
      <div className="card" style={{ padding: 28 }}>
        <h1 style={{ fontSize: "1.8rem" }}>{t("auth.loginTitle")}</h1>
        <p className="mt-1 mb-3">{t("auth.loginSubtitle")}</p>
        <form className="stack">
          {/* TODO: when `error` is set, render: <div className="alert alert-error" role="alert">{error}</div> */}
          <label className="field">
            <span>{t("auth.email")}</span>
            <input className="input" type="email" autoComplete="email" />
          </label>
          <label className="field">
            <span>{t("auth.password")}</span>
            <input className="input" type="password" autoComplete="current-password" />
          </label>
          <button className="btn btn-primary btn-lg">{t("auth.loginBtn")}</button>
        </form>
        <p className="mt-3 center small">
          {t("auth.noAccount")} <Link href="/register">{t("auth.registerLink")}</Link>
        </p>
      </div>
      <div className="card-flat mt-2">
        <p className="xs" style={{ fontWeight: 700 }}>{t("auth.demo")}</p>
        <div className="stack-sm mt-1">
          {DEMO.map(([e, p]) => (
            <button key={e} type="button" className="btn btn-sm btn-ghost" style={{ justifyContent: "space-between" }}>
              <span>{e}</span><code className="xs">{p}</code>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
