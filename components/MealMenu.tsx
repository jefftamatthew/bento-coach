"use client";

import { useEffect, useRef, useState } from "react";
import { MEAL_TYPES, type MealType } from "@/lib/schema";

/** The ⋯ menu on a meal: move it to another meal type, or delete it. */
export function MealMenu({
  mealName,
  mealType,
  onMove,
  onDelete,
}: {
  mealName: string;
  mealType: MealType;
  onMove: (type: MealType) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const item =
    "flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm hover:bg-accent-soft focus-visible:bg-accent-soft";

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Options for ${mealName}`}
        className="btn-secondary flex h-11 w-11 items-center justify-center rounded-full text-lg leading-none"
      >
        ⋯
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`Options for ${mealName}`}
          onKeyDown={onKeyDown}
          className="absolute right-0 top-full z-20 mt-2 w-48 rounded-2xl border border-line bg-card p-1 shadow-md"
        >
          <p className="px-3 pb-1 pt-2 text-xs text-muted" aria-hidden>
            Move to
          </p>
          {MEAL_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitemradio"
              aria-checked={t.id === mealType}
              onClick={() => {
                if (t.id !== mealType) onMove(t.id);
                close();
              }}
              className={item}
            >
              <span>{t.label}</span>
              {t.id === mealType && (
                <span aria-hidden className="text-accent-ink">
                  ✓
                </span>
              )}
            </button>
          ))}
          <div className="my-1 border-t border-line" role="separator" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              if (confirm(`Delete "${mealName}"? This can't be undone.`)) onDelete();
              else buttonRef.current?.focus();
            }}
            className={`${item} font-medium text-warn-ink hover:bg-warn-soft focus-visible:bg-warn-soft`}
          >
            Delete meal
          </button>
        </div>
      )}
    </div>
  );
}
