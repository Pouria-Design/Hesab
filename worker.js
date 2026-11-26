import { isBank, jnow, parseSms } from "./sms-parse.js";

// APP_TOKEN برای برنامه و پیامک؛ DB همان دیتابیس D1 است
const H = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: H });

async function sha256Hex(text) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// پیامک بانک: ثبت تراکنش، یا اگر خوانده نشد، صف بررسی
async function storeSms(env, raw) {
  if (!isBank(raw)) return { ignored: true };
  const id = await sha256Hex(raw);
  const p = parseSms(raw);
  const now = jnow();
  if (!p) {
    await env.DB.prepare("INSERT OR IGNORE INTO review (id, raw, received) VALUES (?, ?, ?)")
      .bind(id, raw, `${now.date} ${now.time}`)
      .run();
    return { parsed: false };
  }
  const date = p.date || now.date;
  const time = p.time || now.time;
  await env.DB.prepare(
    `INSERT OR IGNORE INTO tx (id, date, time, type, subtype, total, amount, rand, balance, account, title, source, category, raw, sort_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', 'sms', '', ?, ?)`
  )
    .bind(id, date, time, p.type, p.subtype, p.total, p.amount, p.rand, p.balance, raw, `${date} ${time}`)
    .run();
  return { parsed: true };
}

async function loadAll(env) {
  const db = env.DB;
  const [tx, acc, rules, budgets, settings] = await db.batch([
    db.prepare("SELECT id, date, time, type, subtype, total, amount, rand, balance, account, title, source, category FROM tx ORDER BY sort_at"),
    db.prepare("SELECT last4, name FROM accounts ORDER BY last4"),
    db.prepare("SELECT keyword, category FROM rules ORDER BY id"),
    db.prepare("SELECT category, amount FROM budgets"),
    db.prepare("SELECT key, value FROM settings"),
  ]);
  // موجودی حساب = موجودی داخل آخرین پیامک بانک (بدون توجه به مبلغ تراکنش‌ها)
  const lb = await db
    .prepare("SELECT balance, sort_at FROM tx WHERE source = 'sms' AND balance IS NOT NULL ORDER BY sort_at DESC, rowid DESC LIMIT 1")
    .first();
  return {
    tx: tx.results.map((r) => ({
      id: r.id, date: r.date, time: r.time, type: r.type, subtype: r.subtype || "",
      total: r.total || 0, amount: r.amount || 0, rand: r.rand || 0, balance: r.balance || 0,
      account: r.account || "", title: r.title || "", source: r.source, category: r.category || "",
    })),
    accounts: acc.results.map((r) => [String(r.last4), String(r.name)]),
    rules: rules.results.map((r) => [r.keyword, r.category]),
    budgets: budgets.results.map((r) => [r.category, String(r.amount)]),
    settings: Object.fromEntries(settings.results.map((r) => [r.key, String(r.value)])),
    balance: lb ? { value: lb.balance, at: lb.sort_at } : null,
  };
}

async function apply(env, b) {
  const db = env.DB;
  switch (b.action) {
    case "add":
      await db
        .prepare(
          `INSERT OR IGNORE INTO tx (id, date, time, type, subtype, total, amount, rand, balance, account, title, source, category, raw, sort_at)
           VALUES (?, ?, ?, ?, '', ?, ?, 0, NULL, ?, ?, 'manual', ?, '', ?)`
        )
        .bind(b.t.id, b.t.date, b.t.time, b.t.type, b.t.amount, b.t.amount, b.t.account, b.t.title, b.t.category, `${b.t.date} ${b.t.time}`)
        .run();
      return;
    case "update":
      await db.prepare("UPDATE tx SET title = ?, category = ? WHERE id = ?").bind(b.title, b.category, b.id).run();
      return;
    case "delete":
      await db.prepare("DELETE FROM tx WHERE id = ?").bind(b.id).run();
      return;
    case "budget":
      await db
        .prepare("INSERT INTO budgets (category, amount) VALUES (?, ?) ON CONFLICT(category) DO UPDATE SET amount = excluded.amount")
        .bind(b.category, b.amount)
        .run();
      return;
    case "setting":
      await db
        .prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
        .bind(b.key, String(b.value))
        .run();
      return;
    case "rule":
      await db.prepare("INSERT INTO rules (keyword, category) VALUES (?, ?)").bind(b.keyword, b.category).run();
      return;
    default:
      throw new Error("unknown action");
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api" && url.pathname !== "/sms") return env.ASSETS.fetch(request);
    if (!env.APP_TOKEN || url.searchParams.get("token") !== env.APP_TOKEN) return json({ ok: false, error: "auth" }, 401);

    try {
      if (url.pathname === "/sms") {
        if (request.method !== "POST") return json({ ok: false }, 405);
        return json({ ok: true, ...(await storeSms(env, await request.text())) });
      }
      if (request.method === "GET") return json({ ok: true, ...(await loadAll(env)) });
      if (request.method === "POST") {
        await apply(env, JSON.parse(await request.text()));
        return json({ ok: true });
      }
      return json({ ok: false }, 405);
    } catch (err) {
      return json({ ok: false, error: String(err && err.message ? err.message : err) }, 503);
    }
  },
};
