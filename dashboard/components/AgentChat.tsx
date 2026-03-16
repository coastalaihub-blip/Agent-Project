"use client";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { AgentInstruction } from "@/lib/types";

interface AgentChatProps {
  businessId: string;
  instructions: AgentInstruction[];
  onSent: () => void;
}

export function AgentChat({ businessId, instructions, onSent }: AgentChatProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new instructions arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [instructions]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await apiFetch("/api/agent/instruct", {
        method: "POST",
        body: JSON.stringify({ business_id: businessId, instruction: text.trim() }),
      });
      setText("");
      onSent();
    } catch {
      alert("Failed to send instruction");
    } finally {
      setSending(false);
    }
  }

  const sorted = [...instructions].reverse();

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Message history */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(12,217,194,0.1)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0CD9C2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm text-center" style={{ color: "#637491" }}>
              No active instructions yet.<br />Send a runtime update to the agent below.
            </p>
          </div>
        ) : (
          sorted.map((inst) => {
            const isOwner = inst.created_by === "owner";
            return (
              <div
                key={inst.id}
                className={`flex ${isOwner ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="rounded-xl px-4 py-3 text-sm max-w-xl animate-fade-in"
                  style={{
                    background: isOwner ? "rgba(12,217,194,0.1)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${isOwner ? "rgba(12,217,194,0.2)" : "rgba(255,255,255,0.08)"}`,
                    color: isOwner ? "#0CD9C2" : "#E6EDFF",
                  }}
                >
                  <p className="leading-relaxed">{inst.instruction}</p>
                  <p className="text-[11px] mt-1.5 opacity-50">
                    {inst.created_by} · {new Date(inst.created_at).toLocaleString("en-IN", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div
        className="rounded-xl p-3 transition-all duration-150"
        style={{
          background: "#152235",
          border: `1px solid ${text ? "rgba(12,217,194,0.3)" : "rgba(255,255,255,0.08)"}`,
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="E.g. Dr. Sharma is on leave today — book all appointments with Dr. Patel."
          rows={1}
          className="w-full bg-transparent text-sm resize-none focus:outline-none leading-relaxed"
          style={{
            color: "#E6EDFF",
          }}
        />
        <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[11px]" style={{ color: "#2E3F58" }}>
            Enter to send · Shift+Enter for newline
          </p>
          <button
            onClick={send}
            disabled={sending || !text.trim()}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 disabled:opacity-40"
            style={{
              background: "#0CD9C2",
              color: "#080E1A",
            }}
          >
            {sending ? (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
            {sending ? "Sending" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
