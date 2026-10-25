"use client";

import Link from "next/link";
import { useState } from "react";
import { appointmentsApi, clinicalApi, queueApi } from "@/lib/client/api";
import { todayStr, useFetch } from "@/lib/client/hooks";
import { useI18n } from "@/i18n/I18nProvider";
import { deptName } from "@/i18n/translate";
import Modal from "@/components/Modal";
import { Empty, ErrorAlert, Spinner, StatusBadge } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Item = { medicineName: string; genericName: string; dosage: string; frequency: string; durationDays: string; quantity: string };
const emptyItem = (): Item => ({ medicineName: "", genericName: "", dosage: "", frequency: "", durationDays: "", quantity: "1" });

export default function DoctorCabinet() {
  const { t, f } = useI18n();
  const [date, setDate] = useState(todayStr());
  const schedule = useFetch(() => appointmentsApi.doctorSchedule(date), [date]);
  const patients = useFetch(() => clinicalApi.myPatients());
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [modal, setModal] = useState<null | { kind: "complete" | "rx" | "exam" | "result"; appt?: any; patient?: any; exam?: any }>(null);
  const [busy, setBusy] = useState(false);

  // form state
  const [diagnosis, setDiagnosis] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [validDays, setValidDays] = useState("30");
  const [examType, setExamType] = useState("");
  const [examResult, setExamResult] = useState("");

  const doctor = schedule.data?.doctor;

  const open = (kind: "complete" | "rx" | "exam" | "result", extra: { appt?: any; patient?: any; exam?: any }) => {
    setDiagnosis(""); setVisitNotes(""); setItems([emptyItem()]); setValidDays("30"); setExamType(""); setExamResult(extra.exam?.result ?? "");
    setError(null);
    setModal({ kind, ...extra });
  };

  async function run(fn: () => Promise<unknown>, msg?: string) {
    setBusy(true); setError(null);
    try {
      await fn();
      setModal(null);
      if (msg) setNotice(msg);
      schedule.reload(); patients.reload();
    } catch (e) { setError(e); } finally { setBusy(false); }
  }

  const patientIdOf = () => modal?.appt?.patientId ?? modal?.patient?.id;

  async function submitRx() {
    const body = {
      patientId: patientIdOf(),
      validDays: Number(validDays),
      items: items.filter((i) => i.medicineName && i.dosage).map((i) => ({
        medicineName: i.medicineName, genericName: i.genericName || null, dosage: i.dosage, frequency: i.frequency || null,
        durationDays: i.durationDays ? Number(i.durationDays) : null, quantity: Number(i.quantity) || 1,
      })),
    };
    setBusy(true); setError(null);
    try {
      const rx = await clinicalApi.prescribe(body);
      setModal(null);
      setNotice(t("doctorCab.issued", { code: rx.code }));
      patients.reload();
    } catch (e) { setError(e); } finally { setBusy(false); }
  }

  const setItem = (i: number, k: keyof Item, v: string) => setItems((list) => list.map((it, j) => (j === i ? { ...it, [k]: v } : it)));

  return (
    <div className="container section-sm stack">
      <div className="row-between">
        <div>
          <h1>{t("doctorCab.title")}</h1>
          {doctor && <p className="mt-1">{doctor.specialty} · {deptName(t, doctor.department)} · {doctor.workStart}–{doctor.workEnd}</p>}
        </div>
        {doctor && (
          <div className="row">
            <Link className="btn" href="/queue">📺 {t("doctorCab.queue")}</Link>
            <button className="btn btn-accent" disabled={busy} onClick={() => run(async () => {
              const r = await queueApi.next(doctor.departmentId);
              setNotice(r.called ? `📢 ${t("queue.current")}: ${r.called.number}` : t("queue.nobody"));
            })}>📢 {t("queue.callNext")}</button>
          </div>
        )}
      </div>

      {notice && <div className="alert alert-success" onClick={() => setNotice(null)}>{notice}</div>}
      {!modal && <ErrorAlert error={error || schedule.error} t={t} />}

      <section className="card stack">
        <div className="row-between">
          <h3>📅 {t("doctorCab.schedule")}</h3>
          <div className="row">
            <button className="btn btn-sm" onClick={() => setDate(todayStr())}>{t("common.today")}</button>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 180 }} />
          </div>
        </div>
        {schedule.loading && !schedule.data ? <Spinner /> : !schedule.data?.appointments.length ? (
          <Empty icon="🗓️" title={t("doctorCab.noAppointments")} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>{t("common.time")}</th><th>{t("common.patient")}</th><th>{t("common.service")}</th><th>{t("common.status")}</th><th style={{ textAlign: "right" }}>{t("common.actions")}</th></tr></thead>
              <tbody>
                {schedule.data.appointments.map((a: any) => (
                  <tr key={a.id}>
                    <td className="nowrap"><strong>{f.time(a.startsAt)}</strong></td>
                    <td>
                      {a.patient.user.firstName} {a.patient.user.lastName}
                      <div className="xs muted">{a.patient.user.phone ?? a.patient.user.email}</div>
                      {a.notes && <div className="xs">💬 {a.notes}</div>}
                    </td>
                    <td className="small">{a.service?.name ?? "—"}</td>
                    <td><StatusBadge status={a.status} t={t} /></td>
                    <td>
                      <div className="actions">
                        {a.status === "BOOKED" && (
                          <>
                            <button className="btn btn-sm btn-primary" onClick={() => open("complete", { appt: a })}>✓ {t("doctorCab.complete")}</button>
                            <button className="btn btn-sm" onClick={() => run(() => appointmentsApi.setStatus(a.id, { status: "NO_SHOW" }))}>{t("doctorCab.noShow")}</button>
                          </>
                        )}
                        <button className="btn btn-sm" onClick={() => open("rx", { appt: a })}>📝 {t("doctorCab.prescribe")}</button>
                        <button className="btn btn-sm" onClick={() => open("exam", { appt: a })}>🧪 {t("doctorCab.orderExam")}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card stack">
        <h3>👥 {t("doctorCab.myPatients")}</h3>
        {patients.loading && !patients.data ? <Spinner /> : !patients.data?.length ? <p>{t("doctorCab.noPatients")}</p> : (
          <div className="list">
            {patients.data.map((p: any) => (
              <div key={p.id} className="list-item" style={{ alignItems: "flex-start" }}>
                <div className="stack-sm" style={{ flex: 1, minWidth: 240 }}>
                  <strong>{p.user.firstName} {p.user.lastName}</strong>
                  <span className="xs muted">{p.user.email}{p.allergies && ` · ⚠ ${t("patient.allergies")}: ${p.allergies}`}</span>
                  {p.prescriptions.length > 0 && (
                    <div className="row" style={{ gap: 6 }}>
                      {p.prescriptions.map((rx: any) => <span key={rx.id} className="badge">{rx.code}</span>)}
                    </div>
                  )}
                  {p.examinations.map((e: any) => (
                    <div key={e.id} className="row small" style={{ gap: 8 }}>
                      <StatusBadge status={e.status} t={t} /> {e.type}
                      {e.result ? <span className="muted">— {e.result.slice(0, 60)}</span> : (
                        <button className="btn btn-sm btn-ghost" onClick={() => open("result", { exam: e, patient: p })}>{t("admin.setResult")}</button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="row">
                  <button className="btn btn-sm" onClick={() => open("rx", { patient: p })}>📝 {t("doctorCab.prescribe")}</button>
                  <button className="btn btn-sm" onClick={() => open("exam", { patient: p })}>🧪 {t("doctorCab.orderExam")}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {modal?.kind === "complete" && (
        <Modal title={t("doctorCab.completeTitle")} onClose={() => setModal(null)} footer={
          <>
            <button className="btn" onClick={() => setModal(null)}>{t("common.cancel")}</button>
            <button className="btn btn-primary" disabled={busy} onClick={() => run(() => appointmentsApi.setStatus(modal.appt.id, { status: "COMPLETED", diagnosis, visitNotes }))}>{t("common.save")}</button>
          </>
        }>
          <div className="stack">
            <ErrorAlert error={error} t={t} />
            <p><b>{modal.appt.patient.user.firstName} {modal.appt.patient.user.lastName}</b> · {f.dateTime(modal.appt.startsAt)}</p>
            <label className="field"><span>{t("doctorCab.diagnosis")}</span><input className="input" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} /></label>
            <label className="field"><span>{t("doctorCab.visitNotes")}</span><textarea className="textarea" value={visitNotes} onChange={(e) => setVisitNotes(e.target.value)} /></label>
          </div>
        </Modal>
      )}

      {modal?.kind === "rx" && (
        <Modal size="lg" title={t("doctorCab.prescribeTitle")} onClose={() => setModal(null)} footer={
          <>
            <button className="btn" onClick={() => setModal(null)}>{t("common.cancel")}</button>
            <button className="btn btn-primary" disabled={busy || !items.some((i) => i.medicineName && i.dosage)} onClick={submitRx}>{t("common.save")}</button>
          </>
        }>
          <div className="stack">
            <ErrorAlert error={error} t={t} />
            <label className="field" style={{ maxWidth: 220 }}><span>{t("doctorCab.validDays")}</span><input className="input" type="number" min={1} max={365} value={validDays} onChange={(e) => setValidDays(e.target.value)} /></label>
            {items.map((it, i) => (
              <div key={i} className="card-flat form-grid">
                <label className="field"><span>{t("patient.medicine")} *</span><input className="input" value={it.medicineName} onChange={(e) => setItem(i, "medicineName", e.target.value)} placeholder="Amoxicillin" /></label>
                <label className="field"><span>Generic</span><input className="input" value={it.genericName} onChange={(e) => setItem(i, "genericName", e.target.value)} placeholder="amoxicillin" /></label>
                <label className="field"><span>{t("patient.dosage")} *</span><input className="input" value={it.dosage} onChange={(e) => setItem(i, "dosage", e.target.value)} placeholder="500mg" /></label>
                <label className="field"><span>{t("patient.frequency")}</span><input className="input" value={it.frequency} onChange={(e) => setItem(i, "frequency", e.target.value)} /></label>
                <label className="field"><span>{t("patient.duration")} ({t("patient.days", { n: "" }).trim()})</span><input className="input" type="number" min={1} value={it.durationDays} onChange={(e) => setItem(i, "durationDays", e.target.value)} /></label>
                <label className="field"><span>{t("patient.quantity")} *</span><input className="input" type="number" min={1} value={it.quantity} onChange={(e) => setItem(i, "quantity", e.target.value)} /></label>
                {items.length > 1 && <button type="button" className="btn btn-sm btn-danger full" onClick={() => setItems((l) => l.filter((_, j) => j !== i))}>{t("common.delete")}</button>}
              </div>
            ))}
            <button type="button" className="btn btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => setItems((l) => [...l, emptyItem()])}>{t("doctorCab.addItem")}</button>
          </div>
        </Modal>
      )}

      {modal?.kind === "exam" && (
        <Modal title={t("doctorCab.examTitle")} onClose={() => setModal(null)} footer={
          <>
            <button className="btn" onClick={() => setModal(null)}>{t("common.cancel")}</button>
            <button className="btn btn-primary" disabled={busy || !examType.trim()} onClick={() => run(() => clinicalApi.orderExam({ patientId: patientIdOf(), type: examType }))}>{t("common.save")}</button>
          </>
        }>
          <div className="stack">
            <ErrorAlert error={error} t={t} />
            <label className="field"><span>{t("doctorCab.examType")}</span>
              <input className="input" list="exam-types" value={examType} onChange={(e) => setExamType(e.target.value)} />
              <datalist id="exam-types">
                {["Արյան ընդհանուր անալիզ", "Արյան կենսաքիմիական անալիզ", "Մեզի ընդհանուր անալիզ", "ԷՍԳ", "Սրտի ԷԽՈ", "ՄՌՏ", "ԿՏ", "Ռենտգեն", "Ուլտրաձայնային հետազոտություն"].map((x) => <option key={x} value={x} />)}
              </datalist>
            </label>
          </div>
        </Modal>
      )}

      {modal?.kind === "result" && (
        <Modal title={`${t("admin.setResult")}: ${modal.exam.type}`} onClose={() => setModal(null)} footer={
          <>
            <button className="btn" onClick={() => setModal(null)}>{t("common.cancel")}</button>
            <button className="btn btn-primary" disabled={busy || !examResult.trim()} onClick={() => run(() => clinicalApi.setExamResult(modal.exam.id, { result: examResult, status: "DONE" }))}>{t("common.save")}</button>
          </>
        }>
          <div className="stack">
            <ErrorAlert error={error} t={t} />
            <label className="field"><span>{t("doctorCab.enterResult")}</span><textarea className="textarea" rows={5} value={examResult} onChange={(e) => setExamResult(e.target.value)} /></label>
          </div>
        </Modal>
      )}
    </div>
  );
}
