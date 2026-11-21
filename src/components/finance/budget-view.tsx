"use client";

import { useFinance } from "@/context/finance-context";
import { byCategory, categoriesOf, faNum, inMonth, parseAmount, sumOf, toFaDigits, type Data } from "@/lib/finance";
import { btnSec, card, input, MonthNav, muted, pageTitle } from "./ui";

function exportCsv(data: Data, month: string) {
  const rows = [
    ["تاریخ", "ساعت", "نوع", "مبلغ (تومان)", "عنوان", "دسته", "حساب"],
    ...inMonth(data, month).map((t) => [t.date, t.time, t.type, String(t.total), t.title, t.category, t.account]),
  ];
  const csv = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv" })),
    download: `${month}.csv`,
  });
  a.click();
}

export default function BudgetView() {
  const { data, month, shift, write } = useFinance();
  if (!month) return null;

  const expenses = inMonth(data, month, "برداشت");
  const spent = byCategory(expenses);
  const total = sumOf(expenses);
  const names = [...new Set([...categoriesOf(data), ...Object.keys(spent)])];
  const limitOf = (c: string) => +(data.budgets.find((r) => r[0] === c)?.[1] ?? 0);
  const report = (Object.entries(spent) as [string, number][]).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={pageTitle}>بودجه</h1>
        <MonthNav month={month} shift={shift} />
      </div>

      <div className={card}>
        <h2 className="mb-2 text-base font-medium">سقف ماهانه هر دسته</h2>
        {names.map((c) => {
          const lim = limitOf(c);
          const s = spent[c] || 0;
          const p = lim ? Math.min(100, (s / lim) * 100) : 0;
          return (
            <div key={c} className="border-b border-gray-100 py-4 last:border-0 dark:border-gray-800">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-gray-800 dark:text-white/90">{c}</span>
                <span className={muted}>
                  {faNum(s)}
                  {lim ? ` از ${faNum(lim)}` : ""}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={`h-full rounded-full ${lim && s > lim ? "bg-red-500" : "bg-brand-500"}`}
                  style={{ width: `${p}%` }}
                />
              </div>
              <input
                key={lim}
                className={`${input} mt-3`}
                inputMode="numeric"
                placeholder="سقف ماهانه (تومان)"
                defaultValue={lim ? toFaDigits(String(lim)) : ""}
                onBlur={(e) => {
                  const v = parseAmount(e.target.value);
                  if (v !== lim) write({ action: "budget", category: c, amount: v });
                }}
              />
            </div>
          );
        })}
      </div>

      <div className={card}>
        <h2 className="mb-2 text-base font-medium">گزارش ماه</h2>
        {report.map(([c, v]) => (
          <div key={c} className="flex justify-between border-b border-gray-100 py-2.5 text-sm last:border-0 dark:border-gray-800">
            <span>{c}</span>
            <span>
              {faNum(v)} · {toFaDigits(String(total ? Math.round((v / total) * 100) : 0))}٪
            </span>
          </div>
        ))}
        <div className="flex justify-between pt-3 text-sm font-medium">
          <span>جمع هزینه</span>
          <span>{faNum(total)}</span>
        </div>
        {!report.length && <p className={muted}>هزینه‌ای برای این ماه نیست.</p>}
      </div>

      <button type="button" onClick={() => exportCsv(data, month)} className={btnSec}>
        خروجی CSV این ماه
      </button>
    </div>
  );
}
