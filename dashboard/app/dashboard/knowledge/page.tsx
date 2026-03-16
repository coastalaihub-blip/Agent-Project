"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

const BIZ_ID = process.env.NEXT_PUBLIC_BIZ_ID ?? "demo";

type FAQ = { id: string; question: string; answer: string };

export default function KnowledgePage() {
  const [faqs, setFaqs]           = useState<FAQ[]>([]);
  const [showAdd, setShowAdd]     = useState(false);
  const [q, setQ]                 = useState("");
  const [a, setA]                 = useState("");
  const [saving, setSaving]       = useState(false);

  function load() {
    apiFetch<FAQ[]>(`/api/knowledge/${BIZ_ID}/faqs`).then(setFaqs).catch(() => {});
  }
  useEffect(() => { load(); }, []);

  async function addFaq() {
    if (!q.trim() || !a.trim()) return;
    setSaving(true);
    try {
      await apiFetch(`/api/knowledge/${BIZ_ID}/faqs`, {
        method: "POST",
        body: JSON.stringify({ question: q, answer: a }),
      });
      setQ(""); setA(""); setShowAdd(false); load();
    } catch { alert("Failed to add FAQ"); }
    finally { setSaving(false); }
  }

  async function deleteFaq(id: string) {
    await apiFetch(`/api/knowledge/${BIZ_ID}/faqs/${id}`, { method: "DELETE" }).catch(() => {});
    load();
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
          <p className="text-white/40 text-sm mt-1">FAQ entries the agent uses to answer callers</p>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="px-4 py-2 bg-teal text-bg text-sm font-semibold rounded-lg"
        >
          + Add FAQ
        </button>
      </div>

      {/* Add drawer */}
      {showAdd && (
        <div className="bg-surface rounded-xl border border-teal/20 p-6 space-y-4">
          <p className="text-sm font-medium text-white/70">New FAQ</p>
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Question"
            className="w-full bg-bg border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-teal/50"
          />
          <textarea
            value={a} onChange={e => setA(e.target.value)}
            placeholder="Answer"
            rows={3}
            className="w-full bg-bg border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 resize-none focus:outline-none focus:border-teal/50"
          />
          <div className="flex gap-2">
            <button onClick={addFaq} disabled={saving} className="px-4 py-2 bg-teal text-bg text-sm font-semibold rounded-lg disabled:opacity-40">
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-white/40 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* FAQ list */}
      <div className="space-y-3">
        {faqs.length === 0 && <p className="text-white/30 text-sm py-8 text-center">No FAQs yet. Add one above.</p>}
        {faqs.map(f => (
          <div key={f.id} className="bg-surface rounded-xl border border-white/5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white/80">{f.question}</p>
                <p className="text-sm text-white/40 mt-1.5">{f.answer}</p>
              </div>
              <button
                onClick={() => deleteFaq(f.id)}
                className="text-white/20 hover:text-orange/70 text-xs shrink-0 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
