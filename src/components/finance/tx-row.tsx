"use client";

import { faNum, toFaDigits, type Tx } from "@/lib/finance";
import { Chip } from "./ui";

export default function TxRow({ t, onClick }: { t: Tx; onClick?: () => void }) {
  const out = t.type === "برداشت";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 border-b border-gray-100 py-3 text-start last:border-0 dark:border-gray-800"
    >
      <div className="min-w-0">
        <div className="truncate text-sm text-gray-800 dark:text-white/90">
          {t.title || <span className="text-gray-400">بدون عنوان</span>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {toFaDigits(t.date)} {toFaDigits(t.time)}
          </span>
          {t.category && <Chip>{t.category}</Chip>}
        </div>
      </div>
      <div
        className={`shrink-0 text-sm font-medium ${out ? "text-red-500" : "text-green-600 dark:text-green-400"}`}
      >
        {out ? "−" : "+"}
        {faNum(t.total)}
      </div>
    </button>
  );
}
