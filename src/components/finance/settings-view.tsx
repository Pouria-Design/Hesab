"use client";

import { useFinance } from "@/context/finance-context";
import { useTheme } from "@/context/theme-context";
import { faNum, jnow, parseAmount, toFaDigits } from "@/lib/finance";
import { useState } from "react";
import { btnPri, btnSec, card, input, label, muted, pageTitle } from "./ui";

const THEMES = [
  ["light", "روشن"],
  ["dark", "تاریک"],
  ["auto", "سیستم"],
] as const;

export default function SettingsView() {
  const { data, write, accent, setAccent, resetToken } = useFinance();
  const { themeMode, setThemeMode } = useTheme();
  const [, force] = useState(0);
  const initial = data.settings.initial_balance;

  const saveInitial = (v: string) => {
    const n = parseAmount(v);
    if (!n) return;
    const now = jnow();
    write({ action: "setting", key: "initial_balance", value: String(n) });
    write({ action: "setting", key: "initial_at", value: `${now.date} ${now.time}` });
    force((x) => x + 1);
  };

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
        <p className={muted}>{initial ? `موجودی اولیه: ${faNum(+initial)} تومان` : "موجودی اولیه هنوز تنظیم نشده."}</p>
        <div>
          <label className={label}>موجودی اولیه الان (تومان)</label>
          <input
            key={initial ?? "none"}
            className={input}
            inputMode="numeric"
            defaultValue={initial ? toFaDigits(initial) : ""}
            onBlur={(e) => {
              if (parseAmount(e.target.value) !== parseAmount(initial ?? "")) saveInitial(e.target.value);
            }}
          />
        </div>
      </div>

      <div className={`${card} space-y-3`}>
        <h2 className="text-base font-medium text-gray-900 dark:text-white">حساب‌ها</h2>
        {data.accounts.map((a) => (
          <div key={a[0]} className="flex justify-between text-sm">
            <span className="text-gray-800 dark:text-white/90">{a[1]}</span>
            <span className={muted}>{toFaDigits(a[0])}</span>
          </div>
        ))}
        <p className={muted}>حساب جدید را در شیت «حساب‌ها» اضافه کن.</p>
      </div>

      <div className={card}>
        <button type="button" onClick={resetToken} className={`${btnSec} w-full`}>
          تغییر توکن دسترسی
        </button>
      </div>
    </div>
  );
}
