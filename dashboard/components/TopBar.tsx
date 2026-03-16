"use client";

interface TopBarProps {
  title: string;
  breadcrumb?: string;
  agentLive?: boolean;
}

export function TopBar({ title, breadcrumb = "Dashboard", agentLive = true }: TopBarProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
  });

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-8 py-3 shrink-0"
      style={{
        background: "rgba(8,14,26,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Left: breadcrumb + title */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs" style={{ color: "#637491" }}>{breadcrumb}</span>
        <span className="text-xs" style={{ color: "#2E3F58" }}>/</span>
        <span className="text-sm font-semibold" style={{ color: "#E6EDFF" }}>{title}</span>
      </div>

      {/* Right: status + date + avatar */}
      <div className="flex items-center gap-5">
        {/* Agent status */}
        <div className="flex items-center gap-2">
          <span
            className="relative flex h-2 w-2"
          >
            {agentLive ? (
              <>
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: "#20D777" }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ background: "#20D777" }}
                />
              </>
            ) : (
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: "#637491" }}
              />
            )}
          </span>
          <span className="text-xs font-medium" style={{ color: agentLive ? "#20D777" : "#637491" }}>
            {agentLive ? "Agent Live" : "Offline"}
          </span>
        </div>

        {/* Date */}
        <span className="text-xs" style={{ color: "#637491" }}>{dateStr}</span>

        {/* Avatar */}
        <div
          className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold select-none"
          style={{
            background: "linear-gradient(135deg, #0CD9C2, #1B8BFF)",
            color: "#fff",
          }}
        >
          C
        </div>
      </div>
    </header>
  );
}
