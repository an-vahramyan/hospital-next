import { getI18n } from "@/i18n/server";
import { listDepartments } from "@/lib/services/catalog.service";
import QueueClient from "./QueueClient";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("queue.title") };
}

export default async function QueuePage() {
  const { t } = await getI18n();
  const departments = (await listDepartments()).map(({ id, slug, name }) => ({ id, slug, name }));
  return (
    <div className="container">
      <div className="page-head">
        <h1>{t("queue.title")}</h1>
        <p>{t("queue.subtitle")}</p>
      </div>
      <div className="section-sm">
        <QueueClient departments={departments} />
      </div>
    </div>
  );
}
