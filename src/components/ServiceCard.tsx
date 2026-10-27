import Link from "next/link";
import type { Formatters, TFunction } from "@/i18n/translate";
import { deptName } from "@/i18n/translate";
import Icon from "./Icon";

export type ServiceCardData = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  durationMin: number;
  department?: { name: string; slug: string } | null;
};

export default function ServiceCard({ service, t, f, showDept = true }: { service: ServiceCardData; t: TFunction; f: Formatters; showDept?: boolean }) {
  return (
    <article className="card card-hover service-card">
      {showDept && service.department && <span className="badge badge-primary" style={{ alignSelf: "flex-start" }}>{deptName(t, service.department)}</span>}
      <h3 className="card-title">{service.name}</h3>
      {service.description && <p className="small">{service.description}</p>}
      <div className="foot">
        <div>
          <div className="price">{f.money(service.price)}</div>
          <div className="xs muted with-icon"><Icon name="timer" size={14} /> {t("services.duration", { n: service.durationMin })}</div>
        </div>
        {service.department && (
          <Link className="btn btn-sm" href={`/book?department=${service.department.slug}&serviceId=${service.id}`}>
            {t("services.book")}
          </Link>
        )}
      </div>
    </article>
  );
}
