"use client";
import { useState } from "react";
import { Appointment } from "@/lib/types";

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function firstDayOfMonth(y: number, m: number) {
  return new Date(y, m, 1).getDay();
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

interface CalendarViewProps {
  appointments: Appointment[];
  onDayClick?: (date: string) => void;
}

export function CalendarView({ appointments, onDayClick }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const totalDays = daysInMonth(year, month);
  const startDay  = firstDayOfMonth(year, month);

  const apptMap: Record<string, number> = {};
  for (const a of appointments) {
    const d = new Date(a.appointment_datetime);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate().toString();
      apptMap[key] = (apptMap[key] ?? 0) + 1;
    }
  }

  function prev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="px-3 py-1 text-white/40 hover:text-white/80 text-lg">‹</button>
        <span className="text-sm font-semibold text-white/70">{MONTHS[month]} {year}</span>
        <button onClick={next} className="px-3 py-1 text-white/40 hover:text-white/80 text-lg">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs text-white/25 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const count = apptMap[day.toString()] ?? 0;
          const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          return (
            <button
              key={day}
              onClick={() => onDayClick?.(dateStr)}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors
                ${isToday ? "ring-1 ring-teal" : ""}
                ${count > 0 ? "bg-teal/10 text-teal" : "text-white/50 hover:bg-white/5"}`}
            >
              <span>{day}</span>
              {count > 0 && <span className="text-[9px] opacity-70">{count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
