"use client";

import { useFinance } from "@/context/finance-context";
import { useTheme } from "@/context/theme-context";
import { addMonths, balanceOf, byCategory, faNum, inMonth, MONTHS, recentTx, sumOf, toFaMoney, type Tx } from "@/lib/finance";
import type { ApexOptions } from "apexcharts";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import TxRow from "./tx-row";
import { TxEdit } from "./tx-dialogs";
import { card, MonthNav, muted, pageTitle } from "./ui";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const COLORS = ["#465fff", "#12b76a", "#f79009", "#f04438", "#7a5af8", "#06aed4", "#ee46bc", "#667085"];

export default function DashboardView() {
  const { data, month, shift } = useFinance();
  const { theme } = useTheme();
  const [edit, setEdit] = useState<Tx | null>(null);

  if (!month) return null;

  const dark = theme === "dark";
  const bal = balanceOf(data);
  const lastBank = recentTx(data).find((t) => t.balance > 0);
  const expenses = inMonth(data, month, "برداشت");
  const exp = sumOf(expenses);
  const inc = sumOf(inMonth(data, month, "واریز"));
  const spent = byCategory(expenses);
  const keys = [-5, -4, -3, -2, -1, 0].map((n) => addMonths(month, n));
  const text = dark ? "#98a2b3" : "#667085";
  const grid = dark ? "#262c36" : "#e4e7ec";

  const bar: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, background: "transparent", fontFamily: "inherit" },
    colors: ["#f04438", "#12b76a"],
    plotOptions: { bar: { borderRadius: 6, columnWidth: "45%" } },
    dataLabels: { enabled: false },
    xaxis: { categories: keys.map((k) => MONTHS[+k.slice(5) - 1]), labels: { style: { colors: text } } },
    yaxis: { labels: { style: { colors: text }, formatter: (v: number) => faNum(v) } },
    grid: { borderColor: grid },
    legend: { position: "bottom", labels: { colors: text } },
    theme: { mode: dark ? "dark" : "light" },
  };

  const donut: ApexOptions = {
    chart: { type: "donut", background: "transparent", fontFamily: "inherit" },
    labels: Object.keys(spent),
    colors: COLORS,
    dataLabels: { enabled: false },
    legend: { position: "bottom", labels: { colors: text } },
    stroke: { colors: [dark ? "#171b22" : "#ffffff"] },
    theme: { mode: dark ? "dark" : "light" },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={pageTitle}>داشبورد</h1>
        <MonthNav month={month} shift={shift} />
      </div>

      <div className={card}>
        <div className={muted}>موجودی حساب</div>
        <div className="mt-1 text-3xl font-semibold text-gray-800 dark:text-white/90">
          {bal === null ? "تنظیم نشده" : toFaMoney(bal)}
        </div>
        <div className={`${muted} mt-1`}>
          {bal === null
            ? "از تنظیمات موجودی اولیه را وارد کن."
            : lastBank
              ? `آخرین موجودی بانک: ${toFaMoney(lastBank.balance)}`
              : ""}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={card}>
          <div className={muted}>هزینه این ماه</div>
          <div className="mt-1 text-xl font-semibold text-red-500">{toFaMoney(exp)}</div>
        </div>
        <div className={card}>
          <div className={muted}>درآمد این ماه</div>
          <div className="mt-1 text-xl font-semibold text-green-600 dark:text-green-400">{toFaMoney(inc)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className={`${card} lg:col-span-3`}>
          <h2 className="mb-3 text-base font-medium">۶ ماه اخیر</h2>
          <Chart
            type="bar"
            height={260}
            options={bar}
            series={[
              { name: "هزینه", data: keys.map((k) => sumOf(inMonth(data, k, "برداشت"))) },
              { name: "درآمد", data: keys.map((k) => sumOf(inMonth(data, k, "واریز"))) },
            ]}
          />
        </div>
        <div className={`${card} lg:col-span-2`}>
          <h2 className="mb-3 text-base font-medium">هزینه به تفکیک دسته</h2>
          {Object.keys(spent).length ? (
            <Chart type="donut" height={260} options={donut} series={Object.values(spent)} />
          ) : (
            <p className={muted}>هزینه‌ای برای این ماه ثبت نشده.</p>
          )}
        </div>
      </div>

      <div className={card}>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-medium">تراکنش‌های اخیر</h2>
          <Link href="/transactions" className="text-sm text-brand-500">
            همه
          </Link>
        </div>
        {recentTx(data).slice(0, 8).map((t) => (
          <TxRow key={t.id} t={t} onClick={() => setEdit(t)} />
        ))}
        {!data.tx.length && <p className={muted}>هنوز تراکنشی ثبت نشده.</p>}
      </div>

      <TxEdit tx={edit} onClose={() => setEdit(null)} />
    </div>
  );
}
