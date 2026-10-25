"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { appointmentsApi, doctorsApi, publicApi, type ApiError } from "@/lib/client/api";
import { todayStr } from "@/lib/client/hooks";
import { useI18n } from "@/i18n/I18nProvider";
import { deptName } from "@/i18n/translate";
import { Spinner } from "@/components/ui";

type Dept = { id: number; slug: string; name: string };
type Doctor = { id: number; specialty: string; slotMinutes?: number; user: { firstName: string; lastName: string }; department: Dept };
type Service = { id: number; name: string; price: number; durationMin: number };

function Step({ n, title, done, disabled, children }: { n: number; title: string; done: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <div className={`step card ${done ? "done" : ""} ${disabled ? "disabled" : ""}`}>
      <div className="step-num">{done ? "✓" : n}</div>
      <div className="stack-sm">
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export default function BookingWizard({ departments }: { departments: Dept[] }) {
  const { t, f } = useI18n();
  const router = useRouter();
  const params = useSearchParams();

  const [dept, setDept] = useState(params.get("department") ?? "");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState<number | null>(params.get("doctorId") ? Number(params.get("doctorId")) : null);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState<number | null>(params.get("serviceId") ? Number(params.get("serviceId")) : null);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ?doctorId= → подставить отделение врача
  useEffect(() => {
    const id = params.get("doctorId");
    if (id && !params.get("department")) {
      doctorsApi.get(id).then((d) => setDept(d.department.slug)).catch(() => setDoctorId(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!dept) return;
    doctorsApi.list({ department: dept }).then((list) => {
      setDoctors(list);
      setDoctorId((cur) => (cur && list.some((d) => d.id === cur) ? cur : list.length === 1 ? list[0].id : null));
    });
    publicApi.services(dept).then((list) => {
      setServices(list);
      setServiceId((cur) => (cur && list.some((s) => s.id === cur) ? cur : null));
    });
  }, [dept]);

  const loadSlots = async () => {
    if (!doctorId || !date) return setSlots(null);
    setLoadingSlots(true);
    setSlot(null);
    try {
      setSlots((await doctorsApi.slots(doctorId, date)).slots);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, date]);

  const doctor = useMemo(() => doctors.find((d) => d.id === doctorId), [doctors, doctorId]);
  const service = services.find((s) => s.id === serviceId);
  const department = departments.find((d) => d.slug === dept);

  async function submit() {
    if (!doctorId || !slot) return;
    setSubmitting(true);
    setError(null);
    try {
      await appointmentsApi.book({ doctorId, serviceId, startsAt: slot, notes: notes || undefined });
      router.push("/patient/appointments?booked=1");
    } catch (err) {
      const e = err as ApiError;
      if (e.status === 409) {
        setError(t("book.slotTaken"));
        loadSlots();
      } else setError(e.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="book-layout">
      <div className="steps">
        <Step n={1} title={t("book.s1")} done={!!dept}>
          <select className="select" value={dept} onChange={(e) => { setDept(e.target.value); setDoctorId(null); setSlot(null); }}>
            <option value="">{t("book.selectDepartment")}</option>
            {departments.map((d) => <option key={d.slug} value={d.slug}>{deptName(t, d)}</option>)}
          </select>
        </Step>

        <Step n={2} title={t("book.s2")} done={!!doctorId} disabled={!dept}>
          <select className="select" value={doctorId ?? ""} onChange={(e) => setDoctorId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">{t("book.selectDoctor")}</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.user.firstName} {d.user.lastName} — {d.specialty}</option>)}
          </select>
        </Step>

        <Step n={3} title={`${t("book.s3")} (${t("common.optional")})`} done={!!serviceId} disabled={!doctorId}>
          <select className="select" value={serviceId ?? ""} onChange={(e) => setServiceId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">{t("book.noService")}</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name} — {f.money(s.price)}</option>)}
          </select>
        </Step>

        <Step n={4} title={t("book.s4")} done={!!date} disabled={!doctorId}>
          <input className="input" type="date" min={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} style={{ maxWidth: 240 }} />
        </Step>

        <Step n={5} title={t("book.s5")} done={!!slot} disabled={!doctorId || !date}>
          {!date ? (
            <p className="small">{t("book.pickDate")}</p>
          ) : loadingSlots ? (
            <Spinner />
          ) : slots && slots.length ? (
            <div className="slots">
              {slots.map((s) => (
                <button key={s} type="button" className="slot" aria-pressed={slot === s} onClick={() => setSlot(s)}>{f.time(s)}</button>
              ))}
            </div>
          ) : (
            <p className="small">{t("book.noSlots")}</p>
          )}
        </Step>

        <Step n={6} title={t("book.s6")} done={false} disabled={!slot}>
          <textarea className="textarea" rows={3} maxLength={1000} placeholder={t("book.notesPlaceholder")} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Step>
      </div>

      <aside className="card summary stack">
        <h3>{t("book.summary")}</h3>
        <dl>
          <dt>{t("common.department")}</dt><dd>{department ? deptName(t, department) : t("book.notSelected")}</dd>
          <dt>{t("common.doctor")}</dt><dd>{doctor ? `${doctor.user.firstName} ${doctor.user.lastName}` : t("book.notSelected")}</dd>
          <dt>{t("common.service")}</dt><dd>{service?.name ?? t("book.notSelected")}</dd>
          <dt>{t("common.date")}</dt><dd>{slot ? f.weekday(slot) : date || t("book.notSelected")}</dd>
          <dt>{t("common.time")}</dt><dd>{slot ? f.time(slot) : t("book.notSelected")}</dd>
          {service && (<><dt>{t("common.total")}</dt><dd>{f.money(service.price)}</dd></>)}
        </dl>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <button className="btn btn-primary btn-lg" disabled={!slot || submitting} onClick={submit}>
          {submitting ? t("common.loading") : `✓ ${t("book.confirm")}`}
        </button>
      </aside>
    </div>
  );
}
