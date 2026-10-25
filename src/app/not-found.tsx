import Link from "next/link";
import { getI18n } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <div className="container section center">
      <div style={{ fontSize: "5rem", fontWeight: 900, color: "var(--primary)", lineHeight: 1 }}>404</div>
      <h1 className="mt-2">{t("notFound.title")}</h1>
      <p className="mt-1">{t("notFound.text")}</p>
      <Link href="/" className="btn btn-primary mt-3">{t("notFound.home")}</Link>
    </div>
  );
}
