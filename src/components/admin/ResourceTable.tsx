"use client";
// Универсальная CRUD-таблица для admin-страниц

import { useMemo, useState } from "react";
import { adminApi, ApiError } from "@/lib/client/api";
import { useFetch } from "@/lib/client/hooks";
import { useI18n } from "@/i18n/I18nProvider";
import Modal from "../Modal";
import { ErrorAlert, Spinner, Empty } from "../ui";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Column = { key: string; label: string; render?: (row: any) => React.ReactNode; className?: string };
export type Field = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "checkbox" | "select" | "date" | "time" | "email" | "password";
  options?: { value: string | number; label: string }[];
  required?: boolean;
  hint?: string;
  onlyCreate?: boolean;
  full?: boolean;
  placeholder?: string;
};

type Props = {
  resource: string;
  columns: Column[];
  fields: Field[];
  /** row → значения формы при редактировании */
  toForm?: (row: any) => Record<string, unknown>;
  /** значения формы → тело запроса */
  toBody?: (values: Record<string, any>, mode: "create" | "edit") => Record<string, unknown>;
  defaults?: Record<string, unknown>;
  searchKeys?: string[];
};

const get = (obj: any, path: string) => path.split(".").reduce((o, k) => o?.[k], obj);

export default function ResourceTable({ resource, columns, fields, toForm, toBody, defaults = {}, searchKeys = [] }: Props) {
  const { t } = useI18n();
  const { data, loading, error, reload } = useFetch(() => adminApi.list(resource), [resource]);
  const [editing, setEditing] = useState<{ mode: "create" | "edit"; id?: number; values: Record<string, any> } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<unknown>(null);
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const list = data ?? [];
    if (!q.trim() || !searchKeys.length) return list;
    const s = q.toLowerCase();
    return list.filter((r) => searchKeys.some((k) => String(get(r, k) ?? "").toLowerCase().includes(s)));
  }, [data, q, searchKeys]);

  const openCreate = () => {
    setFormError(null);
    const values: Record<string, any> = {};
    for (const f of fields) values[f.name] = defaults[f.name] ?? (f.type === "checkbox" ? false : "");
    setEditing({ mode: "create", values });
  };
  const openEdit = (row: any) => {
    setFormError(null);
    const base = toForm ? toForm(row) : row;
    const values: Record<string, any> = {};
    for (const f of fields) {
      let v = base[f.name];
      if (f.type === "date" && v) v = String(v).slice(0, 10);
      values[f.name] = v ?? (f.type === "checkbox" ? false : "");
    }
    setEditing({ mode: "edit", id: row.id, values });
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setFormError(null);
    try {
      const raw: Record<string, any> = {};
      for (const f of fields) {
        if (editing.mode === "edit" && f.onlyCreate) continue;
        let v = editing.values[f.name];
        if (f.type === "number") v = v === "" || v === null ? undefined : Number(v);
        if ((f.type === "text" || f.type === "textarea" || f.type === "date") && v === "") v = null;
        if (f.type === "select" && f.options && typeof f.options[0]?.value === "number" && v !== "") v = Number(v);
        raw[f.name] = v;
      }
      const body = toBody ? toBody(raw, editing.mode) : raw;
      if (editing.mode === "create") await adminApi.create(resource, body);
      else await adminApi.update(resource, editing.id!, body);
      setEditing(null);
      reload();
    } catch (err) {
      const e = err as ApiError;
      const details = (e.details as any)?.fieldErrors;
      setFormError(
        details ? Object.entries(details).map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`).join("; ") : e.message,
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: any) {
    if (!confirm(t("common.confirmDelete"))) return;
    setActionError(null);
    try {
      await adminApi.remove(resource, row.id);
      reload();
    } catch (err) {
      const e = err as ApiError;
      setActionError(e.code === "IN_USE" ? new Error(t("admin.inUse")) : e);
    }
  }

  const setVal = (name: string, v: unknown) => setEditing((ed) => ed && { ...ed, values: { ...ed.values, [name]: v } });

  return (
    <div className="stack">
      <div className="row-between">
        {searchKeys.length > 0 ? (
          <input className="input" style={{ maxWidth: 320 }} placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} />
        ) : <span />}
        <button className="btn btn-primary" onClick={openCreate}>＋ {t("common.add")}</button>
      </div>

      <ErrorAlert error={actionError || error} t={t} />

      {loading && !data ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Empty title={t("common.empty")} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {columns.map((c) => <th key={c.key}>{c.label}</th>)}
                <th style={{ textAlign: "right" }}>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((c) => (
                    <td key={c.key} className={c.className}>{c.render ? c.render(row) : String(get(row, c.key) ?? "—")}</td>
                  ))}
                  <td>
                    <div className="actions">
                      <button className="btn btn-sm" onClick={() => openEdit(row)}>✎ {t("common.edit")}</button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(row)} aria-label={t("common.delete")}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal
          size="lg"
          title={editing.mode === "create" ? t("admin.newItem") : t("admin.editItem")}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setEditing(null)}>{t("common.cancel")}</button>
              <button className="btn btn-primary" form="resource-form" disabled={saving}>
                {saving ? t("common.loading") : t("common.save")}
              </button>
            </>
          }
        >
          <form id="resource-form" onSubmit={save} className="form-grid">
            {formError && <div className="alert alert-error full">{formError}</div>}
            {fields
              .filter((f) => !(editing.mode === "edit" && f.onlyCreate))
              .map((f) => {
                const v = editing.values[f.name];
                const full = f.full || f.type === "textarea";
                if (f.type === "checkbox") {
                  return (
                    <label key={f.name} className={`checkbox ${full ? "full" : ""}`}>
                      <input type="checkbox" checked={Boolean(v)} onChange={(e) => setVal(f.name, e.target.checked)} /> {f.label}
                    </label>
                  );
                }
                return (
                  <label key={f.name} className={`field ${full ? "full" : ""}`}>
                    <span>{f.label}{f.required && " *"}</span>
                    {f.type === "textarea" ? (
                      <textarea className="textarea" rows={f.name === "content" ? 12 : 4} value={v ?? ""} required={f.required} onChange={(e) => setVal(f.name, e.target.value)} />
                    ) : f.type === "select" ? (
                      <select className="select" value={v ?? ""} required={f.required} onChange={(e) => setVal(f.name, e.target.value)}>
                        <option value="">—</option>
                        {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <input
                        className="input"
                        type={f.type || "text"}
                        value={v ?? ""}
                        placeholder={f.placeholder}
                        required={f.required && !(f.type === "password" && editing.mode === "edit")}
                        onChange={(e) => setVal(f.name, e.target.value)}
                      />
                    )}
                    {f.hint && <span className="hint">{f.hint}</span>}
                  </label>
                );
              })}
          </form>
        </Modal>
      )}
    </div>
  );
}
