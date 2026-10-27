"use client";

import { useEffect, useState } from "react";
import { patientApi } from "@/lib/client/api";
import { useFetch } from "@/lib/client/hooks";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n/I18nProvider";
import { ErrorAlert, Spinner } from "@/components/ui";
import Icon from "@/components/Icon";

export default function ProfilePage() {
  const { t } = useI18n();
  const { refresh } = useAuth();
  const { data, loading, error } = useFetch(() => patientApi.profile());
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<unknown>(null);

  useEffect(() => {
    if (!data) return;
    setForm({
      firstName: data.firstName ?? "", lastName: data.lastName ?? "", phone: data.phone ?? "", language: data.language ?? "hy",
      birthDate: data.patient?.birthDate ? String(data.patient.birthDate).slice(0, 10) : "",
      gender: data.patient?.gender ?? "", bloodType: data.patient?.bloodType ?? "", allergies: data.patient?.allergies ?? "",
    });
  }, [data]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setSaved(false);
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaveError(null);
    try {
      await patientApi.updateProfile(form);
      await refresh();
      setSaved(true);
    } catch (err) { setSaveError(err); } finally { setSaving(false); }
  }

  if (loading && !data) return <Spinner />;

  return (
    <>
      <h1>{t("patient.profileTitle")}</h1>
      <ErrorAlert error={error || saveError} t={t} />
      <form className="card form-grid" onSubmit={submit}>
        <label className="field"><span>{t("auth.firstName")}</span><input className="input" required value={form.firstName ?? ""} onChange={set("firstName")} /></label>
        <label className="field"><span>{t("auth.lastName")}</span><input className="input" required value={form.lastName ?? ""} onChange={set("lastName")} /></label>
        <label className="field"><span>{t("auth.email")}</span><input className="input" value={data?.email ?? ""} disabled /></label>
        <label className="field"><span>{t("auth.phone")}</span><input className="input" value={form.phone ?? ""} onChange={set("phone")} /></label>
        <label className="field"><span>{t("auth.birthDate")}</span><input className="input" type="date" value={form.birthDate ?? ""} onChange={set("birthDate")} /></label>
        <label className="field">
          <span>{t("patient.gender")}</span>
          <select className="select" value={form.gender ?? ""} onChange={set("gender")}>
            <option value="">—</option>
            <option value="MALE">{t("patient.MALE")}</option>
            <option value="FEMALE">{t("patient.FEMALE")}</option>
            <option value="OTHER">{t("patient.OTHER")}</option>
          </select>
        </label>
        <label className="field">
          <span>{t("patient.bloodType")}</span>
          <select className="select" value={form.bloodType ?? ""} onChange={set("bloodType")}>
            <option value="">—</option>
            {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((b) => <option key={b}>{b}</option>)}
          </select>
        </label>
        <label className="field">
          <span>{t("patient.language")}</span>
          <select className="select" value={form.language ?? "hy"} onChange={set("language")}>
            <option value="hy">Հայերեն</option><option value="en">English</option><option value="ru">Русский</option>
          </select>
        </label>
        <label className="field full"><span>{t("patient.allergies")}</span><textarea className="textarea" value={form.allergies ?? ""} onChange={set("allergies")} /></label>
        <div className="full row">
          <button className="btn btn-primary" disabled={saving}>{saving ? t("common.loading") : t("common.save")}</button>
          {saved && <span className="badge badge-success"><Icon name="check" size={14} /> {t("common.saved")}</span>}
        </div>
      </form>
    </>
  );
}
