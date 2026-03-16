"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { CalendarView } from "@/components/CalendarView";
import { Appointment } from "@/lib/types";

const BIZ_ID = process.env.NEXT_PUBLIC_BIZ_ID ?? "demo";

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selected, setSelected]         = useState<string | null>(null);
  const [showNew, setShowNew]           = useState(false);
  const [form, setForm]                 = useState({ patient_name: "", phone: "", appointment_datetime: "", notes: "" });
  const [saving, setSaving]             = useState(false);

  function load() {
    apiFetch<Appointment[]>(`/api/appointments/${BIZ_ID}`).then(setAppointments).catch(() => {});
  }
  useEffect(() => { load(); }, []);

  const dayAppts = selected
    ? appointments.filter(a => a.appointment_datetime.startsWith(selected))
    : [];

  async function book() {
    if (!form.patient_name || !form.phone || !form.appointment_datetime) return;
    setSaving(true);
    try {
      await apiFetch(`/api/appointments/${BIZ_ID}`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      setShowNew(false);
      setForm({ patient_name: "", phone: "", appointment_datetime: "", notes: "" });
      load();
    } catch { alert("Failed to book"); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendar</h1>
          <p className="text-white/40 text-sm mt-1">{appointments.length} upcoming appointments</p>
        </div>
        <button
          onClick={() => setShowNew(v => !v)}
          className="px-4 py-2 bg-teal text-bg text-sm font-semibold rounded-lg"
        >
          + New Appointment
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="col-span-2 bg-surface rounded-xl border border-white/5 p-6">
          <CalendarView appointments={appointments} onDayClick={setSelected} />
        </div>

        {/* Day detail */}
        <div className="bg-surface rounded-xl border border-white/5 p-6">
          <p className="text-xs text-white/30 uppercase tracking-wider mb-3">
            {selected ? selected : "Select a day"}
          </p>
          {!selected && <p className="text-white/25 text-sm">Click a day to see appointments</p>}
          {selected && dayAppts.length === 0 && <p className="text-white/30 text-sm">No appointments</p>}
          <div className="space-y-3">
            {dayAppts.map(a => (
              <div key={a.id} className="bg-bg rounded-lg p-3">
                <p className="text-sm font-medium text-white/80">{a.patient_name}</p>
                <p className="text-xs text-white/40">{a.phone}</p>
                <p className="text-xs text-teal mt-1">
                  {new Date(a.appointment_datetime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
                {a.notes && <p className="text-xs text-white/30 mt-1">{a.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New appointment modal */}
      {showNew && (
        <div className="bg-surface rounded-xl border border-teal/20 p-6 space-y-4 max-w-lg">
          <p className="text-sm font-medium text-white/70">New Appointment</p>
          {[
            { key: "patient_name",         label: "Patient Name",     type: "text" },
            { key: "phone",                label: "Phone",            type: "tel" },
            { key: "appointment_datetime", label: "Date & Time",      type: "datetime-local" },
            { key: "notes",                label: "Notes (optional)", type: "text" },
          ].map(({ key, label, type }) => (
            <label key={key} className="block">
              <span className="text-xs text-white/40 mb-1 block">{label}</span>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-bg border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-teal/50"
              />
            </label>
          ))}
          <div className="flex gap-2">
            <button onClick={book} disabled={saving} className="px-4 py-2 bg-teal text-bg text-sm font-semibold rounded-lg disabled:opacity-40">
              {saving ? "Booking…" : "Book"}
            </button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 text-white/40 text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
