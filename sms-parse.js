// پارسر پیامک بانک بلو: خط‌به‌خط و با کلمات کلیدی (مثل نسخه‌ی Apps Script)
export const norm = (s) =>
  s
    .replace(/[\u200C\u200E\u200F\u064B-\u0652\u0670]/g, "")
    .replace(/[\u00A0\t]/g, " ")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

export const isBank = (raw) => norm(raw).split(/\r?\n/).some((l) => /^بلو(\s|$)/.test(l.trim()));

const money = /([\d,٬]+)\s*ریال/;
const toToman = (s) => Math.round(+s.replace(/[,٬]/g, "") / 10);

// مبلغ‌ها به تومان؛ موجودی null می‌شود اگر در پیامک نباشد
export function parseSms(raw) {
  if (!isBank(raw)) return null;
  const lines = norm(raw)
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const text = lines.join("\n");
  const main = lines.find((l) => money.test(l) && !/رند|موجودی/.test(l));
  if (!main) return null;
  const isOut = /برداشت|پرید|کسر/.test(main);
  const isIn = /واریز|دریافت|نشست|به حساب/.test(main);
  if (isOut === isIn) return null;
  const rnd = lines.find((l) => /رند/.test(l) && money.test(l));
  const bal = lines.find((l) => /موجودی/.test(l) && money.test(l));
  const sub = lines.find((l) => /^دریافت/.test(l));
  const date = text.match(/(\d{4})[./-](\d{2})[./-](\d{2})/);
  const time = text.match(/(\d{1,2}):(\d{2})/);
  const amount = toToman(main.match(money)[1]);
  const rand = rnd ? toToman(rnd.match(money)[1]) : 0;
  return {
    date: date ? `${date[1]}.${date[2]}.${date[3]}` : "",
    time: time ? `${time[1].padStart(2, "0")}:${time[2]}` : "",
    type: isOut ? "برداشت" : "واریز",
    subtype: isIn && sub ? sub.replace(/^دریافت/, "").trim() : "",
    amount,
    rand,
    total: isOut ? amount + rand : amount,
    balance: bal ? toToman(bal.match(money)[1]) : null,
  };
}

// تاریخ و ساعت امروز به وقت تهران و تقویم شمسی
export function jnow(now = new Date()) {
  const p = {};
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
