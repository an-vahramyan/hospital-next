"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounced } from "@/lib/client/hooks";
import { useI18n } from "@/i18n/I18nProvider";
import { deptName } from "@/i18n/translate";

export default function DoctorFilters({ departments }: { departments: { slug: string; name: string }[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const department = params.get("department") ?? "";
  const debounced = useDebounced(q, 300);

  const push = (next: { q?: string; department?: string }) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) (v ? sp.set(k, v) : sp.delete(k));
    router.replace(`/doctors${sp.toString() ? `?${sp}` : ""}`, { scroll: false });
  };

  useEffect(() => {
    if (debounced !== (params.get("q") ?? "")) push({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="filters">
      <input
        className="input"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("doctors.searchPlaceholder")}
        aria-label={t("common.search")}
      />
      <select className="select" value={department} onChange={(e) => push({ department: e.target.value })} aria-label={t("common.department")}>
        <option value="">{t("doctors.allDepartments")}</option>
        {departments.map((d) => <option key={d.slug} value={d.slug}>{deptName(t, d)}</option>)}
      </select>
    </div>
  );
}
