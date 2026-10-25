"use client";
import { useI18n } from "@/i18n/I18nProvider";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="container section center">
      <div style={{ fontSize: "3rem" }}>⚠️</div>
      <h1 className="mt-2">{t("errors.generic")}</h1>
      <button className="btn btn-primary mt-3" onClick={reset}>{t("common.retry")}</button>
    </div>
  );
}
