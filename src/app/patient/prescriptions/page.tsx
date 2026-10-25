"use client";

import Link from "next/link";
import { patientApi } from "@/lib/client/api";
import { useFetch } from "@/lib/client/hooks";
import { useI18n } from "@/i18n/I18nProvider";
import { Empty, ErrorAlert, Spinner, StatusBadge } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function PrescriptionsPage() {
  const { t, f } = useI18n();
  const { data, loading, error } = useFetch(() => patientApi.prescriptions());

  return (
    <>
      <h1>{t("patient.prescriptions")}</h1>
      <ErrorAlert error={error} t={t} />
      {loading && !data ? <Spinner /> : !data?.length ? <Empty icon="📝" title={t("patient.noPrescriptions")} /> : (
        <div className="stack">
          {data.map((p: any) => (
            <article key={p.id} className="card stack">
              <div className="row-between">
                <div className="row">
                  <h3 style={{ fontFamily: "monospace", fontSize: "1.15rem" }}>{p.code}</h3>
                  <StatusBadge status={p.status} t={t} />
                </div>
                {p.status === "ACTIVE" && (
                  <Link className="btn btn-sm btn-primary" href={`/patient/medicines?prescription=${p.id}`}>💊 {t("patient.checkPharmacy")}</Link>
                )}
              </div>
              <dl className="kv">
                <dt>{t("common.doctor")}</dt><dd>{p.doctor.user.firstName} {p.doctor.user.lastName}</dd>
                <dt>{t("patient.issued")}</dt><dd>{f.date(p.issuedAt)}</dd>
                <dt>{t("patient.validUntil")}</dt><dd>{f.date(p.validUntil)}</dd>
              </dl>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>{t("patient.medicine")}</th><th>{t("patient.dosage")}</th><th>{t("patient.frequency")}</th><th>{t("patient.duration")}</th><th>{t("patient.quantity")}</th></tr>
                  </thead>
                  <tbody>
                    {p.items.map((i: any) => (
                      <tr key={i.id}>
                        <td><strong>{i.medicineName}</strong>{i.genericName && <div className="xs muted">{i.genericName}</div>}</td>
                        <td>{i.dosage}</td>
                        <td>{i.frequency ?? "—"}</td>
                        <td>{i.durationDays ? t("patient.days", { n: i.durationDays }) : "—"}</td>
                        <td>{i.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
