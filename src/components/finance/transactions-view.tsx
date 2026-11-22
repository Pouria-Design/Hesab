"use client";

import { useFinance } from "@/context/finance-context";
import { categoriesOf, faNum, findDuplicates, jnow, norm, parseAmount, recentTx, sumOf, toFaDigits, type Tx } from "@/lib/finance";
import { PlusIcon } from "@/icons";
import { useState } from "react";
import { TxAdd, TxEdit } from "./tx-dialogs";
import { btnPri, btnSec, card, input, muted, pageTitle } from "./ui";

type Range = "7" | "30" | "month" | "all";
const RANGES: [Range, string][] = [
  ["7", "۷ روز اخیر"],
  ["30", "۳۰ روز اخیر"],
  ["month", "این ماه"],
  ["all", "همه"],
];

export default function TransactionsView() {
  const { data, month } = useFinance();
  const [range, setRange] = useState<Range>("30");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [acc, setAcc] = useState("");
  const [minA, setMinA] = useState("");
  const [maxA, setMaxA] = useState("");
  const [edit, setEdit] = useState<Tx | null>(null);
  const [adding, setAdding] = useState(false);

  const cutoff = (days: number) => jnow(new Date(Date.now() - days * 86400000)).date;
  const inRange = (t: Tx) => {
    if (range === "all") return true;
    if (range === "month") return t.date.slice(0, 7) === month;
    return t.date >= cutoff(+range);
  };

  const needle = norm(q);
  const lo = parseAmount(minA);
  const hi = parseAmount(maxA);
  const dups = findDuplicates(data.tx);
  const accNames = [...new Set(data.tx.map((t) => t.account).filter(Boolean))];

  const list = recentTx(data).filter(
    (t) =>
      inRange(t) &&
      (!needle || norm(t.title).includes(needle) || norm(t.category).includes(needle)) &&
      (!cat || t.category === cat) &&
      (!acc || t.account === acc) &&
      (!lo || t.total >= lo) &&
      (!hi || t.total <= hi)
  );
  const outs = list.filter((t) => t.type === "برداشت");
  const ins = list.filter((t) => t.type === "واریز");
  const untitled = list.filter((t) => !t.title).length;

  const stats = [
    { label: "تعداد تراکنش‌ها", value: toFaDigits(String(list.length)), cls: "text-gray-900 dark:text-white" },
    { label: "مجموع برداشت", value: faNum(sumOf(outs)), cls: "text-red-500" },
    { label: "مجموع واریز", value: faNum(sumOf(ins)), cls: "text-green-600 dark:text-green-400" },
    { label: "بدون عنوان", value: toFaDigits(String(untitled)), cls: "text-orange-500" },
  ];

  const resetFilters = () => {
    setQ("");
    setCat("");
    setAcc("");
    setMinA("");
    setMaxA("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={pageTitle}>تراکنش‌ها</h1>
        <div className="flex flex-wrap items-center gap-3">
          <select className={`${input} w-auto min-w-36`} value={range} onChange={(e) => setRange(e.target.value as Range)}>
            {RANGES.map(([v, name]) => (
              <option key={v} value={v}>
                {name}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setAdding(true)} className={btnPri}>
            <PlusIcon className="size-5" />
            افزودن
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={card}>
            <div className={muted}>{s.label}</div>
            <div className={`mt-2 text-xl font-semibold ${s.cls}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className={`${card} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-medium text-gray-900 dark:text-white">گزارش تراکنش‌ها</h2>
            <p className={muted}>برای ویرایش عنوان یا دسته، روی ردیف بزن.</p>
          </div>
          <span className={`${muted} whitespace-nowrap`}>{toFaDigits(String(list.length))} مورد</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <input className={`${input} lg:col-span-2`} placeholder="جستجو در عنوان یا دسته" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className={input} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">همه‌ی دسته‌ها</option>
            {categoriesOf(data).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select className={input} value={acc} onChange={(e) => setAcc(e.target.value)}>
            <option value="">همه‌ی حساب‌ها</option>
            {accNames.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <input className={input} inputMode="numeric" placeholder="از مبلغ" value={minA} onChange={(e) => setMinA(e.target.value)} />
          <input className={input} inputMode="numeric" placeholder="تا مبلغ" value={maxA} onChange={(e) => setMaxA(e.target.value)} />
        </div>
        <div>
          <button type="button" onClick={resetFilters} className={`${btnSec} h-9 px-3 text-xs`}>
            پاک کردن فیلترها
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 dark:text-gray-400">
                <th className="px-3 py-2 text-start font-medium whitespace-nowrap">تاریخ</th>
                <th className="px-3 py-2 text-start font-medium whitespace-nowrap">ساعت</th>
                <th className="px-3 py-2 text-start font-medium">عنوان</th>
                <th className="px-3 py-2 text-start font-medium">دسته</th>
                <th className="px-3 py-2 text-start font-medium">حساب</th>
                <th className="px-3 py-2 text-start font-medium whitespace-nowrap">مبلغ</th>
                <th className="px-3 py-2 text-start font-medium whitespace-nowrap">موجودی</th>
                <th className="px-3 py-2 text-start font-medium whitespace-nowrap">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => {
                const status = dups.has(t.id)
                  ? { text: "احتمال تکراری", cls: "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400" }
                  : t.title
                    ? { text: "عنوان دارد", cls: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400" }
                    : { text: "بدون عنوان", cls: "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400" };
                return (
                  <tr key={t.id} onClick={() => setEdit(t)} className="cursor-pointer border-t border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                    <td className="px-3 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{toFaDigits(t.date)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{toFaDigits(t.time)}</td>
                    <td className="px-3 py-3 text-gray-800 dark:text-white/90">{t.title || <span className="text-gray-400">—</span>}</td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{t.category || "—"}</td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{t.account || "—"}</td>
                    <td className={`px-3 py-3 whitespace-nowrap font-medium ${t.type === "برداشت" ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
                      {t.type === "برداشت" ? "−" : "+"}
                      {faNum(t.total)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{t.balance ? faNum(t.balance) : "—"}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.cls}`}>{status.text}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!list.length && <p className={`${muted} py-8 text-center`}>تراکنشی با این فیلترها پیدا نشد.</p>}
        </div>
      </div>

      <TxEdit tx={edit} onClose={() => setEdit(null)} />
      <TxAdd open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}
