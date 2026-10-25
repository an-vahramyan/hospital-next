import { Suspense } from "react";
import { getI18n } from "@/i18n/server";
import { listDepartments, listDoctors } from "@/lib/services/catalog.service";
import DoctorCard from "@/components/DoctorCard";
import { Empty } from "@/components/ui";
import DoctorFilters from "./DoctorFilters";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("doctors.title") };
}

export default async function DoctorsPage({ searchParams }: { searchParams: Promise<{ q?: string; department?: string }> }) {
  const { q, department } = await searchParams;
  const { t } = await getI18n();
  const [departments, doctors] = await Promise.all([listDepartments(), listDoctors({ q, department })]);

  return (
    <div className="container">
      <div className="page-head">
        <h1>{t("doctors.title")}</h1>
        <p>{t("doctors.subtitle")}</p>
      </div>
      <div className="section-sm">
        <Suspense>
          <DoctorFilters departments={departments} />
        </Suspense>
        <p className="small mb-2">{t("doctors.found", { n: doctors.length })}</p>
        {doctors.length === 0 ? (
          <Empty icon="🔍" title={t("doctors.notFound")} hint={t("doctors.notFoundHint")} />
        ) : (
          <div className="grid grid-auto">
            {doctors.map((d) => <DoctorCard key={d.id} doctor={d} t={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}
