"use client";

import { useState } from "react";
import { adminApi, clinicalApi } from "@/lib/client/api";
import { useDebounced, useFetch } from "@/lib/client/hooks";
import { useI18n } from "@/i18n/I18nProvider";
import Modal from "@/components/Modal";
import { Empty, ErrorAlert, Spinner, StatusBadge } from "@/components/ui";
import Icon from "@/components/Icon";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ManagePatients() {
  const { t, f } = useI18n();
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 300);
  const list = useFetch(() => adminApi.list("patients", { q: dq || undefined }), [dq]);
  const [openId, setOpenId] = useState<number | null>(null);
  const detail = useFetch(() => (openId ? adminApi.get("patients", openId) : Promise.resolve(null)), [openId]);
  const [resultFor, setResultFor] = useState<any>(null);
  const [resultText, setResultText] = useState("");
  const [err, setErr] = useState<unknown>(null);

  async function saveResult() {
    setErr(null);
    try {
      await clinicalApi.setExamResult(resultFor.id, { result: resultText, status: "DONE" });
      setResultFor(null);
      detail.reload();
    } catch (e) { setErr(e); }
  }

  const p = detail.data;

  return (
    <>
      <h1>{t("admin.patients")}</h1>
      <input className="input" style={{ maxWidth: 420 }} type="search" placeholder={t("admin.searchPatients")} value={q} onChange={(e) => setQ(e.target.value)} />
      <ErrorAlert error={list.error} t={t} />
      {list.loading && !list.data ? <Spinner /> : !list.data?.length ? <Empty icon="search" title={t("common.empty")} /> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{t("common.patient")}</th><th>{t("common.phone")}</th><th>{t("admin.registered")}</th><th>{t("admin.counts")}</th><th /></tr></thead>
            <tbody>
              {list.data.map((r: any) => (
                <tr key={r.id}>
                  <td><strong>{r.user.firstName} {r.user.lastName}</strong><div className="xs muted">{r.user.email}</div></td>
                  <td>{r.user.phone ?? "—"}</td>
                  <td className="nowrap">{f.dateShort(r.user.createdAt)}</td>
                  <td>{r._count.visits} / {r._count.prescriptions}</td>
                  <td><div className="actions"><button className="btn btn-sm" onClick={() => setOpenId(r.id)}>{t("admin.history")}</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openId && (
        <Modal size="lg" title={p ? `${p.user.firstName} ${p.user.lastName}` : t("common.loading")} onClose={() => setOpenId(null)}>
          {!p ? <Spinner /> : (
            <div className="stack">
              <dl className="kv">
                <dt>{t("auth.email")}</dt><dd>{p.user.email}</dd>
                <dt>{t("auth.phone")}</dt><dd>{p.user.phone ?? "—"}</dd>
                <dt>{t("auth.birthDate")}</dt><dd>{p.birthDate ? f.date(p.birthDate) : "—"}</dd>
                <dt>{t("patient.bloodType")}</dt><dd>{p.bloodType ?? "—"}</dd>
                <dt>{t("patient.allergies")}</dt><dd>{p.allergies ?? "—"}</dd>
              </dl>

              <h3 className="with-icon"><Icon name="calendar" size={20} /> {t("patient.appointments")}</h3>
              {p.appointments.length === 0 ? <p className="small">{t("common.empty")}</p> : (
                <div className="list">
                  {p.appointments.map((a: any) => (
                    <div key={a.id} className="list-item">
                      <span>{f.dateTime(a.startsAt)} · {a.doctor.user.firstName} {a.doctor.user.lastName}{a.service && ` · ${a.service.name}`}</span>
                      <StatusBadge status={a.status} t={t} />
                    </div>
                  ))}
                </div>
              )}

              <h3 className="with-icon"><Icon name="folder" size={20} /> {t("admin.visits")}</h3>
              {p.visits.length === 0 ? <p className="small">{t("common.empty")}</p> : p.visits.map((v: any) => (
                <div key={v.id} className="card-flat small">
                  <b>{f.date(v.date)}</b> · {v.doctor.user.firstName} {v.doctor.user.lastName}
                  {v.diagnosis && <div>{t("patient.diagnosis")}: <b>{v.diagnosis}</b></div>}
                  {v.notes && <div className="muted">{v.notes}</div>}
                </div>
              ))}

              <h3 className="with-icon"><Icon name="fileText" size={20} /> {t("patient.prescriptions")}</h3>
              {p.prescriptions.length === 0 ? <p className="small">{t("common.empty")}</p> : p.prescriptions.map((rx: any) => (
                <div key={rx.id} className="card-flat small">
                  <div className="row"><b style={{ fontFamily: "monospace" }}>{rx.code}</b><StatusBadge status={rx.status} t={t} /><span className="muted">{f.dateShort(rx.issuedAt)} → {f.dateShort(rx.validUntil)}</span></div>
                  <div className="mt-1">{rx.items.map((i: any) => `${i.medicineName} ${i.dosage} ×${i.quantity}`).join(" · ")}</div>
                </div>
              ))}

              <h3 className="with-icon"><Icon name="flask" size={20} /> {t("patient.examinations")}</h3>
              {p.examinations.length === 0 ? <p className="small">{t("common.empty")}</p> : p.examinations.map((e: any) => (
                <div key={e.id} className="card-flat small row-between">
                  <div><div className="row"><b>{e.type}</b><StatusBadge status={e.status} t={t} /></div>{e.result && <div className="mt-1">{e.result}</div>}</div>
                  {e.status !== "DONE" && <button className="btn btn-sm" onClick={() => { setResultFor(e); setResultText(""); }}>{t("admin.setResult")}</button>}
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {resultFor && (
        <Modal title={`${t("admin.setResult")}: ${resultFor.type}`} onClose={() => setResultFor(null)} footer={
          <>
            <button className="btn" onClick={() => setResultFor(null)}>{t("common.cancel")}</button>
            <button className="btn btn-primary" disabled={!resultText.trim()} onClick={saveResult}>{t("common.save")}</button>
          </>
        }>
          <ErrorAlert error={err} t={t} />
          <textarea className="textarea" rows={5} value={resultText} onChange={(e) => setResultText(e.target.value)} />
        </Modal>
      )}
    </>
  );
}
