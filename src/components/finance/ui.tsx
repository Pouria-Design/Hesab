"use client";

import { MONTHS, toFaDigits } from "@/lib/finance";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

export const card = "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3";
export const input =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-hidden focus:border-brand-300 dark:border-gray-700 dark:text-white/90";
export const label = "mb-1.5 block text-sm text-gray-600 dark:text-gray-400";
export const btnPri =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50";
export const btnSec =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5";
export const muted = "text-sm text-gray-500 dark:text-gray-400";
export const pageTitle = "text-xl font-semibold text-gray-800 dark:text-white/90";

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
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
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        if (!dismissable) e.preventDefault();
      }}
      className="m-auto w-[min(440px,92vw)] rounded-2xl border border-gray-200 bg-white p-6 text-gray-800 backdrop:bg-black/40 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90"
    >
      {children}
    </dialog>
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
