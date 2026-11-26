"use client";

import { useFinance } from "@/context/finance-context";
import { useTheme } from "@/context/theme-context";
import { toFaDigits } from "@/lib/finance";
import { btnPri, btnSec, card, muted, pageTitle } from "./ui";

const THEMES = [
  ["light", "روشن"],
  ["dark", "تاریک"],
  ["auto", "سیستم"],
] as const;

export default function SettingsView() {
  const { data, accent, setAccent, resetToken } = useFinance();
  const { themeMode, setThemeMode } = useTheme();

  return (
    <div className="space-y-6">
      <h1 className={pageTitle}>تنظیمات</h1>

      <div className={`${card} space-y-4`}>
        <h2 className="text-base font-medium text-gray-900 dark:text-white">ظاهر</h2>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map(([v, name]) => (
            <button key={v} type="button" onClick={() => setThemeMode(v)} className={themeMode === v ? btnPri : btnSec}>
              {name}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">رنگ اصلی سایت</span>
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="h-10 w-16 cursor-pointer rounded-lg border border-gray-300 bg-transparent p-1 dark:border-gray-700"
          />
        </div>
      </div>

      <div className={`${card} space-y-3`}>
        <h2 className="text-base font-medium text-gray-900 dark:text-white">موجودی</h2>
        <p className={muted}>موجودی حساب همیشه از آخرین پیامک بانک خوانده می‌شود و نیازی به تنظیم دستی ندارد.</p>
      </div>

      <div className={`${card} space-y-3`}>
        <h2 className="text-base font-medium text-gray-900 dark:text-white">حساب‌ها</h2>
        {data.accounts.length ? (
          data.accounts.map((a) => (
            <div key={a[0]} className="flex justify-between text-sm">
              <span className="text-gray-800 dark:text-white/90">{a[1]}</span>
              <span className={muted}>{toFaDigits(a[0])}</span>
            </div>
          ))
        ) : (
          <p className={muted}>حسابی ثبت نشده است.</p>
        )}
      </div>

      <div className={card}>
        <button type="button" onClick={resetToken} className={`${btnSec} w-full`}>
          تغییر توکن دسترسی
        </button>
      </div>
    </div>
  );
}
