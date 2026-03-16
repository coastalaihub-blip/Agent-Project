"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { CallTable } from "@/components/CallTable";
import { CallLog } from "@/lib/types";

const BIZ_ID = process.env.NEXT_PUBLIC_BIZ_ID ?? "demo";
const API     = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function CallsPage() {
  const [calls, setCalls]         = useState<CallLog[]>([]);
  const [escalatedOnly, setEsc]   = useState(false);
  const [loading, setLoading]     = useState(true);

  function load() {
    setLoading(true);
    const params = escalatedOnly ? "?escalated=true" : "";
    apiFetch<CallLog[]>(`/api/calls/${BIZ_ID}${params}`)
      .then(setCalls)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [escalatedOnly]);

  function exportCsv() {
    window.open(`${API}/api/calls/${BIZ_ID}/export`, "_blank");
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Call Logs</h1>
          <p className="text-white/40 text-sm mt-1">{calls.length} calls</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-white/50 cursor-pointer">
            <input
              type="checkbox"
              checked={escalatedOnly}
              onChange={(e) => setEsc(e.target.checked)}
              className="accent-orange"
            />
            Escalated only
          </label>
          <button
            onClick={exportCsv}
            className="px-4 py-2 text-sm rounded-lg border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-white/5 p-6">
        {loading
          ? <p className="text-white/30 text-sm text-center py-8">Loading…</p>
          : <CallTable calls={calls} />}
      </div>
    </div>
  );
}
