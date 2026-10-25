import { getI18n } from "@/i18n/server";
import { deptName } from "@/i18n/translate";
import { listDepartments, listServices } from "@/lib/services/catalog.service";
import ServiceCard from "@/components/ServiceCard";
import { Empty } from "@/components/ui";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("services.title") };
}

export default async function ServicesPage() {
  const { t, f } = await getI18n();
  const [departments, services] = await Promise.all([listDepartments(), listServices()]);
  const groups = departments
    .map((d) => ({ dept: d, items: services.filter((s) => s.departmentId === d.id) }))
    .filter((g) => g.items.length);

  return (
    <div className="container">
      <div className="page-head">
        <h1>{t("services.title")}</h1>
        <p>{t("services.subtitle")}</p>
      </div>
      <div className="section-sm">
        {groups.length === 0 && <Empty title={t("common.empty")} />}
        {groups.map(({ dept, items }) => (
          <section key={dept.id} className="dept-group" id={dept.slug}>
            <div className="dept-title">
              <h2>{deptName(t, dept)}</h2>
              <span className="badge">{items.length}</span>
            </div>
            {dept.description && <p className="mb-2">{dept.description}</p>}
            <div className="grid grid-3">
              {items.map((s) => <ServiceCard key={s.id} service={s} t={t} f={f} showDept={false} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
