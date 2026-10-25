"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";

export type DashLink = { href: string; label: string; icon: string; exact?: boolean };

export default function DashNav({ title, links }: { title: string; links: DashLink[] }) {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <nav className="sidebar" aria-label={t(title)}>
      <div className="sidebar-title">{t(title)}</div>
      {links.map((l) => {
        const active = l.exact ? pathname === l.href : pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link key={l.href} href={l.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
            <span aria-hidden>{l.icon}</span> {t(l.label)}
          </Link>
        );
      })}
    </nav>
  );
}
