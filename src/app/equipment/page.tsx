import { getI18n } from "@/i18n/server";
import { listEquipment } from "@/lib/services/catalog.service";
import { Empty } from "@/components/ui";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("equipment.title") };
}

export default async function EquipmentPage() {
  const { t, f } = await getI18n();
  const items = await listEquipment();
  return (
    <div className="container">
      <div className="page-head">
        <h1>{t("equipment.title")}</h1>
        <p>{t("equipment.subtitle")}</p>
      </div>
      <div className="section-sm">
        {items.length === 0 ? (
          <Empty title={t("common.empty")} />
        ) : (
          <div className="grid grid-3">
            {items.map((e) => (
              <article key={e.id} className="card equip-card card-hover">
                <div className="equip-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {e.imageUrl ? <img src={e.imageUrl} alt={e.name} /> : <span aria-hidden>🩻</span>}
                  {e.isNew && <span className="badge badge-new">{t("equipment.new")}</span>}
                </div>
                <div className="equip-body">
                  <h3 className="card-title">{e.name}</h3>
                  {e.description && <p className="small">{e.description}</p>}
                  {e.acquiredAt && <span className="xs muted">{t("equipment.acquired", { date: f.date(e.acquiredAt) })}</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
