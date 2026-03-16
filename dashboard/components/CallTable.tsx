"use client";
import { CallLog } from "@/lib/types";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

/** Consistent colour from a phone number string */
function avatarColor(num: string): string {
  const colors = ["#0CD9C2", "#A78BFA", "#FF6A3C", "#20D777", "#1B8BFF", "#F59E0B"];
  const digit = parseInt(num.replace(/\D/g, "")[0] ?? "0", 10);
  return colors[digit % colors.length];
}

interface CallTableProps {
  calls: CallLog[];
  compact?: boolean;
}

export function CallTable({ calls, compact }: CallTableProps) {
  if (!calls.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.45 2 2 0 0 1 3.57 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16v.92z"/>
          </svg>
        </div>
        <p className="text-sm" style={{ color: "#637491" }}>No calls yet</p>
        <p className="text-xs" style={{ color: "#2E3F58" }}>Logs appear once Exotel routes traffic here</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr
            className="text-xs border-b"
            style={{ color: "#637491", borderColor: "rgba(255,255,255,0.05)" }}
          >
            <th className="text-left py-2 px-3 font-normal">Caller</th>
            <th className="text-left py-2 px-3 font-normal">Intent</th>
            {!compact && <th className="text-left py-2 px-3 font-normal">Duration</th>}
            <th className="text-left py-2 px-3 font-normal">Time</th>
            <th className="text-left py-2 px-3 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((c, idx) => {
            const num   = c.caller_number || "?";
            const color = avatarColor(num);
            const initials = num.replace(/\D/g, "").slice(-2) || "?";
            const isEven = idx % 2 === 0;
            return (
              <tr
                key={c.id}
                className="border-b transition-colors"
                style={{
                  borderColor: "rgba(255,255,255,0.04)",
                  background: isEven ? "transparent" : "rgba(255,255,255,0.015)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.035)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background = isEven
                    ? "transparent"
                    : "rgba(255,255,255,0.015)";
                }}
              >
                {/* Caller with avatar */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex items-center justify-center rounded-full text-[10px] font-bold shrink-0"
                      style={{
                        width: 28,
                        height: 28,
                        background: `${color}22`,
                        color,
                        border: `1px solid ${color}44`,
                      }}
                    >
                      {initials}
                    </div>
                    <span style={{ color: "rgba(230,237,255,0.75)" }}>{num}</span>
                  </div>
                </td>

                {/* Intent */}
                <td className="py-3 px-3" style={{ color: "rgba(230,237,255,0.45)" }}>
                  {c.intent?.replace(/_/g, " ") ?? "—"}
                </td>

                {/* Duration */}
                {!compact && (
                  <td className="py-3 px-3" style={{ color: "rgba(230,237,255,0.4)" }}>
                    {c.duration_sec ? `${c.duration_sec}s` : "—"}
                  </td>
                )}

                {/* Time */}
                <td className="py-3 px-3" style={{ color: "rgba(230,237,255,0.35)" }}>
                  {fmt(c.timestamp)}
                </td>

                {/* Status badge */}
                <td className="py-3 px-3">
                  {c.escalated ? (
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: "rgba(255,106,60,0.12)", color: "#FF6A3C", border: "1px solid rgba(255,106,60,0.2)" }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      Escalated
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: "rgba(12,217,194,0.08)", color: "#0CD9C2", border: "1px solid rgba(12,217,194,0.15)" }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      Handled
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
