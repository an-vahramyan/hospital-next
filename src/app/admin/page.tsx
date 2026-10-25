"use client";

import Link from "next/link";
import { adminApi } from "@/lib/client/api";
import { useFetch } from "@/lib/client/hooks";
import { useI18n } from "@/i18n/I18nProvider";
import { deptName } from "@/i18n/translate";
import { Empty, ErrorAlert, Spinner, StatusBadge } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function AdminDashboard() {
  const { t, f } = useI18n();
  const { data, loading, error, reload } = useFetch(() => adminApi.stats());
  if (loading && !data) return <Spinner />;
  return (
    <>
      <div className="row-between">
        <h1>{t("admin.dashboard")}</h1>
        <button className="btn btn-sm" onClick={reload}>↻ {t("common.refresh")}</button>
      </div>
      <ErrorAlert error={error} t={t} />
      {data && (
        <>
          <div className="stats">
            <Link href="/admin/patients" className="stat card-hover" style={{ textDecoration: "none" }}><div className="stat-icon">🧑‍🤝‍🧑</div><div className="stat-value">{data.patients}</div><div className="stat-label">{t("admin.statPatients")}</div></Link>
            <Link href="/admin/doctors" className="stat card-hover" style={{ textDecoration: "none" }}><div className="stat-icon">👩‍⚕️</div><div className="stat-value">{data.doctors}</div><div className="stat-label">{t("admin.statDoctors")}</div></Link>
            <Link href="/admin/appointments" className="stat card-hover" style={{ textDecoration: "none" }}><div className="stat-icon">📅</div><div className="stat-value">{data.todayAppointments}</div><div className="stat-label">{t("admin.statToday")}</div></Link>
            <Link href="/admin/equipment" className="stat card-hover" style={{ textDecoration: "none" }}><div className="stat-icon">🩻</div><div className="stat-value">{data.equipment}</div><div className="stat-label">{t("admin.statEquipment")}</div></Link>
          </div>
          {data.failedPharmacyRequests > 0 && (
            <div className="alert alert-warning">⚠ {t("admin.pharmacyFailed")}: <b>{data.failedPharmacyRequests}</b></div>
          )}
          <section className="card stack">
            <h3>{t("admin.todayList")}</h3>
            {data.today.length === 0 ? <Empty icon="🗓️" title={t("admin.noToday")} /> : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>{t("common.time")}</th><th>{t("common.patient")}</th><th>{t("common.doctor")}</th><th>{t("common.service")}</th><th>{t("common.status")}</th></tr></thead>
                  <tbody>
                    {data.today.map((a: any) => (
                      <tr key={a.id}>
                        <td><strong>{f.time(a.startsAt)}</strong></td>
                        <td>{a.patient.user.firstName} {a.patient.user.lastName}</td>
                        <td>{a.doctor.user.firstName} {a.doctor.user.lastName}<div className="xs muted">{deptName(t, a.doctor.department)}</div></td>
                        <td className="small">{a.service?.name ?? "—"}</td>
                        <td><StatusBadge status={a.status} t={t} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
