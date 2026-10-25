"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { patientApi, pharmacyApi, type ApiError } from "@/lib/client/api";
import { useFetch } from "@/lib/client/hooks";
import { useI18n } from "@/i18n/I18nProvider";
import { Empty, Spinner, StatusBadge } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */
function MedicinesInner() {
  const { t, f } = useI18n();
  const params = useSearchParams();
  const health = useFetch(() => pharmacyApi.health());
  const prescriptions = useFetch(() => patientApi.prescriptions());
  const history = useFetch(() => pharmacyApi.history());
  const [selected, setSelected] = useState<number | null>(params.get("prescription") ? Number(params.get("prescription")) : null);
  const [result, setResult] = useState<any>(null);
  const [reservation, setReservation] = useState<any>(null);
  const [busy, setBusy] = useState<"check" | "reserve" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active = (prescriptions.data ?? []).filter((p: any) => p.status === "ACTIVE");
  useEffect(() => {
    if (!selected && active.length) setSelected(active[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prescriptions.data]);

  const errMsg = (e: ApiError) => (e.status === 503 ? t("pharmacy.unreachable") : e.message);

  async function check() {
    if (!selected) return;
    setBusy("check"); setError(null); setResult(null); setReservation(null);
    try { setResult(await pharmacyApi.checkPrescription(selected)); }
    catch (e) { setError(errMsg(e as ApiError)); }
    finally { setBusy(null); history.reload(); health.reload(); }
  }

  async function reserve() {
    if (!selected) return;
    setBusy("reserve"); setError(null);
    try { setReservation(await pharmacyApi.reserve(selected)); }
    catch (e) { setError(errMsg(e as ApiError)); }
    finally { setBusy(null); history.reload(); }
  }

  const requested = new Map<string, number>((result?.requested ?? []).map((i: any) => [i.name, i.quantity]));
  const allAvailable = result?.items?.length > 0 && result.items.every((i: any) => i.available);

  return (
    <>
      <div className="row-between">
        <div>
          <h1>{t("pharmacy.title")}</h1>
          <p className="mt-1">{t("pharmacy.subtitle")}</p>
        </div>
        {health.data && (
          <span className={`badge ${health.data.online ? "badge-success" : "badge-danger"}`} style={{ fontSize: "0.85rem", padding: "6px 12px" }}>
            {health.data.online ? "🟢" : "🔴"} {health.data.online ? t("pharmacy.online") : t("pharmacy.offline")}
          </span>
        )}
      </div>

      {prescriptions.loading && !prescriptions.data ? <Spinner /> : active.length === 0 ? (
        <Empty icon="💊" title={t("pharmacy.noActive")} />
      ) : (
        <div className="card stack">
          <label className="field">
            <span>{t("pharmacy.selectPrescription")}</span>
            <div className="row">
              <select className="select" style={{ maxWidth: 420 }} value={selected ?? ""} onChange={(e) => { setSelected(Number(e.target.value)); setResult(null); setReservation(null); }}>
                {active.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.code} — {p.items.map((i: any) => i.medicineName).join(", ")}</option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={check} disabled={!selected || busy !== null}>
                {busy === "check" ? t("pharmacy.checking") : `🔍 ${t("pharmacy.check")}`}
              </button>
            </div>
          </label>

          {error && <div className="alert alert-error" role="alert">{error}</div>}

          {result && (
            <>
              <div className={`alert ${allAvailable ? "alert-success" : "alert-warning"}`}>
                {allAvailable ? `✓ ${t("pharmacy.allAvailable")}` : `⚠ ${t("pharmacy.someMissing")}`}
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("patient.medicine")}</th><th>{t("pharmacy.requested")}</th><th>{t("pharmacy.available")}</th>
                      <th>{t("pharmacy.price")}</th><th>{t("pharmacy.alternatives")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((i: any) => (
                      <tr key={i.name}>
                        <td><strong>{i.name}</strong></td>
                        <td>{requested.get(i.name) ?? "—"}</td>
                        <td>
                          <span className={`badge ${i.available ? "badge-success" : "badge-danger"}`}>{i.available ? t("pharmacy.inStock") : t("pharmacy.outOfStock")}</span>
                          <span className="xs muted"> ({i.quantityAvailable})</span>
                        </td>
                        <td>{i.price != null ? f.money(i.price) : "—"}</td>
                        <td className="small">{i.alternatives?.length ? i.alternatives.map((a: any) => `${a.name}${a.price ? ` (${f.money(a.price)})` : ""}`).join(", ") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {allAvailable && !reservation && (
                <button className="btn btn-accent btn-lg" style={{ alignSelf: "flex-start" }} onClick={reserve} disabled={busy !== null}>
                  {busy === "reserve" ? t("common.loading") : `🛒 ${t("pharmacy.reserve")}`}
                </button>
              )}
            </>
          )}

          {reservation && (
            <div className="alert alert-success stack-sm">
              <strong>✓ {t("pharmacy.reserved")}</strong>
              <span>{t("pharmacy.reservationId")}: <b>{reservation.reservationId}</b> · <StatusBadge status={reservation.status} t={t} /></span>
              {reservation.total != null && <span>{t("common.total")}: <b>{f.money(reservation.total)}</b></span>}
              {reservation.expiresAt && <span>{t("pharmacy.expires")}: {f.dateTime(reservation.expiresAt)}</span>}
              <span className="small">{t("pharmacy.readyNotice")}</span>
            </div>
          )}
        </div>
      )}

      {history.data && history.data.length > 0 && (
        <section className="card">
          <h3 className="mb-2">{t("pharmacy.history")}</h3>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>{t("common.date")}</th><th>{t("pharmacy.type")}</th><th>{t("patient.code")}</th><th>{t("common.status")}</th></tr></thead>
              <tbody>
                {history.data.slice(0, 10).map((h: any) => (
                  <tr key={h.id}>
                    <td className="nowrap">{f.dateTime(h.createdAt)}</td>
                    <td>{t(`pharmacy.${h.kind}`)}</td>
                    <td>{h.prescription?.code ?? "—"}</td>
                    <td><StatusBadge status={h.status} t={t} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

export default function MedicinesPage() {
  return <Suspense><MedicinesInner /></Suspense>;
}
