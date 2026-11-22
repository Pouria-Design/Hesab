"use client";

import { useFinance } from "@/context/finance-context";
import { useTheme } from "@/context/theme-context";
import { balanceOf, byCategory, faNum, inMonth, jnow, norm, recentTx, sumOf, toFaDigits, toFaMoney, type Tx } from "@/lib/finance";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { TxEdit } from "./tx-dialogs";
import Widget from "./widget";
import { btnSec, Chip, input, MonthNav, muted, PALETTE, pageTitle } from "./ui";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface Cfg {
  id: string;
  span: number;
  collapsed: boolean;
}

const META: Record<string, { title: string; spans: number[] }> = {
  balance: { title: "موجودی حساب", spans: [12] },
  expense: { title: "هزینه این ماه", spans: [6, 12] },
  income: { title: "درآمد این ماه", spans: [6, 12] },
  trend: { title: "روند روزانه (۱۴ روز اخیر)", spans: [4, 6, 8, 12] },
  categories: { title: "سهم دسته‌بندی‌ها (این ماه)", spans: [4, 6, 8, 12] },
  recent: { title: "تراکنش‌های اخیر", spans: [12] },
};

const DEFAULT: Cfg[] = [
  { id: "balance", span: 12, collapsed: false },
  { id: "expense", span: 6, collapsed: false },
  { id: "income", span: 6, collapsed: false },
  { id: "trend", span: 8, collapsed: false },
  { id: "categories", span: 4, collapsed: false },
  { id: "recent", span: 12, collapsed: false },
];

const KEY = "hb-dash-v1";

function loadCfg(): Cfg[] {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Cfg[] | null;
    if (!Array.isArray(saved)) return DEFAULT;
    const known = saved
      .filter((s) => META[s.id])
      .map((s) => ({
        ...s,
        span: META[s.id].spans.includes(s.span) ? s.span : (DEFAULT.find((d) => d.id === s.id)?.span ?? 12),
      }));
    const missing = DEFAULT.filter((d) => !known.some((k) => k.id === d.id));
    return [...known, ...missing];
  } catch {
    return DEFAULT;
  }
}

