"use client";
import { useI18n } from "@/i18n/I18nProvider";
import { LANGS } from "@/i18n/types";

const LABELS = { hy: "Հայ", en: "En", ru: "Ру" } as const;

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div className="lang-switch" role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} title={l.toUpperCase()}>
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
