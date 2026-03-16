"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { AgentChat } from "@/components/AgentChat";
import { AgentInstruction } from "@/lib/types";

const BIZ_ID = process.env.NEXT_PUBLIC_BIZ_ID ?? "demo";

export default function ChatPage() {
  const [instructions, setInstructions] = useState<AgentInstruction[]>([]);

  function load() {
    apiFetch<AgentInstruction[]>(`/api/agent/instructions/${BIZ_ID}`).then(setInstructions).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-8 h-[calc(100vh-2rem)] flex flex-col space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Agent Chat</h1>
        <p className="text-white/40 text-sm mt-1">
          Send runtime instructions to the agent. These are read at the start of each call.
        </p>
      </div>
      <div className="flex-1 bg-surface rounded-xl border border-white/5 p-6 flex flex-col overflow-hidden">
        <AgentChat businessId={BIZ_ID} instructions={instructions} onSent={load} />
      </div>
    </div>
  );
}
