"use client";

import { useState } from "react";
import { adminApi } from "@/lib/client/api";
import { useFetch } from "@/lib/client/hooks";
import { useI18n } from "@/i18n/I18nProvider";
import { deptName } from "@/i18n/translate";
import { Empty, ErrorAlert, Spinner } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */
const STATUSES = ["BOOKED", "COMPLETED", "CANCELLED", "NO_SHOW"];

export default function ManageAppointments() {
  const { t, f } = useI18n();
  const [filters, setFilters] = useState({ date: "", doctorId: "", status: "" });
  const doctors = useFetch(() => adminApi.list("doctors"));
  const list = useFetch(() => adminApi.list("appointments", filters), [filters.date, filters.doctorId, filters.status]);
  const [error, setError] = useState<unknown>(null);

  async function setStatus(id: number, status: string) {
    setError(null);
    try {
      await adminApi.patch("appointments", id, { status });
      list.reload();
    } catch (e) { setError(e); }
  }

  const set = (k: keyof typeof filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFilters((s) => ({ ...s, [k]: e.target.value }));

  return (
    <>
      <h1>{t("admin.appointments")}</h1>
      <div className="card row">
        <input className="input" type="date" value={filters.date} onChange={set("date")} style={{ width: 180 }} aria-label={t("common.date")} />
        <select className="select" value={filters.doctorId} onChange={set("doctorId")} style={{ width: 240 }} aria-label={t("common.doctor")}>
          <option value="">{t("admin.allDoctors")}</option>
          {doctors.data?.map((d: any) => <option key={d.id} value={d.id}>{d.user.firstName} {d.user.lastName}</option>)}
        </select>
        <select className="select" value={filters.status} onChange={set("status")} style={{ width: 200 }} aria-label={t("common.status")}>
          <option value="">{t("admin.allStatuses")}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
        </select>
        {(filters.date || filters.doctorId || filters.status) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ date: "", doctorId: "", status: "" })}>✕</button>
        )}
      </div>
      <ErrorAlert error={error || list.error} t={t} />
      {list.loading && !list.data ? <Spinner /> : !list.data?.length ? <Empty title={t("common.empty")} /> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{t("common.date")}</th><th>{t("common.patient")}</th><th>{t("common.doctor")}</th><th>{t("common.service")}</th><th>{t("common.status")}</th></tr></thead>
            <tbody>
              {list.data.map((a: any) => (
                <tr key={a.id}>
                  <td className="nowrap"><strong>{f.dateShort(a.startsAt)}</strong> {f.time(a.startsAt)}</td>
                  <td>{a.patient.user.firstName} {a.patient.user.lastName}<div className="xs muted">{a.patient.user.phone}</div></td>
                  <td>{a.doctor.user.firstName} {a.doctor.user.lastName}<div className="xs muted">{deptName(t, a.doctor.department)}</div></td>
                  <td className="small">{a.service?.name ?? "—"}</td>
                  <td>
                    <select className="select" style={{ minWidth: 150, minHeight: 34, padding: "4px 8px" }} value={a.status} onChange={(e) => setStatus(a.id, e.target.value)}>
                      {STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
