"use client";

import Link from "next/link";
import { appointmentsApi, patientApi } from "@/lib/client/api";
import { useFetch } from "@/lib/client/hooks";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n/I18nProvider";
import { deptName } from "@/i18n/translate";
import { ErrorAlert, Spinner, StatusBadge } from "@/components/ui";
import Icon from "@/components/Icon";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function PatientDashboard() {
  const { t, f } = useI18n();
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(async () => {
    const [appointments, prescriptions, examinations, notifications, visits] = await Promise.all([
      appointmentsApi.my(), patientApi.prescriptions(), patientApi.examinations(), patientApi.notifications(), patientApi.visits(),
    ]);
    return { appointments, prescriptions, examinations, notifications, visits };
  });

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorAlert error={error} t={t} />;
  if (!data) return null;

  const now = Date.now();
  const next = data.appointments
    .filter((a: any) => a.status === "BOOKED" && new Date(a.startsAt).getTime() > now)
    .sort((a: any, b: any) => +new Date(a.startsAt) - +new Date(b.startsAt))[0];
  const lastRx = data.prescriptions[0];
  const lastExam = data.examinations[0];
  const unread = data.notifications.filter((n: any) => !n.isRead);

  async function markRead() {
    await patientApi.markNotificationsRead();
    reload();
  }

  return (
    <>
      <div className="row-between">
        <h1>{t("patient.greeting", { name: user?.firstName ?? "" })}</h1>
        <Link className="btn btn-primary" href="/book"><Icon name="calendar" size={18} /> {t("patient.bookNew")}</Link>
      </div>

      <div className="grid grid-2">
        <section className="card stack-sm">
          <p className="small with-icon"><Icon name="calendar" size={16} /> {t("patient.nextVisit")}</p>
          {next ? (
            <>
              <h3 style={{ fontSize: "1.3rem" }}>{f.weekday(next.startsAt)}, {f.time(next.startsAt)}</h3>
              <p>{next.doctor.user.firstName} {next.doctor.user.lastName} · {deptName(t, next.doctor.department)}</p>
              {next.service && <p className="small">{next.service.name}</p>}
              <Link href="/patient/appointments" className="small">{t("common.details")} →</Link>
            </>
          ) : (
            <p>{t("patient.noNextVisit")}</p>
          )}
        </section>

        <section className="card stack-sm">
          <p className="small with-icon"><Icon name="fileText" size={16} /> {t("patient.lastPrescription")}</p>
          {lastRx ? (
            <>
              <div className="row"><h3>{lastRx.code}</h3><StatusBadge status={lastRx.status} t={t} /></div>
              <p className="small">{lastRx.items.map((i: any) => `${i.medicineName} ${i.dosage}`).join(", ")}</p>
              <p className="xs muted">{t("patient.validUntil")}: {f.date(lastRx.validUntil)}</p>
              {lastRx.status === "ACTIVE" && (
                <Link href={`/patient/medicines?prescription=${lastRx.id}`} className="btn btn-sm" style={{ alignSelf: "flex-start" }}>
                  <Icon name="pill" size={16} /> {t("patient.checkPharmacy")}
                </Link>
              )}
            </>
          ) : <p>{t("patient.noPrescriptions")}</p>}
        </section>

        <section className="card stack-sm">
          <p className="small with-icon"><Icon name="flask" size={16} /> {t("patient.lastExam")}</p>
          {lastExam ? (
            <>
              <div className="row"><h3>{lastExam.type}</h3><StatusBadge status={lastExam.status} t={t} /></div>
              <p className="small">{lastExam.result ?? t("patient.waitingResult")}</p>
            </>
          ) : <p>{t("patient.noExams")}</p>}
        </section>

        <section className="card stack-sm">
          <div className="row-between">
            <p className="small with-icon"><Icon name="bell" size={16} /> {t("patient.notifications")} {unread.length > 0 && <span className="badge badge-primary">{unread.length}</span>}</p>
            {unread.length > 0 && <button className="btn btn-sm btn-ghost" onClick={markRead}>{t("patient.markRead")}</button>}
          </div>
          {data.notifications.length === 0 ? (
            <p>{t("patient.noNotifications")}</p>
          ) : (
            <div className="stack-sm">
              {data.notifications.slice(0, 4).map((n: any) => (
                <div key={n.id} className={`notif ${n.isRead ? "" : "unread"}`}>
                  {n.type === "RESERVATION_READY" ? <Icon name="checkCircle" className="notif-icon ok" /> : n.type === "OUT_OF_STOCK" ? <Icon name="alert" className="notif-icon warn" /> : <Icon name="info" className="notif-icon" />}
                  <div>
                    <div className="small" style={{ color: "var(--text)" }}>{n.message}</div>
                    <div className="xs muted">{f.dateTime(n.createdAt)}{n.prescriptionCode && ` · ${n.prescriptionCode}`}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="card">
        <h3 className="mb-1 with-icon"><Icon name="folder" size={20} /> {t("patient.visits")}</h3>
        {data.visits.length === 0 ? <p>{t("patient.noVisits")}</p> : (
          <div className="list">
            {data.visits.map((v: any) => (
              <div key={v.id} className="list-item">
                <div>
                  <strong>{f.date(v.date)}</strong> · {v.doctor.user.firstName} {v.doctor.user.lastName} ({deptName(t, v.doctor.department)})
                  {v.diagnosis && <div className="small">{t("patient.diagnosis")}: <b style={{ color: "var(--text)" }}>{v.diagnosis}</b></div>}
                  {v.notes && <div className="small">{v.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
