"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth, homeForRole } from "@/context/AuthContext";
import type { ApiError } from "@/lib/client/api";

// Demo accounts: clicking one fills the form.
const DEMO = [
  ["patient@hospital.am", "Patient123!"],
  ["doctor@hospital.am", "Doctor123!"],
  ["admin@hospital.am", "Admin123!"],
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    if (!email.trim() || !EMAIL_RE.test(email.trim()) || !password) {
      setError(t("auth.invalid"));
      setLoading(false);
      return;
    }

    try {
      const user = await login(email.trim(), password);
      // Open-redirect protection: only same-origin relative paths.
      const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      router.push(safe ?? homeForRole(user.role));
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 401) setError(t("auth.invalid"));
      else if (apiErr.status === 429) setError(t("errors.tooMany"));
      else setError(apiErr.message || t("auth.invalid"));
      setLoading(false);
    }
  }

  return (
    <div className="container section" style={{ maxWidth: 460 }}>
      <div className="card" style={{ padding: 28 }}>
        <h1 style={{ fontSize: "1.8rem" }}>{t("auth.loginTitle")}</h1>
        <p className="mt-1 mb-3">{t("auth.loginSubtitle")}</p>
        <form className="stack" onSubmit={submit}>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          <label className="field">
            <span>{t("auth.email")}</span>
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="field">
            <span>{t("auth.password")}</span>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="btn btn-primary btn-lg" disabled={loading}>{t("auth.loginBtn")}</button>
        </form>
        <p className="mt-3 center small">
          {t("auth.noAccount")} <Link href="/register">{t("auth.registerLink")}</Link>
        </p>
      </div>
      <div className="card-flat mt-2">
        <p className="xs" style={{ fontWeight: 700 }}>{t("auth.demo")}</p>
        <div className="stack-sm mt-1">
          {DEMO.map(([e, p]) => (
            <button
              key={e}
              type="button"
              className="btn btn-sm btn-ghost"
              style={{ justifyContent: "space-between" }}
              onClick={() => {
                setEmail(e);
                setPassword(p);
              }}
            >
              <span>{e}</span><code className="xs">{p}</code>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
