"use client";

import { useI18n } from "@/i18n/I18nProvider";
import ResourceTable from "@/components/admin/ResourceTable";

export default function ManageDepartments() {
  const { t } = useI18n();
  return (
    <>
      <h1>{t("admin.departments")}</h1>
      <ResourceTable
        resource="departments"
        columns={[
          { key: "name", label: t("common.name"), render: (r) => <strong>{r.name}</strong> },
          { key: "slug", label: "Slug", render: (r) => <code>{r.slug}</code> },
          { key: "doctors", label: t("admin.doctors"), render: (r) => r._count?.doctors ?? 0 },
          { key: "services", label: t("admin.services"), render: (r) => r._count?.services ?? 0 },
        ]}
        fields={[
          { name: "name", label: t("common.name"), required: true },
          { name: "slug", label: t("admin.slug"), required: true, placeholder: "cardiology" },
          { name: "description", label: t("common.description"), type: "textarea" },
        ]}
      />
    </>
  );
}
