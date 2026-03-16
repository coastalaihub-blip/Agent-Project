"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

const BIZ_ID = process.env.NEXT_PUBLIC_BIZ_ID ?? "demo";

const VOICE_OPTIONS = [
  { label: "Priya (Hindi-accented English)", value: "EXAVITQu4vr4xnSDxMaL" },
  { label: "Rahul (Neutral Indian Male)",    value: "TxGEqnHWrfWFTfGW9XjX" },
  { label: "Ananya (Warm Female)",           value: "ThT5KcBeYPX3keUQqHPh" },
  { label: "Custom (enter ID below)",        value: "custom" },
];

export default function ConfigPage() {
  const [prompt, setPrompt]         = useState("");
  const [voiceId, setVoiceId]       = useState(VOICE_OPTIONS[0].value);
  const [customVoice, setCustomVoice] = useState("");
  const [escalation, setEscalation] = useState("");
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);

  useEffect(() => {
    apiFetch<Record<string, string>>(`/api/businesses/${BIZ_ID}/config`).then(cfg => {
      if (cfg.system_prompt)    setPrompt(cfg.system_prompt);
      if (cfg.voice_id)         setVoiceId(cfg.voice_id);
      if (cfg.escalation_phrases) setEscalation(cfg.escalation_phrases);
    }).catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      const effectiveVoice = voiceId === "custom" ? customVoice : voiceId;
      await apiFetch(`/api/businesses/${BIZ_ID}/config`, {
        method: "PUT",
        body: JSON.stringify({
          system_prompt: prompt,
          voice_id: effectiveVoice,
          escalation_phrases: escalation.split(",").map(s => s.trim()).filter(Boolean),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { alert("Failed to save"); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Agent Config</h1>
        <p className="text-white/40 text-sm mt-1">Customise how the AI agent behaves for your business</p>
      </div>

      <div className="space-y-5">
        {/* System prompt */}
        <label className="block">
          <span className="text-xs text-white/40 uppercase tracking-wider mb-2 block">System Prompt</span>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={8}
            placeholder="You are a helpful AI agent for {business_name}..."
            className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-teal/50"
          />
        </label>

        {/* Voice */}
        <label className="block">
          <span className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Voice Persona</span>
          <select
            value={voiceId}
            onChange={e => setVoiceId(e.target.value)}
            className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-teal/50"
          >
            {VOICE_OPTIONS.map(v => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
          {voiceId === "custom" && (
            <input
              value={customVoice}
              onChange={e => setCustomVoice(e.target.value)}
              placeholder="ElevenLabs Voice ID"
              className="mt-2 w-full bg-surface border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-teal/50"
            />
          )}
        </label>

        {/* Escalation triggers */}
        <label className="block">
          <span className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Escalation Trigger Phrases (comma-separated)</span>
          <input
            value={escalation}
            onChange={e => setEscalation(e.target.value)}
            placeholder="urgent, emergency, speak to manager, human"
            className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-teal/50"
          />
        </label>

        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 bg-teal text-bg text-sm font-semibold rounded-lg disabled:opacity-40 transition-opacity"
        >
          {saved ? "Saved ✓" : saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
