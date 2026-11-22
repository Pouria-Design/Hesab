"use client";

import { useFinance } from "@/context/finance-context";
import { useTheme } from "@/context/theme-context";
import { byCategory, categoriesOf, faNum, inMonth, sumOf, toFaDigits, toFaMoney } from "@/lib/finance";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useState } from "react";
import { btnPri, Chip, card, input, MonthNav, muted, PALETTE, pageTitle } from "./ui";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function CategoriesView() {
  const { data, month, shift, write } = useFinance();
  const { theme } = useTheme();
  const [kw, setKw] = useState("");
  const [kc, setKc] = useState("");

  if (!month) return null;

  const dark = theme === "dark";
  const expenses = inMonth(data, month, "برداشت");
  const total = sumOf(expenses);
  const rows = (Object.entries(byCategory(expenses)) as [string, number][]).sort((a, b) => b[1] - a[1]);
  const counts = expenses.reduce<Record<string, number>>((m, t) => {
    const c = t.category || "نامشخص";
    m[c] = (m[c] || 0) + 1;
    return m;
  }, {});

  const donut: ApexOptions = {
    chart: { type: "donut", background: "transparent", fontFamily: "inherit" },
    labels: rows.map(([c]) => c),
    colors: rows.map((_, i) => PALETTE[i % PALETTE.length]),
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { colors: [dark ? "#101828" : "#ffffff"], width: 2 },
    plotOptions: { pie: { donut: { size: "70%" } } },
    tooltip: { y: { formatter: (v: number) => toFaMoney(v) } },
    theme: { mode: dark ? "dark" : "light" },
  };

  const addRule = () => {
    if (!kw.trim() || !kc.trim()) return;
    write({ action: "rule", keyword: kw.trim(), category: kc.trim() });
    setKw("");
    setKc("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={pageTitle}>دسته‌بندی‌ها</h1>
        <MonthNav month={month} shift={shift} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className={`${card} lg:col-span-2`}>
          <h2 className="mb-2 text-base font-medium text-gray-900 dark:text-white">سهم هر دسته از کل هزینه</h2>
          {rows.length ? (
            <Chart type="donut" height={280} options={donut} series={rows.map(([, v]) => v)} />
          ) : (
            <p className={muted}>هزینه‌ای برای این ماه ثبت نشده.</p>
          )}
          <div className="mt-2 text-center">
            <div className={muted}>جمع هزینه</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{toFaMoney(total)}</div>
          </div>
        </div>

        <div className={`${card} lg:col-span-3`}>
          <h2 className="mb-3 text-base font-medium text-gray-900 dark:text-white">جزئیات دسته‌ها</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2 text-start font-medium">دسته</th>
                  <th className="px-3 py-2 text-start font-medium">تعداد</th>
                  <th className="px-3 py-2 text-start font-medium whitespace-nowrap">مبلغ</th>
                  <th className="px-3 py-2 text-start font-medium">درصد</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([c, v], i) => {
                  const pct = total ? Math.round((v / total) * 100) : 0;
                  return (
                    <tr key={c} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-2">
                          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                          <span className="text-gray-800 dark:text-white/90">{c}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{toFaDigits(String(counts[c] || 0))}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-800 dark:text-white/90">{faNum(v)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: PALETTE[i % PALETTE.length] }} />
                          </div>
                          <span className="text-gray-500 dark:text-gray-400">{toFaDigits(String(pct))}٪</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!rows.length && <p className={`${muted} py-6 text-center`}>هزینه‌ای برای این ماه نیست.</p>}
          </div>
        </div>
      </div>

      <div className={`${card} space-y-4`}>
        <div>
          <h2 className="text-base font-medium text-gray-900 dark:text-white">قوانین دسته‌بندی خودکار</h2>
          <p className={muted}>اگر کلیدواژه داخل عنوان تراکنش باشد، تراکنش در دسته‌ی مربوطه قرار می‌گیرد. قانون جدید فقط اضافه می‌شود؛ حذف از شیت «قوانین» انجام می‌شود.</p>
        </div>
        {data.rules.map((r, i) => (
          <div key={`${r[0]}-${i}`} className="flex items-center justify-between border-b border-gray-100 py-2 text-sm last:border-0 dark:border-gray-800">
            <span className="text-gray-800 dark:text-white/90">{r[0]}</span>
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
    </div>
  );
}
