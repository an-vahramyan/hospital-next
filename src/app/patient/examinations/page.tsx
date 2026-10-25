"use client";

import { patientApi } from "@/lib/client/api";
import { useFetch } from "@/lib/client/hooks";
import { useI18n } from "@/i18n/I18nProvider";
import { Empty, ErrorAlert, Spinner, StatusBadge } from "@/components/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ExaminationsPage() {
  const { t, f } = useI18n();
  const { data, loading, error } = useFetch(() => patientApi.examinations());
  return (
    <>
      <h1>{t("patient.examinations")}</h1>
      <ErrorAlert error={error} t={t} />
      {loading && !data ? <Spinner /> : !data?.length ? <Empty icon="🧪" title={t("patient.noExams")} /> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>{t("patient.examType")}</th><th>{t("common.status")}</th><th>{t("patient.ordered")}</th><th>{t("patient.result")}</th><th>{t("patient.file")}</th></tr>
            </thead>
            <tbody>
              {data.map((e: any) => (
                <tr key={e.id}>
                  <td><strong>{e.type}</strong></td>
                  <td><StatusBadge status={e.status} t={t} /></td>
                  <td className="nowrap">{f.dateShort(e.orderedAt)}</td>
                  <td>{e.result ? <>{e.result}{e.resultAt && <div className="xs muted">{f.dateShort(e.resultAt)}</div>}</> : <span className="muted">{t("patient.waitingResult")}</span>}</td>
                  <td>{e.fileUrl ? <a href={e.fileUrl} target="_blank" rel="noreferrer">📎 {t("common.view")}</a> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
