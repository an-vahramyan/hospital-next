"use client";

import { adminApi } from "@/lib/client/api";
import { useFetch } from "@/lib/client/hooks";
import { useI18n } from "@/i18n/I18nProvider";
import { deptName } from "@/i18n/translate";
import ResourceTable from "@/components/admin/ResourceTable";
import { Spinner } from "@/components/ui";

export default function ManageServices() {
  const { t, f } = useI18n();
  const deps = useFetch(() => adminApi.list("departments"));
  if (!deps.data) return <Spinner />;
  const options = deps.data.map((d) => ({ value: d.id as number, label: deptName(t, d) }));
  return (
    <>
      <h1>{t("admin.services")}</h1>
      <ResourceTable
        resource="services"
        searchKeys={["name", "department.name"]}
        columns={[
          { key: "name", label: t("common.name"), render: (r) => <strong>{r.name}</strong> },
          { key: "department", label: t("common.department"), render: (r) => deptName(t, r.department) },
          { key: "price", label: t("admin.price"), render: (r) => f.money(r.price) },
          { key: "durationMin", label: t("admin.durationMin") },
        ]}
        fields={[
          { name: "name", label: t("common.name"), required: true, full: true },
          { name: "departmentId", label: t("common.department"), type: "select", options, required: true },
          { name: "price", label: t("admin.price"), type: "number", required: true },
          { name: "durationMin", label: t("admin.durationMin"), type: "number", required: true },
          { name: "description", label: t("common.description"), type: "textarea" },
        ]}
        defaults={{ durationMin: 30 }}
      />
    </>
  );
}
