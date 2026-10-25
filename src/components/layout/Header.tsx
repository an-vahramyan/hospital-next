"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth, homeForRole } from "@/context/AuthContext";
import { useI18n } from "@/i18n/I18nProvider";
import LanguageSwitcher from "./LanguageSwitcher";

const NAV = [
  { href: "/", key: "nav.home" },
  { href: "/doctors", key: "nav.doctors" },
  { href: "/services", key: "nav.services" },
  { href: "/equipment", key: "nav.equipment" },
  { href: "/articles", key: "nav.articles" },
  { href: "/queue", key: "nav.queue" },
];

export default function Header() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const cabinetLabel = user?.role === "ADMIN" ? t("nav.admin") : user?.role === "DOCTOR" ? t("nav.doctorCabinet") : t("nav.myPage");

  const accountButtons = user ? (
    <>
      <Link className="btn btn-sm" href={homeForRole(user.role)}>👤 {cabinetLabel}</Link>
      <button className="btn btn-sm btn-ghost" onClick={logout}>{t("nav.logout")}</button>
    </>
  ) : (
    <Link className="btn btn-sm" href="/login">{t("nav.login")}</Link>
  );

  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="logo" aria-label={t("brand.name")}>
          <span className="logo-mark" aria-hidden>✚</span>
          <span className="logo-text">
            {t("brand.name")}
            <small>{t("brand.tagline")}</small>
          </span>
        </Link>

        <nav className="nav" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={isActive(n.href) ? "active" : ""}>
              {t(n.key)}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <span className="desktop-only"><LanguageSwitcher /></span>
          <span className="desktop-only row" style={{ gap: 8 }}>{accountButtons}</span>
          {!user && <Link className="btn btn-sm btn-primary desktop-only" href="/book">{t("nav.book")}</Link>}
          <button className="icon-btn burger" aria-label={t("nav.menu")} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      <div className="mobile-nav" hidden={!open}>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={isActive(n.href) ? "active" : ""}>{t(n.key)}</Link>
        ))}
        <div className="row">
          <LanguageSwitcher />
          {accountButtons}
          {(!user || user.role === "PATIENT") && <Link className="btn btn-sm btn-primary" href="/book">{t("nav.book")}</Link>}
        </div>
      </div>
    </header>
  );
}
