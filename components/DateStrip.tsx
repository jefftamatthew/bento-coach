"use client";

import { useEffect, useRef } from "react";
import { addDays, dayToDate, todayKey } from "@/lib/storage";

const DAYS_SHOWN = 14;

/**
 * Two weeks of days, newest on the right. If the picked day is older than that,
 * the strip moves back so the picked day is always visible.
 */
export function DateStrip({
  selected,
  logged,
  onSelect,
}: {
  selected: string;
  logged: Set<string>;
  onSelect: (day: string) => void;
}) {
  const today = todayKey();
  const end = addDays(selected, 6) < today ? addDays(selected, 6) : today;
  const days = Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(end, i - DAYS_SHOWN + 1));

  const selectedRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [selected]);

  return (
    <div className="-mx-4 scroll-px-4 overflow-x-auto [scrollbar-width:none]">
      <ul className="flex w-max gap-2 px-4 py-1" aria-label="Pick a day">
        {days.map((day) => {
          const d = dayToDate(day);
          const active = day === selected;
          const isToday = day === today;
          const hasMeals = logged.has(day);
          const label = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
          return (
            <li key={day}>
              <button
                ref={active ? selectedRef : undefined}
                type="button"
                onClick={() => onSelect(day)}
                aria-pressed={active}
                aria-label={`${isToday ? "Today, " : ""}${label}${hasMeals ? ", has meals" : ""}`}
                className={`flex h-[4.5rem] w-14 flex-col items-center justify-center rounded-2xl border transition-transform active:scale-[0.98] ${
                  active ? "border-accent bg-accent text-on-accent" : "border-line bg-card hover:border-accent"
                }`}
              >
                <span className={`text-xs ${active ? "" : "text-muted"}`}>
                  {isToday ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className="text-lg font-bold tabular-nums leading-tight">{d.getDate()}</span>
                <span
                  aria-hidden
                  className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                    hasMeals ? (active ? "bg-on-accent" : "bg-accent") : "bg-transparent"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
