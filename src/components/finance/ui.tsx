"use client";

import { MONTHS, toFaDigits } from "@/lib/finance";
import { type ReactNode, useEffect } from "react";

export const PALETTE = ["#12b76a", "#465fff", "#f79009", "#f04438", "#7a5af8", "#06aed4", "#ee46bc", "#667085", "#16b364", "#fdb022"];
export const card = "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900";
export const input = "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-hidden focus:border-brand-500 dark:border-gray-700 dark:text-white/90";
export const label = "mb-1.5 block text-sm text-gray-600 dark:text-gray-400";
export const btnPri = "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50";
export const btnSec = "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5";
export const muted = "text-sm text-gray-500 dark:text-gray-400";
export const pageTitle = "text-xl font-semibold text-gray-900 dark:text-white";

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
      {children}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  dismissable = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  dismissable?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open || !dismissable) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open, dismissable, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-y-0 left-0 right-0 z-30 flex items-center justify-center bg-black/40 p-4 lg:right-[260px]"
      onClick={() => dismissable && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-gray-800 shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:text-white/90"
      >
        {children}
      </div>
    </div>
  );
}

export function MonthNav({ month, shift }: { month: string; shift: (n: number) => void }) {
  const [y, m] = month.split(".");
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => shift(-1)} className={`${btnSec} h-9 px-3`}>
        قبلی
      </button>
      <span className="min-w-28 text-center text-sm font-medium text-gray-800 dark:text-white/90">
        {month ? `${MONTHS[+m - 1]} ${toFaDigits(y)}` : ""}
      </span>
      <button type="button" onClick={() => shift(1)} className={`${btnSec} h-9 px-3`}>
        بعدی
      </button>
    </div>
  );
}
