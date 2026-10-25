"use client";

import { useI18n } from "@/i18n/I18nProvider";
import ResourceTable from "@/components/admin/ResourceTable";
import { StatusBadge } from "@/components/ui";

export default function ManageEquipment() {
  const { t, f } = useI18n();
  return (
    <>
      <h1>{t("admin.equipment")}</h1>
      <ResourceTable
        resource="equipment"
        searchKeys={["name"]}
        columns={[
          { key: "name", label: t("common.name"), render: (r) => <><strong>{r.name}</strong> {r.isNew && <span className="badge badge-new">{t("equipment.new")}</span>}</> },
          { key: "status", label: t("common.status"), render: (r) => <StatusBadge status={r.status} t={t} /> },
          { key: "acquiredAt", label: t("admin.acquiredAt"), render: (r) => (r.acquiredAt ? f.dateShort(r.acquiredAt) : "—") },
        ]}
        fields={[
          { name: "name", label: t("common.name"), required: true, full: true },
          { name: "status", label: t("common.status"), type: "select", required: true, options: ["ACTIVE", "MAINTENANCE", "RETIRED"].map((s) => ({ value: s, label: t(`status.${s}`) })) },
          { name: "acquiredAt", label: t("admin.acquiredAt"), type: "date" },
          { name: "imageUrl", label: t("admin.imageUrl"), full: true, placeholder: "https://..." },
          { name: "isNew", label: t("admin.isNew"), type: "checkbox" },
          { name: "description", label: t("common.description"), type: "textarea" },
        ]}
        defaults={{ status: "ACTIVE", isNew: true }}
      />
    </>
  );
}