function RecentTable({ onOpen }: { onOpen: (t: Tx) => void }) {
  const { data } = useFinance();
  const [q, setQ] = useState("");
  const needle = norm(q);
  const all = recentTx(data).filter((t) => !needle || norm(t.title).includes(needle) || norm(t.category).includes(needle));
  const list = all.slice(0, 10);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <input className={`${input} max-w-xs`} placeholder="جستجو در عنوان یا دسته" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className={muted}>{toFaDigits(String(all.length))} مورد</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 dark:text-gray-400">
              <th className="px-3 py-2 text-start font-medium whitespace-nowrap">تاریخ</th>
              <th className="px-3 py-2 text-start font-medium">عنوان</th>
              <th className="px-3 py-2 text-start font-medium">دسته</th>
              <th className="px-3 py-2 text-start font-medium whitespace-nowrap">مبلغ</th>
            </tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id} onClick={() => onOpen(t)} className="cursor-pointer border-t border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5">
                <td className="px-3 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                  {toFaDigits(t.date)} {toFaDigits(t.time)}
                </td>
                <td className="px-3 py-3 text-gray-800 dark:text-white/90">
                  {t.title || <span className="text-gray-400">بدون عنوان</span>}
                </td>
                <td className="px-3 py-3">{t.category ? <Chip>{t.category}</Chip> : <span className={muted}>—</span>}</td>
                <td className={`px-3 py-3 whitespace-nowrap font-medium ${t.type === "برداشت" ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
                  {t.type === "برداشت" ? "−" : "+"}
                  {faNum(t.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <p className={`${muted} py-6 text-center`}>تراکنشی پیدا نشد.</p>}
      </div>
    </div>
  );
}

export default function DashboardView() {
  const { data, month, shift } = useFinance();
  const { theme } = useTheme();
  const [cfg, setCfg] = useState<Cfg[]>(DEFAULT);
  const [dragId, setDragId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Tx | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => setCfg(loadCfg()), []);

  const update = (fn: (prev: Cfg[]) => Cfg[]) =>
    setCfg((prev) => {
      const next = fn(prev);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });

  const toggle = (id: string) => update((p) => p.map((x) => (x.id === id ? { ...x, collapsed: !x.collapsed } : x)));
  const resize = (id: string, span: number) => update((p) => p.map((x) => (x.id === id ? { ...x, span } : x)));
  const drop = (target: string) => {
    if (!dragId || dragId === target) return;
    update((p) => {
      const from = p.findIndex((x) => x.id === dragId);
      const to = p.findIndex((x) => x.id === target);
      if (from < 0 || to < 0) return p;
      const next = [...p];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setDragId(null);
  };

  if (!month) return null;

  const dark = theme === "dark";
  const text = dark ? "#98a2b3" : "#667085";
  const gridColor = dark ? "#262c36" : "#e4e7ec";
  const expenses = inMonth(data, month, "برداشت");
  const exp = sumOf(expenses);
  const inc = sumOf(inMonth(data, month, "واریز"));
  const bal = balanceOf(data);
  const lastBank = recentTx(data).find((t) => t.balance > 0);

  const cats = (Object.entries(byCategory(expenses)) as [string, number][]).sort((a, b) => b[1] - a[1]);
  const catColor = (i: number) => PALETTE[i % PALETTE.length];

  const days = Array.from({ length: 14 }, (_, i) => jnow(new Date(Date.now() - (13 - i) * 86400000)).date);
  const dayTotal = (d: string, type: "برداشت" | "واریز") => sumOf(data.tx.filter((t) => t.date === d && t.type === type));

  const trend: ApexOptions = {
    chart: { type: "area", toolbar: { show: false }, background: "transparent", fontFamily: "inherit" },
    colors: ["#f04438", "#12b76a"],
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.35, opacityTo: 0.02 } },
    dataLabels: { enabled: false },
    xaxis: { categories: days.map((d) => toFaDigits(d.slice(8))), labels: { style: { colors: text } } },
    yaxis: { labels: { style: { colors: text }, formatter: (v: number) => faNum(v) } },
    grid: { borderColor: gridColor },
    legend: { position: "top", horizontalAlign: "right", labels: { colors: text } },
    tooltip: { y: { formatter: (v: number) => toFaMoney(v) } },
    theme: { mode: dark ? "dark" : "light" },
  };

  const donut: ApexOptions = {
    chart: { type: "donut", background: "transparent", fontFamily: "inherit" },
    labels: cats.map(([c]) => c),
    colors: cats.map((_, i) => catColor(i)),
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { colors: [dark ? "#101828" : "#ffffff"], width: 2 },
    plotOptions: { pie: { donut: { size: "70%" } } },
    tooltip: { y: { formatter: (v: number) => toFaMoney(v) } },
    theme: { mode: dark ? "dark" : "light" },
  };

  const body = (id: string): ReactNode => {
    switch (id) {
      case "balance":
        return (
          <>
            <div className="text-3xl font-semibold text-gray-900 dark:text-white">{bal === null ? "تنظیم نشده" : toFaMoney(bal)}</div>
            <div className={`${muted} mt-1`}>
              {bal === null ? "از تنظیمات موجودی اولیه را وارد کن." : lastBank ? `آخرین موجودی بانک: ${toFaMoney(lastBank.balance)}` : ""}
            </div>
          </>
        );
      case "expense":
        return (
          <>
            <div className="text-2xl font-semibold text-red-500">{toFaMoney(exp)}</div>
            <div className={`${muted} mt-1`}>{toFaDigits(String(expenses.length))} تراکنش</div>
          </>
        );
      case "income":
        return (
          <>
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400">{toFaMoney(inc)}</div>
            <div className={`${muted} mt-1`}>{toFaDigits(String(inMonth(data, month, "واریز").length))} تراکنش</div>
          </>
        );
      case "trend":
        return (
          <Chart
            type="area"
            height={260}
            options={trend}
            series={[
              { name: "هزینه", data: days.map((d) => dayTotal(d, "برداشت")) },
              { name: "درآمد", data: days.map((d) => dayTotal(d, "واریز")) },
            ]}
          />
        );
      case "categories":
        return cats.length ? (
          <>
            <Chart type="donut" height={220} options={donut} series={cats.map(([, v]) => v)} />
            <ul className="mt-3 space-y-2">
              {cats.slice(0, 6).map(([c, v], i) => (
                <li key={c} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: catColor(i) }} />
                    <span className="truncate text-gray-800 dark:text-white/90">{c}</span>
                  </span>
                  <span className="shrink-0 text-gray-500 dark:text-gray-400">
                    {toFaDigits(String(exp ? Math.round((v / exp) * 100) : 0))}٪ · {faNum(v)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className={muted}>هزینه‌ای برای این ماه ثبت نشده.</p>
        );
      case "recent":
        return <RecentTable onOpen={setEdit} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={pageTitle}>داشبورد</h1>
          <p className={muted}>خلاصه‌ی مالی این ماه. بخش‌ها را بکش، جمع کن یا اندازه‌شان را با لبه‌ی چپ تغییر بده.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => update(() => DEFAULT)} className={`${btnSec} h-9 px-3 text-xs`}>
            بازنشانی چیدمان
          </button>
          <MonthNav month={month} shift={shift} />
        </div>
      </div>

      <div ref={gridRef} className="grid grid-cols-12 gap-4 [grid-auto-flow:dense]">
        {cfg.map((c) => (
          <Widget
            key={c.id}
            id={c.id}
            title={META[c.id].title}
            span={c.span}
            spans={META[c.id].spans}
            collapsed={c.collapsed}
            gridRef={gridRef}
            onToggle={toggle}
            onResize={resize}
            onDragStart={setDragId}
            onDrop={drop}
          >
            {body(c.id)}
          </Widget>
        ))}
      </div>

      <TxEdit tx={edit} onClose={() => setEdit(null)} />
    </div>
  );
}
