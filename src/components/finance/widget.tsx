"use client";

import { ChevronDownIcon } from "@/icons";
import type { PointerEvent, ReactNode } from "react";
import { useRef } from "react";

// کلاس‌ها کامل نوشته شده‌اند تا Tailwind آن‌ها را پیدا کند
export const SPAN_CLASS: Record<number, string> = {
  4: "col-span-12 lg:col-span-4",
  6: "col-span-12 lg:col-span-6",
  8: "col-span-12 lg:col-span-8",
  12: "col-span-12",
};

interface Props {
  id: string;
  title: string;
  span: number;
  spans: number[];
  collapsed: boolean;
  gridRef: { current: HTMLDivElement | null };
  onToggle: (id: string) => void;
  onResize: (id: string, span: number) => void;
  onDragStart: (id: string) => void;
  onDrop: (id: string) => void;
  children: ReactNode;
}

export default function Widget({ id, title, span, spans, collapsed, gridRef, onToggle, onResize, onDragStart, onDrop, children }: Props) {
  const drag = useRef<{ x: number; span: number; colW: number } | null>(null);

  // لبه‌ی چپ (در RTL لبه‌ی انتهایی) برای تغییر اندازه؛ کشیدن به چپ = بزرگ‌تر
  const down = (e: PointerEvent<HTMLDivElement>) => {
    const grid = gridRef.current;
    if (!grid) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, span, colW: grid.clientWidth / 12 };
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const target = d.span + Math.round((d.x - e.clientX) / d.colW);
    const next = spans.reduce((best, s) => (Math.abs(s - target) < Math.abs(best - target) ? s : best), spans[0]);
    if (next !== span) onResize(id, next);
  };
  const up = () => {
    drag.current = null;
  };

  return (
    <article
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(id);
      }}
      className={`relative min-w-0 ${SPAN_CLASS[span] ?? SPAN_CLASS[12]}`}
    >
      <div className="h-full rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", id);
            onDragStart(id);
          }}
          className={`flex cursor-grab select-none items-center justify-between gap-3 active:cursor-grabbing ${collapsed ? "" : "mb-4"}`}
        >
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 10 16" className="h-4 w-2.5 fill-gray-300 dark:fill-gray-600" aria-hidden="true">
              <circle cx="2" cy="2" r="1.5" />
              <circle cx="8" cy="2" r="1.5" />
              <circle cx="2" cy="8" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="2" cy="14" r="1.5" />
              <circle cx="8" cy="14" r="1.5" />
            </svg>
            <h2 className="text-base font-medium text-gray-800 dark:text-white/90">{title}</h2>
          </div>
          <button
            type="button"
            onClick={() => onToggle(id)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "باز کردن" : "جمع کردن"}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          >
            <ChevronDownIcon className={`size-5 transition-transform duration-300 ${collapsed ? "-rotate-90" : ""}`} />
          </button>
        </div>

        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: collapsed ? "0fr" : "1fr" }}
        >
          <div className="min-h-0 overflow-hidden">{children}</div>
        </div>
      </div>

      <div
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="absolute inset-y-6 -left-1 hidden w-2 cursor-ew-resize rounded-full transition-colors hover:bg-brand-500/40 lg:block"
        aria-hidden="true"
      />
    </article>
  );
}
