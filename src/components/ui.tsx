// Мелкие общие UI-компоненты (без хуков — работают и в server, и в client компонентах)
import type { TFunction } from "@/i18n/translate";

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <div className="spinner" />
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}

export function Empty({ icon = "📭", title, hint, children }: { icon?: string; title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden>{icon}</div>
      <p style={{ color: "var(--text)", fontWeight: 600 }}>{title}</p>
      {hint && <p className="small mt-1">{hint}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

const STATUS_CLASS: Record<string, string> = {
  BOOKED: "badge-primary", COMPLETED: "badge-success", CANCELLED: "badge", NO_SHOW: "badge-danger",
  ACTIVE: "badge-success", USED: "badge", EXPIRED: "badge-danger", ORDERED: "badge-warning", DONE: "badge-success",
  WAITING: "badge-warning", CALLED: "badge-success", SKIPPED: "badge", MAINTENANCE: "badge-warning", RETIRED: "badge",
  PENDING: "badge-warning", SUCCESS: "badge-success", FAILED: "badge-danger", RESERVED: "badge-info", READY: "badge-success",
};

export function StatusBadge({ status, t }: { status: string; t: TFunction }) {
  const label = t(`status.${status}`);
  return <span className={`badge ${STATUS_CLASS[status] ?? ""}`}>{label.startsWith("status.") ? status : label}</span>;
}

export function Avatar({ firstName, lastName, photoUrl, size = "" }: { firstName: string; lastName: string; photoUrl?: string | null; size?: "" | "sm" | "lg" }) {
  return (
    <div className={`avatar ${size ? `avatar-${size}` : ""}`} aria-hidden>
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" />
      ) : (
        `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`
      )}
    </div>
  );
}

export function ErrorAlert({ error, t }: { error: unknown; t: TFunction }) {
  if (!error) return null;
  const e = error as { status?: number; message?: string };
  const msg =
    e.status === 0 ? t("errors.network") :
    e.status === 401 ? t("errors.unauthorized") :
    e.status === 403 ? t("errors.forbidden") :
    e.status === 429 ? t("errors.tooMany") :
    e.message || t("errors.generic");
  return <div className="alert alert-error" role="alert">{msg}</div>;
}
