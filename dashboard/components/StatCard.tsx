interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, sub, color = "#0CD9C2", icon }: StatCardProps) {
  return (
    <div
      className="card-glow relative rounded-xl p-5 flex flex-col gap-2 transition-all duration-200 group"
      style={{
        background: "#0E1929",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.12)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-5 right-5 h-px rounded-full opacity-60"
        style={{ background: `linear-gradient(90deg, ${color}00, ${color}, ${color}00)` }}
      />

      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#637491" }}>
          {label}
        </p>
        {icon && (
          <span className="opacity-30 group-hover:opacity-60 transition-opacity">{icon}</span>
        )}
      </div>

      <p className="text-3xl font-bold tabular-nums leading-none" style={{ color }}>
        {value}
      </p>

      {sub && (
        <p className="text-xs" style={{ color: "#637491" }}>
          {sub}
        </p>
      )}
    </div>
  );
}
