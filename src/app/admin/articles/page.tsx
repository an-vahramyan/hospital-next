"use client";

import { useI18n } from "@/i18n/I18nProvider";
import ResourceTable from "@/components/admin/ResourceTable";

export default function ManageArticles() {
  const { t, f } = useI18n();
  return (
    <>
      <h1>{t("admin.articles")}</h1>
      <ResourceTable
        resource="articles"
        searchKeys={["title", "slug"]}
        columns={[
          { key: "title", label: t("admin.titleField"), render: (r) => <><strong>{r.title}</strong><div className="xs muted">/{r.slug}</div></> },
          { key: "language", label: t("admin.language"), render: (r) => <span className="badge">{r.language.toUpperCase()}</span> },
          { key: "isPublished", label: t("admin.isPublished"), render: (r) => (r.isPublished ? <span className="badge badge-success">✓</span> : <span className="badge">—</span>) },
          { key: "publishedAt", label: t("admin.publishedAt"), render: (r) => f.dateShort(r.publishedAt) },
        ]}
        fields={[
          { name: "title", label: t("admin.titleField"), required: true, full: true },
          { name: "slug", label: t("admin.slug"), required: true, placeholder: "healthy-heart" },
          { name: "language", label: t("admin.language"), type: "select", required: true, options: [{ value: "hy", label: "Հայերեն" }, { value: "en", label: "English" }, { value: "ru", label: "Русский" }] },
          { name: "publishedAt", label: t("admin.publishedAt"), type: "date" },
          { name: "coverUrl", label: t("admin.coverUrl"), placeholder: "https://..." },
          { name: "isPublished", label: t("admin.isPublished"), type: "checkbox", full: true },
          { name: "content", label: t("admin.content"), type: "textarea", required: true },
        ]}
        defaults={{ language: "hy", isPublished: true }}
      />
    </>
  );
}
