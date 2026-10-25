"use client";

import { adminApi } from "@/lib/client/api";
import { useFetch } from "@/lib/client/hooks";
import { useI18n } from "@/i18n/I18nProvider";
import { deptName } from "@/i18n/translate";
import ResourceTable from "@/components/admin/ResourceTable";
import { Avatar, Spinner } from "@/components/ui";

export default function ManageDoctors() {
  const { t } = useI18n();
  const deps = useFetch(() => adminApi.list("departments"));
  if (!deps.data) return <Spinner />;
  const options = deps.data.map((d) => ({ value: d.id as number, label: deptName(t, d) }));

  return (
    <>
      <h1>{t("admin.doctors")}</h1>
      <ResourceTable
        resource="doctors"
        searchKeys={["user.firstName", "user.lastName", "user.email", "specialty"]}
        columns={[
          {
            key: "name", label: t("common.doctor"),
            render: (r) => (
              <div className="row" style={{ flexWrap: "nowrap" }}>
                <Avatar size="sm" firstName={r.user.firstName} lastName={r.user.lastName} photoUrl={r.photoUrl} />
                <div><strong>{r.user.firstName} {r.user.lastName}</strong><div className="xs muted">{r.user.email}</div></div>
              </div>
            ),
          },
          { key: "specialty", label: t("admin.specialty") },
          { key: "department", label: t("common.department"), render: (r) => deptName(t, r.department) },
          { key: "hours", label: t("doctors.workHours"), render: (r) => `${r.workStart}–${r.workEnd} / ${r.slotMinutes}′` },
        ]}
        toForm={(r) => ({ ...r, ...r.user, id: r.id, password: "" })}
        toBody={(v, mode) => {
          const body = { ...v };
          if (mode === "edit" && !body.password) delete body.password;
          return body;
        }}
        fields={[
          { name: "firstName", label: t("auth.firstName"), required: true },
          { name: "lastName", label: t("auth.lastName"), required: true },
          { name: "email", label: t("auth.email"), type: "email", required: true },
          { name: "password", label: t("admin.password"), type: "password", required: true, hint: `${t("auth.pwMin")}. ${t("admin.passwordHint")}` },
          { name: "phone", label: t("auth.phone") },
          { name: "departmentId", label: t("common.department"), type: "select", options, required: true },
          { name: "specialty", label: t("admin.specialty"), required: true },
          { name: "experienceYears", label: t("admin.experience"), type: "number" },
          { name: "workStart", label: t("admin.workStart"), type: "time", required: true },
          { name: "workEnd", label: t("admin.workEnd"), type: "time", required: true },
          { name: "slotMinutes", label: t("admin.slotMinutes"), type: "number", required: true },
          { name: "photoUrl", label: t("admin.photoUrl"), placeholder: "https://..." },
          { name: "bio", label: t("admin.bio"), type: "textarea" },
        ]}
        defaults={{ workStart: "09:00", workEnd: "17:00", slotMinutes: 30, experienceYears: 0 }}
      />
    </>
  );
}
