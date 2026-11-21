"use client";

import { useFinance } from "@/context/finance-context";
import { useTheme } from "@/context/theme-context";
import { categoriesOf, faNum, jnow, parseAmount, toFaDigits } from "@/lib/finance";
import { useState } from "react";
import { btnPri, btnSec, Chip, card, input, label, muted, pageTitle } from "./ui";

const THEMES = [
  ["light", "روشن"],
  ["dark", "تاریک"],
  ["auto", "سیستم"],
] as const;

export default function SettingsView() {
  const { data, write, accent, setAccent, resetToken } = useFinance();
  const { themeMode, setThemeMode } = useTheme();
  const [kw, setKw] = useState("");
  const [kc, setKc] = useState("");

  const initial = data.settings.initial_balance;

  const saveInitial = (v: string) => {
    const n = parseAmount(v);
    if (!n) return;
    const now = jnow();
    write({ action: "setting", key: "initial_balance", value: String(n) });
    write({ action: "setting", key: "initial_at", value: `${now.date} ${now.time}` });
  };

  const addRule = () => {
    if (!kw.trim() || !kc.trim()) return;
    write({ action: "rule", keyword: kw.trim(), category: kc.trim() });
    setKw("");
    setKc("");
  };

  return (
    <div className="space-y-6">
      <h1 className={pageTitle}>تنظیمات</h1>

      <div className={`${card} space-y-4`}>
        <h2 className="text-base font-medium">ظاهر</h2>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map(([v, name]) => (
            <button
              key={v}
              type="button"
              onClick={() => setThemeMode(v)}
              className={themeMode === v ? btnPri : btnSec}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">رنگ اصلی</span>
          <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-10 w-16 cursor-pointer rounded-lg border border-gray-300 bg-transparent p-1 dark:border-gray-700" />
        </div>
      </div>

      <div className={`${card} space-y-3`}>
        <h2 className="text-base font-medium">موجودی</h2>
        <p className={muted}>
          {initial ? `موجودی اولیه: ${faNum(+initial)} تومان` : "موجودی اولیه هنوز تنظیم نشده."}
        </p>
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

      <div className={`${card} space-y-4`}>
        <h2 className="text-base font-medium">قوانین دسته‌بندی خودکار</h2>
        <p className={muted}>اگر کلیدواژه داخل عنوان تراکنش باشد، تراکنش در دسته‌ی مربوطه قرار می‌گیرد.</p>
        {data.rules.map((r, i) => (
          <div key={`${r[0]}-${i}`} className="flex items-center justify-between border-b border-gray-100 py-2 text-sm last:border-0 dark:border-gray-800">
            <span>{r[0]}</span>
            <Chip>{r[1]}</Chip>
          </div>
        ))}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input className={input} placeholder="کلیدواژه" value={kw} onChange={(e) => setKw(e.target.value)} />
          <input className={input} list="cats" placeholder="دسته" value={kc} onChange={(e) => setKc(e.target.value)} />
          <button type="button" onClick={addRule} className={btnPri}>
            افزودن قانون
          </button>
        </div>
        <datalist id="cats">
          {categoriesOf(data).map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className={`${card} space-y-3`}>
        <h2 className="text-base font-medium">حساب‌ها</h2>
        {data.accounts.map((a) => (
          <div key={a[0]} className="flex justify-between text-sm">
            <span>{a[1]}</span>
            <span className={muted}>{toFaDigits(a[0])}</span>
          </div>
        ))}
        <p className={muted}>حساب جدید را در شیت «حساب‌ها» اضافه کن.</p>
      </div>

      <div className={card}>
        <button type="button" onClick={resetToken} className={`${btnSec} w-full`}>
          تغییر توکن
        </button>
      </div>
    </div>
  );
}
