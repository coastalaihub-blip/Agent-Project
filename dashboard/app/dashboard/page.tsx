"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { StatCard } from "@/components/StatCard";
import { CallTable } from "@/components/CallTable";
import { StaggerGrid } from "@/components/StaggerGrid";
import { CallLog } from "@/lib/types";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";

const BIZ_ID = process.env.NEXT_PUBLIC_BIZ_ID ?? "demo";

type Stats = {
  total_calls: number;
  escalated: number;
  appointments_booked: number;
  avg_duration_sec: number;
};

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [chart, setChart] = useState<{ day: string; calls: number }[]>([]);

  useEffect(() => {
    apiFetch<Stats>(`/api/calls/${BIZ_ID}/stats`).then(setStats).catch(() => {});
    apiFetch<CallLog[]>(`/api/calls/${BIZ_ID}?limit=5`).then(setCalls).catch(() => {});
    apiFetch<{ day: string; calls: number }[]>(`/api/calls/${BIZ_ID}/chart?days=7`)
      .then(setChart)
      .catch(() => {});
  }, []);

  return (
    <div className="p-8 space-y-8">
      {/* ── Hero banner ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-2xl overflow-hidden p-6 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, #0E2435 0%, #0E1929 50%, #1a0e35 100%)",
          border: "1px solid rgba(12,217,194,0.15)",
        }}
      >
        {/* Glow orb */}
        <div
          className="absolute top-0 left-0 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(12,217,194,0.12) 0%, transparent 70%)",
            transform: "translate(-30%, -30%)",
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: "#20D777" }}
              />
              <span
                className="relative inline-flex rounded-full h-2.5 w-2.5"
                style={{ background: "#20D777" }}
              />
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: "#20D777" }}>
              Agent Live
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Coastal AI Agent</h1>
          <p className="text-sm" style={{ color: "#637491" }}>
            Demo Clinic · Handling inbound calls 24 / 7
          </p>
        </div>
        <div className="relative z-10 text-right">
          <p className="text-4xl font-bold tabular-nums" style={{ color: "#0CD9C2" }}>
            {stats?.total_calls ?? "—"}
          </p>
          <p className="text-xs mt-1" style={{ color: "#637491" }}>calls handled today</p>
        </div>
      </motion.div>

      {/* ── Stat grid ───────────────────────────────────────────────── */}
      <StaggerGrid cols={4}>
        <StatCard label="Calls Today"   value={stats?.total_calls ?? "—"}                                  color="#0CD9C2" />
        <StatCard label="Appointments"  value={stats?.appointments_booked ?? "—"}                           color="#20D777" />
        <StatCard label="Escalations"   value={stats?.escalated ?? "—"}                                     color="#FF6A3C" />
        <StatCard label="Avg Duration"  value={stats?.avg_duration_sec ? `${stats.avg_duration_sec}s` : "—"} color="#A78BFA" />
      </StaggerGrid>

      {/* ── Area chart ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="rounded-xl p-6"
        style={{ background: "#0E1929", border: "1px solid rgba(255,255,255,0.05)" }}
      >
        <p className="text-sm font-medium mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
          Call volume — last 7 days
        </p>
        {chart.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0CD9C2" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0CD9C2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="day"
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#0E1929",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#E6EDFF",
                }}
              />
              <Area
                type="monotone"
                dataKey="calls"
                stroke="#0CD9C2"
                strokeWidth={2}
                fill="url(#tealGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-sm" style={{ color: "#637491" }}>No chart data yet</p>
          </div>
        )}
      </motion.div>

      {/* ── Recent calls ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="rounded-xl p-6"
        style={{ background: "#0E1929", border: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
            Recent Calls
          </p>
          <Link
            href="/dashboard/calls"
            className="text-xs font-medium transition-colors hover:opacity-100 opacity-60"
            style={{ color: "#0CD9C2" }}
          >
            View all →
          </Link>
        </div>
        <CallTable calls={calls} compact />
      </motion.div>
    </div>
  );
}
