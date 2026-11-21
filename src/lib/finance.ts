export type TxType = "برداشت" | "واریز";

export interface Tx {
  id: string;
  date: string; // 1405.08.30
  time: string; // 13:17
  type: TxType;
  subtype: string;
  total: number;
  amount: number;
  rand: number;
  balance: number;
  account: string;
  title: string;
  source: string;
  category: string;
}

export interface Data {
  tx: Tx[];
  accounts: string[][]; // [آخر کارت، نام حساب]
  rules: string[][]; // [کلیدواژه، دسته]
  budgets: string[][]; // [دسته، سقف ماهانه]
  settings: Record<string, string>;
}

export interface NewTx {
  id: string;
  date: string;
  time: string;
  type: TxType;
  amount: number;
  account: string;
  title: string;
  category: string;
}

// همان عملیات‌هایی که Apps Script می‌فهمد
export type Op =
  | { action: "add"; t: NewTx }
  | { action: "update"; id: string; title: string; category: string }
  | { action: "delete"; id: string }
  | { action: "budget"; category: string; amount: number }
  | { action: "setting"; key: string; value: string }
  | { action: "rule"; keyword: string; category: string };

export const EMPTY: Data = { tx: [], accounts: [], rules: [], budgets: [], settings: {} };
export const DEFAULT_CATS = ["خوراک", "حمل‌ونقل", "قبض", "خرید", "سلامت", "سایر"];
export const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

const FA = "۰۱۲۳۴۵۶۷۸۹";
const AR = "٠١٢٣٤٥٦٧٨٩";

export const toFaDigits = (s: string) => s.replace(/\d/g, (d) => FA[+d]);
export const faNum = (n: number) => toFaDigits(Math.round(n).toLocaleString("en-US").replace(/,/g, "٬"));
export const toFaMoney = (n: number) => `${faNum(n)} تومان`;

export function toEnDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (d) => String(FA.indexOf(d))).replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));
}

export const parseAmount = (s: string) => +toEnDigits(s).replace(/\D/g, "") || 0;

// برای مقایسه‌ی متن: اعداد انگلیسی، «ی» و «ک» عربی، نیم‌فاصله و اعراب حذف
export function norm(s: string): string {
  return toEnDigits(s)
    .replace(/[\u200C\u200E\u200F\u064B-\u0652\u0670]/g, "")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// تاریخ و ساعت امروز به وقت تهران و تقویم شمسی
export function jnow(now = new Date()): { date: string; time: string } {
  const p: Record<string, string> = {};
  new Intl.DateTimeFormat("en-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Tehran",
  })
    .formatToParts(now)
    .forEach((x) => (p[x.type] = x.value));
  return { date: `${p.year}.${p.month}.${p.day}`, time: `${p.hour}:${p.minute}` };
}

export function addMonths(key: string, n: number): string {
  let [y, m] = key.split(".").map(Number);
  m += n;
  while (m < 1) {
    m += 12;
    y--;
  }
  while (m > 12) {
    m -= 12;
    y++;
  }
  return `${y}.${String(m).padStart(2, "0")}`;
}

export const monthOf = (date: string) => date.slice(0, 7);

export const sortKey = (t: { date: string; time: string }) =>
  `${t.date} ${(t.time || "00:00").split(":").map((x) => x.padStart(2, "0")).join(":")}`;

export const recentTx = (d: Data) => [...d.tx].sort((a, b) => (sortKey(a) < sortKey(b) ? 1 : -1));

export const inMonth = (d: Data, month: string, type?: TxType) =>
  d.tx.filter((t) => monthOf(t.date) === month && (!type || t.type === type));

export const sumOf = (l: Tx[]) => l.reduce((a, t) => a + t.total, 0);

export function byCategory(l: Tx[]): Record<string, number> {
  return l.reduce<Record<string, number>>((m, t) => {
    const c = t.category || "نامشخص";
    m[c] = (m[c] || 0) + t.total;
    return m;
  }, {});
}

// اولین قانونی که کلیدواژه‌اش داخل عنوان باشد
export function categorize(title: string, rules: string[][]): string {
  const n = norm(title);
  const r = rules.find((x) => x[0] && n.includes(norm(x[0])));
  return r ? r[1] : "";
}

export function categoriesOf(d: Data): string[] {
  return [
    ...new Set([
      ...DEFAULT_CATS,
      ...d.budgets.map((r) => r[0]),
      ...d.rules.map((r) => r[1]),
      ...d.tx.map((t) => t.category).filter(Boolean),
    ]),
  ];
}

// موجودی = موجودی اولیه + تراکنش‌هایی که بعد از ثبت آن آمده‌اند
export function balanceOf(d: Data): number | null {
  const init = d.settings.initial_balance;
  if (init === undefined || init === "") return null;
  const at = d.settings.initial_at || "";
  return d.tx.reduce(
    (b, t) => (at && sortKey(t) > at ? b + (t.type === "واریز" ? t.total : -t.total) : b),
    +init
  );
}

export function applyOp(d: Data, op: Op): Data {
  switch (op.action) {
    case "add": {
      const t = op.t;
      const tx: Tx = {
        id: t.id,
        date: t.date,
        time: t.time,
        type: t.type,
        subtype: "",
        total: t.amount,
        amount: t.amount,
        rand: 0,
        balance: 0,
        account: t.account,
        title: t.title,
        source: "manual",
        category: t.category,
      };
      return { ...d, tx: [...d.tx, tx] };
    }
    case "update":
      return { ...d, tx: d.tx.map((t) => (t.id === op.id ? { ...t, title: op.title, category: op.category } : t)) };
    case "delete":
      return { ...d, tx: d.tx.filter((t) => t.id !== op.id) };
    case "budget": {
      const has = d.budgets.some((r) => r[0] === op.category);
      const budgets = has
        ? d.budgets.map((r) => (r[0] === op.category ? [r[0], String(op.amount)] : r))
        : [...d.budgets, [op.category, String(op.amount)]];
      return { ...d, budgets };
    }
    case "setting":
      return { ...d, settings: { ...d.settings, [op.key]: op.value } };
    case "rule":
      return { ...d, rules: [...d.rules, [op.keyword, op.category]] };
  }
}
