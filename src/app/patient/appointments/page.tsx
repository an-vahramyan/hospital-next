"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { appointmentsApi } from "@/lib/client/api";
import { useFetch } from "@/lib/client/hooks";
import { useI18n } from "@/i18n/I18nProvider";
import { deptName } from "@/i18n/translate";
import { Empty, ErrorAlert, Spinner, StatusBadge } from "@/components/ui";
import Icon from "@/components/Icon";

/* eslint-disable @typescript-eslint/no-explicit-any */
function AppointmentsInner() {
  const { t, f } = useI18n();
  const booked = useSearchParams().get("booked");
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [actionError, setActionError] = useState<unknown>(null);
  const { data, loading, error, reload } = useFetch(() => appointmentsApi.my());

  const now = Date.now();
  const list = (data ?? []).filter((a: any) =>
    tab === "upcoming" ? new Date(a.startsAt).getTime() > now && a.status === "BOOKED" : !(new Date(a.startsAt).getTime() > now && a.status === "BOOKED"),
  );
  if (tab === "upcoming") list.sort((a: any, b: any) => +new Date(a.startsAt) - +new Date(b.startsAt));

  async function cancel(id: number) {
    if (!confirm(t("patient.cancelConfirm"))) return;
    setActionError(null);
    try { await appointmentsApi.cancel(id); reload(); } catch (e) { setActionError(e); }
  }

  return (
    <>
      <div className="row-between">
        <h1>{t("patient.appointments")}</h1>
        <Link className="btn btn-primary" href="/book"><Icon name="calendar" size={18} /> {t("patient.bookNew")}</Link>
      </div>
      {booked && <div className="alert alert-success with-icon"><Icon name="checkCircle" size={18} /> {t("book.success")}</div>}
      <div className="tabs" role="tablist">
        <button className="tab" role="tab" aria-selected={tab === "upcoming"} onClick={() => setTab("upcoming")}>{t("patient.upcoming")}</button>
        <button className="tab" role="tab" aria-selected={tab === "past"} onClick={() => setTab("past")}>{t("patient.past")}</button>
      </div>
      <ErrorAlert error={error || actionError} t={t} />
      {loading && !data ? <Spinner /> : list.length === 0 ? (
        <Empty icon="calendar" title={t("patient.noAppointments")} />
      ) : (
        <div className="stack">
          {list.map((a: any) => (
            <div key={a.id} className="card row-between">
              <div className="stack-sm">
                <div className="row">
                  <strong style={{ fontSize: "1.1rem" }}>{f.weekday(a.startsAt)}, {f.time(a.startsAt)}</strong>
                  <StatusBadge status={a.status} t={t} />
                </div>
                <span>{a.doctor.user.firstName} {a.doctor.user.lastName} · {a.doctor.specialty} · {deptName(t, a.doctor.department)}</span>
                {a.service && <span className="small">{a.service.name} — {f.money(a.service.price)}</span>}
                {a.notes && <span className="small"><Icon name="message" size={13} /> {a.notes}</span>}
              </div>
              {a.status === "BOOKED" && new Date(a.startsAt).getTime() > now && (
                <button className="btn btn-danger btn-sm" onClick={() => cancel(a.id)}>{t("patient.cancelBtn")}</button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function AppointmentsPage() {
  return <Suspense><AppointmentsInner /></Suspense>;
}
