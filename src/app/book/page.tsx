import { Suspense } from "react";
import { getI18n } from "@/i18n/server";
import { listDepartments } from "@/lib/services/catalog.service";
import BookingWizard from "./BookingWizard";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("book.title") };
}

export default async function BookPage() {
  const { t } = await getI18n();
  const departments = (await listDepartments()).map(({ id, slug, name }) => ({ id, slug, name }));
  return (
    <div className="container">
      <div className="page-head">
        <h1>{t("book.title")}</h1>
        <p>{t("book.subtitle")}</p>
      </div>
      <div className="section-sm">
        <Suspense>
          <BookingWizard departments={departments} />
        </Suspense>
      </div>
    </div>
  );
}
