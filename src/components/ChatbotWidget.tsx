"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { chatbotApi } from "@/lib/client/api";
import { useI18n } from "@/i18n/I18nProvider";
import { Avatar } from "./ui";

type Doc = { id: number; specialty: string; user: { firstName: string; lastName: string }; photoUrl?: string | null };
type Msg = { role: "user" | "assistant"; content: string; department?: string | null; doctors?: Doc[]; error?: boolean };

export default function ChatbotWidget() {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const history = next.filter((m) => !m.error).map(({ role, content }) => ({ role, content }));
      const res = await chatbotApi.send(history.slice(-20), lang);
      setMessages((m) => [...m, { role: "assistant", content: res.reply, department: res.department, doctors: res.doctors }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: t("chat.error"), error: true }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <section className="chat-panel" aria-label={t("chat.title")}>
          <div className="chat-head">
            <div>
              <strong>🤖 {t("chat.title")}</strong>
              <p>{t("chat.subtitle")}</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label={t("common.close")}>✕</button>
          </div>

          <div className="chat-body" aria-live="polite">
            <div className="msg msg-bot">{t("chat.greeting")}</div>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "contents" }}>
                <div className={`msg ${m.role === "user" ? "msg-user" : "msg-bot"}`}>{m.content}</div>
                {m.role === "assistant" && (m.department || m.doctors?.length) ? (
                  <div className="msg-extra">
                    {m.doctors?.map((d) => (
                      <div key={d.id} className="mini-doc">
                        <Avatar size="sm" firstName={d.user.firstName} lastName={d.user.lastName} photoUrl={d.photoUrl} />
                        <div className="grow">
                          <strong>{d.user.firstName} {d.user.lastName}</strong>
                          <div className="muted xs">{d.specialty}</div>
                        </div>
                        <Link className="btn btn-sm btn-primary" href={`/book?doctorId=${d.id}`} onClick={() => setOpen(false)}>
                          {t("chat.book")}
                        </Link>
                      </div>
                    ))}
                    {m.department && (
                      <Link className="btn btn-sm" href={`/doctors?department=${m.department}`} onClick={() => setOpen(false)}>
                        {t("chat.seeDoctors")} →
                      </Link>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
            {loading && (
              <div className="msg msg-bot"><span className="typing"><i /><i /><i /></span></div>
            )}
            <div ref={endRef} />
          </div>

          <div className="chat-foot">
            <form onSubmit={send}>
              <input
                ref={inputRef}
                className="input"
                value={input}
                maxLength={2000}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("chat.placeholder")}
                aria-label={t("chat.placeholder")}
              />
              <button className="btn btn-primary" disabled={loading || !input.trim()} aria-label={t("chat.send")}>➤</button>
            </form>
            <p className="chat-disclaimer">{t("chat.disclaimer")}</p>
          </div>
        </section>
      )}
      <button className="chat-fab" onClick={() => setOpen((o) => !o)} aria-label={t("chat.open")} aria-expanded={open}>
        {open ? "✕" : "💬"}
      </button>
    </>
  );
}
