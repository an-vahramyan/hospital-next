"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth, homeForRole } from "@/context/AuthContext";
import { useI18n } from "@/i18n/I18nProvider";
import type { ApiError } from "@/lib/client/api";

const DEMO = [
  ["patient@hospital.am", "Patient123!"],
  ["doctor@hospital.am", "Doctor123!"],
  ["admin@hospital.am", "Admin123!"],
];

export default function LoginForm() {
  const { t } = useI18n();
  const { login } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      router.push(safeNext ?? homeForRole(user.role));
    } catch (err) {
      const e = err as ApiError;
      setError(e.status === 401 ? t("auth.invalid") : e.status === 429 ? t("errors.tooMany") : e.message);
      setLoading(false);
    }
  }

  return (
    <div className="container section" style={{ maxWidth: 460 }}>
      <div className="card" style={{ padding: 28 }}>
        <h1 style={{ fontSize: "1.8rem" }}>{t("auth.loginTitle")}</h1>
        <p className="mt-1 mb-3">{t("auth.loginSubtitle")}</p>
        <form onSubmit={submit} className="stack">
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          <label className="field">
            <span>{t("auth.email")}</span>
            <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span>{t("auth.password")}</span>
            <input className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button className="btn btn-primary btn-lg" disabled={loading}>{loading ? t("common.loading") : t("auth.loginBtn")}</button>
        </form>
        <p className="mt-3 center small">
          {t("auth.noAccount")} <Link href="/register">{t("auth.registerLink")}</Link>
        </p>
      </div>
      <div className="card-flat mt-2">
        <p className="xs" style={{ fontWeight: 700 }}>{t("auth.demo")}</p>
        <div className="stack-sm mt-1">
          {DEMO.map(([e, p]) => (
            <button key={e} type="button" className="btn btn-sm btn-ghost" style={{ justifyContent: "space-between" }} onClick={() => { setEmail(e); setPassword(p); }}>
              <span>{e}</span><code className="xs">{p}</code>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
