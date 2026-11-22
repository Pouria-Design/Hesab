"use client";

import { useFinance } from "@/context/finance-context";
import { useEffect } from "react";

export default function UndoToast() {
  const { lastDeleted, undoDelete, dismissUndo } = useFinance();

  useEffect(() => {
    if (!lastDeleted) return;
    const t = setTimeout(dismissUndo, 5000);
    return () => clearTimeout(t);
  }, [lastDeleted, dismissUndo]);

  if (!lastDeleted) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-xl bg-gray-900 px-4 py-3 text-sm text-white shadow-lg lg:left-[calc(50%+130px)]">
      <span>تراکنش حذف شد</span>
      <button type="button" onClick={undoDelete} className="font-medium text-brand-400">
        برگردان
      </button>
    </div>
  );
}
