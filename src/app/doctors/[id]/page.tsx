import Link from "next/link";
import { notFound } from "next/navigation";
import { getI18n } from "@/i18n/server";
import { deptName } from "@/i18n/translate";
import { getDoctor } from "@/lib/services/catalog.service";
import { Avatar } from "@/components/ui";
import ServiceCard from "@/components/ServiceCard";

async function load(id: string) {
  const n = Number(id);
  if (!Number.isInteger(n)) return null;
  return getDoctor(n).catch(() => null);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const d = await load((await params).id);
  return { title: d ? `${d.user.firstName} ${d.user.lastName}` : "404" };
}

export default async function DoctorPage({ params }: { params: Promise<{ id: string }> }) {
  const doctor = await load((await params).id);
  if (!doctor) notFound();
  const { t, f } = await getI18n();

  return (
    <div className="container section-sm">
      <Link href="/doctors" className="small">← {t("doctors.title")}</Link>
      <div className="card mt-2" style={{ padding: 28 }}>
        <div className="row" style={{ gap: 24, alignItems: "flex-start" }}>
          <Avatar size="lg" firstName={doctor.user.firstName} lastName={doctor.user.lastName} photoUrl={doctor.photoUrl} />
          <div className="stack-sm" style={{ flex: 1, minWidth: 240 }}>
            <h1>{doctor.user.firstName} {doctor.user.lastName}</h1>
            <p style={{ fontSize: "1.1rem" }}>{doctor.specialty}</p>
            <div className="row">
              <Link className="badge badge-primary" href={`/doctors?department=${doctor.department.slug}`}>{deptName(t, doctor.department)}</Link>
              <span className="badge">{t("doctors.experience", { n: doctor.experienceYears })}</span>
            </div>
            <dl className="kv mt-2">
              <dt>🕒 {t("doctors.workHours")}</dt><dd>{doctor.workStart} – {doctor.workEnd}</dd>
              <dt>⏱ {t("doctors.slotLength")}</dt><dd>{t("services.duration", { n: doctor.slotMinutes })}</dd>
            </dl>
          </div>
          <Link className="btn btn-primary btn-lg" href={`/book?doctorId=${doctor.id}`}>📅 {t("doctors.book")}</Link>
        </div>
        {doctor.bio && (
          <div className="mt-3">
            <h3>{t("doctors.bio")}</h3>
            <p className="mt-1" style={{ color: "var(--text)" }}>{doctor.bio}</p>
          </div>
        )}
      </div>

      {doctor.department.services.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-2">{t("doctors.servicesOfDept")}</h2>
          <div className="grid grid-3">
            {doctor.department.services.map((s) => (
              <ServiceCard key={s.id} service={{ ...s, department: doctor.department }} t={t} f={f} showDept={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
