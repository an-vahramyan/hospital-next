"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { queueApi, type ApiError } from "@/lib/client/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n/I18nProvider";
import { deptName } from "@/i18n/translate";
import { ErrorAlert } from "@/components/ui";

type Dept = { id: number; slug: string; name: string };
type Status = {
  ticket: { id: number; number: number; status: string; date: string; department: Dept };
  ahead: number;
  current: number | null;
  estimatedWaitMin: number;
};
type Board = { current: number | null; next: number[]; waitingCount: number };

const STORAGE_KEY = "queueTicketId";
const POLL_MS = 10_000;

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; g.gain.value = 0.15;
    o.start(); o.stop(ctx.currentTime + 0.6);
  } catch { /* звук недоступен */ }
}

export default function QueueClient({ departments }: { departments: Dept[] }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [deptId, setDeptId] = useState<number>(departments.find((d) => d.slug === "therapy")?.id ?? departments[0]?.id);
  const [status, setStatus] = useState<Status | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const notified = useRef(false);

  const loadStatus = useCallback(async () => {
    let id: string | null = null;
    try { id = localStorage.getItem(STORAGE_KEY); } catch { /* ignore */ }
    if (!id) return setStatus(null);
    try {
      const s: Status = await queueApi.status(Number(id));
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      if (s.ticket.date !== todayStr) {
        localStorage.removeItem(STORAGE_KEY);
        return setStatus(null);
      }
      setStatus(s);
      setDeptId(s.ticket.department.id);
      if (s.ticket.status === "CALLED" && !notified.current) {
        notified.current = true;
        beep();
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(t("queue.calledTitle"), { body: t("queue.calledText", { dept: deptName(t, s.ticket.department) }) });
        }
      }
    } catch (e) {
      if ((e as ApiError).status === 404) localStorage.removeItem(STORAGE_KEY);
      setStatus(null);
    }
  }, [t]);

  const loadBoard = useCallback(async () => {
    if (!deptId) return;
    try { setBoard(await queueApi.board(deptId)); } catch { /* ignore */ }
  }, [deptId]);

  useEffect(() => {
    loadStatus();
    const id = setInterval(loadStatus, POLL_MS);
    return () => clearInterval(id);
  }, [loadStatus]);

  useEffect(() => {
    loadBoard();
    const id = setInterval(loadBoard, POLL_MS);
    return () => clearInterval(id);
  }, [loadBoard]);

  async function take() {
    setBusy(true);
    setError(null);
    try {
      const ticket = await queueApi.take(deptId);
      localStorage.setItem(STORAGE_KEY, String(ticket.id));
      notified.current = false;
      if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {});
      await loadStatus();
      await loadBoard();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  async function callNext() {
    setBusy(true);
    try { await queueApi.next(deptId); await loadBoard(); } catch (e) { setError(e); } finally { setBusy(false); }
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    setStatus(null);
  }

  const dept = departments.find((d) => d.id === deptId);
  const tk = status?.ticket;
  const isStaff = user?.role === "DOCTOR" || user?.role === "ADMIN";

  return (
    <div className="grid grid-2" style={{ alignItems: "start" }}>
      <div className="stack">
        {tk ? (
          <div className={`card ticket ${tk.status === "CALLED" ? "called" : ""}`}>
            <p className="small">{tk.status === "CALLED" ? t("queue.calledTitle") : t("queue.yourNumber")}</p>
            <div className="ticket-number" aria-live="assertive">{tk.number}</div>
            <p className="mt-1"><span className="badge badge-primary">{deptName(t, tk.department)}</span></p>
            {tk.status === "WAITING" && (
              <div className="stack-sm mt-2">
                <strong style={{ fontSize: "1.1rem" }}>{t("queue.ahead", { n: status!.ahead })}</strong>
                <span className="muted">{t("queue.wait", { n: status!.estimatedWaitMin })}</span>
                <span className="muted small">{t("queue.current")}: <b>{status!.current ?? t("queue.nobody")}</b></span>
              </div>
            )}
            {tk.status === "CALLED" && <p className="mt-2" style={{ color: "var(--success)", fontWeight: 700 }}>{t("queue.calledText", { dept: deptName(t, tk.department) })}</p>}
            {(tk.status === "DONE" || tk.status === "SKIPPED") && <p className="mt-2">{t("queue.doneText")}</p>}
            <p className="xs muted mt-2">{t("queue.autoRefresh")}</p>
            {tk.status !== "WAITING" && tk.status !== "CALLED" && <button className="btn mt-2" onClick={reset}>{t("queue.leave")}</button>}
          </div>
        ) : (
          <div className="card stack">
            <label className="field">
              <span>{t("queue.selectDepartment")}</span>
              <select className="select" value={deptId} onChange={(e) => setDeptId(Number(e.target.value))}>
                {departments.map((d) => <option key={d.id} value={d.id}>{deptName(t, d)}</option>)}
              </select>
            </label>
            {user ? (
              <button className="btn btn-primary btn-lg" onClick={take} disabled={busy || !deptId}>🎟️ {t("queue.take")}</button>
            ) : (
              <div className="alert alert-info">
                {t("queue.loginRequired")} — <Link href="/login?next=/queue">{t("nav.login")}</Link>
              </div>
            )}
          </div>
        )}
        <ErrorAlert error={error} t={t} />
      </div>

      <div className="card stack">
        <div className="row-between">
          <h3>📺 {t("queue.board")}</h3>
          {dept && <span className="badge badge-primary">{deptName(t, dept)}</span>}
        </div>
        {!tk && (
          <select className="select" value={deptId} onChange={(e) => setDeptId(Number(e.target.value))} aria-label={t("queue.selectDepartment")}>
            {departments.map((d) => <option key={d.id} value={d.id}>{deptName(t, d)}</option>)}
          </select>
        )}
        <div className="board">
          <div className="card-flat">
            <p className="small">{t("queue.current")}</p>
            <div className="board-now">{board?.current ?? t("queue.nobody")}</div>
          </div>
          <div className="card-flat">
            <p className="small">{t("queue.nextNumbers")}</p>
            <div className="board-next mt-1">
              {board?.next.length ? board.next.map((n) => <span key={n}>{n}</span>) : <span>—</span>}
            </div>
            <p className="xs muted mt-1">{t("queue.waitingCount", { n: board?.waitingCount ?? 0 })}</p>
          </div>
        </div>
        {isStaff && <button className="btn btn-accent" onClick={callNext} disabled={busy}>📢 {t("queue.callNext")}</button>}
      </div>
    </div>
  );
}
