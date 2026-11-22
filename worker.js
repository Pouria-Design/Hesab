// shortcut: کلیدهای ورود و شناسه‌ی شیت در Secrets/Variables کلودفلر است، نه اینجا
let tokenCache = null;
let metaCache = null;
const enc = encodeURIComponent;
const API = "https://sheets.googleapis.com/v4/spreadsheets";

const b64url = (buf) => {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
};
const strB64url = (str) => b64url(new TextEncoder().encode(str));

async function accessToken(env) {
  if (tokenCache && tokenCache.exp > Date.now() + 60000) return tokenCache.token;
  const now = Math.floor(Date.now() / 1000);
  const header = strB64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = strB64url(
    JSON.stringify({
      iss: env.SA_EMAIL,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const pem = env.SA_KEY.replace(/\\n/g, "\n");
  const der = Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "")), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claims}`));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${header}.${claims}.${b64url(sig)}` }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error("token: " + (j.error_description || j.error || r.status));
  tokenCache = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return tokenCache.token;
}

async function gs(env, path, init = {}) {
  const t = await accessToken(env);
  const r = await fetch(`${API}/${env.SHEET_ID}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
  });
  if (!r.ok) throw new Error(`sheets ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

async function sheetInfo(env) {
  if (!metaCache) {
    const j = await gs(env, "?fields=sheets(properties(sheetId,title,index))");
    metaCache = j.sheets.map((s) => s.properties).sort((a, b) => a.index - b.index);
  }
  return metaCache;
}

const byName = (list, name) => {
  const f = list.find((p) => p.title === name);
  if (!f) throw new Error(`sheet not found: ${name}`);
  return f;
};

async function colA(env, title) {
  const j = await gs(env, `/values/${enc(`'${title}'!A:A`)}?valueRenderOption=UNFORMATTED_VALUE`);
  return (j.values || []).map((r) => r[0] ?? "");
}

async function rowOf(env, title, id) {
  const ids = await colA(env, title);
  const i = ids.findIndex((v) => String(v) === String(id));
  return i > 0 ? i + 1 : 0;
}

async function upsert(env, title, key, vals) {
  const keys = await colA(env, title);
  const i = keys.findIndex((v) => String(v) === String(key));
  if (i > 0) {
    await gs(env, `/values/${enc(`'${title}'!A${i + 1}:B${i + 1}`)}?valueInputOption=RAW`, {
      method: "PUT",
      body: JSON.stringify({ values: [vals] }),
    });
  } else {
    await gs(env, `/values/${enc(`'${title}'!A:B`)}:append?valueInputOption=RAW`, {
      method: "POST",
      body: JSON.stringify({ values: [vals] }),
    });
  }
}

async function loadAll(env) {
  const p = await sheetInfo(env);
  const names = [p[0].title, p[1].title, byName(p, "قوانین").title, byName(p, "بودجه").title, byName(p, "تنظیمات").title];
  const q = new URLSearchParams({ valueRenderOption: "UNFORMATTED_VALUE" });
  q.append("ranges", `'${names[0]}'!A2:N`);
  q.append("ranges", `'${names[1]}'!A2:B`);
  q.append("ranges", `'${names[2]}'!A2:B`);
  q.append("ranges", `'${names[3]}'!A2:B`);
  q.append("ranges", `'${names[4]}'!A2:B`);
  const j = await gs(env, `/values:batchGet?${q}`);
  const [t, a, ru, bu, se] = j.valueRanges.map((x) => x.values || []);
  const s = (v) => (v == null ? "" : String(v));
  const rows = (v) => v.filter((r) => s(r[0]) !== "").map((r) => r.map(s));
  return {
    tx: t
      .filter((r) => s(r[0]) !== "")
      .map((r) => ({
        id: s(r[0]), date: s(r[1]), time: s(r[2]), type: s(r[3]), subtype: s(r[4]),
        total: +r[5] || 0, amount: +r[6] || 0, rand: +r[7] || 0, balance: +r[8] || 0,
        account: s(r[9]), title: s(r[10]), source: s(r[11]), category: s(r[13]),
      })),
    accounts: rows(a),
    rules: rows(ru),
    budgets: rows(bu),
    settings: Object.fromEntries(rows(se)),
  };
}

async function apply(env, b) {
  const p = await sheetInfo(env);
  const tx = p[0].title;
  const bud = byName(p, "بودجه").title;
  const set = byName(p, "تنظیمات").title;
  const rul = byName(p, "قوانین").title;

  if (b.action === "add") {
    const ids = await colA(env, tx);
    if (ids.some((v) => String(v) === String(b.t.id))) return;
    const t = b.t;
    await gs(env, `/values/${enc(`'${tx}'!A:N`)}:append?valueInputOption=RAW`, {
      method: "POST",
      body: JSON.stringify({ values: [[t.id, t.date, t.time, t.type, "", t.amount, t.amount, 0, "", t.account, t.title, "manual", "", t.category]] }),
    });
  } else if (b.action === "update") {
    const row = await rowOf(env, tx, b.id);
    if (!row) return;
    await gs(env, "/values:batchUpdate", {
      method: "POST",
      body: JSON.stringify({
        valueInputOption: "RAW",
        data: [
          { range: `'${tx}'!K${row}`, values: [[b.title]] },
          { range: `'${tx}'!N${row}`, values: [[b.category]] },
        ],
      }),
    });
  } else if (b.action === "delete") {
    const row = await rowOf(env, tx, b.id);
    if (!row) return;
    await gs(env, ":batchUpdate", {
      method: "POST",
      body: JSON.stringify({
        requests: [{ deleteDimension: { range: { sheetId: p[0].sheetId, dimension: "ROWS", startIndex: row - 1, endIndex: row } } }],
      }),
    });
  } else if (b.action === "budget") {
    await upsert(env, bud, b.category, [b.category, b.amount]);
  } else if (b.action === "setting") {
    await upsert(env, set, b.key, [b.key, b.value]);
  } else if (b.action === "rule") {
    await gs(env, `/values/${enc(`'${rul}'!A:B`)}:append?valueInputOption=RAW`, {
      method: "POST",
      body: JSON.stringify({ values: [[b.keyword, b.category]] }),
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api") return env.ASSETS.fetch(request);

    const json = (o, status = 200) =>
      new Response(JSON.stringify(o), {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
      });

    if (!env.APP_TOKEN || url.searchParams.get("token") !== env.APP_TOKEN) return json({ ok: false, error: "auth" }, 401);

    try {
      if (request.method === "GET") return json({ ok: true, ...(await loadAll(env)) });
      if (request.method === "POST") {
        await apply(env, JSON.parse(await request.text()));
        return json({ ok: true });
      }
      return json({ ok: false, error: "method" }, 405);
    } catch (err) {
      // ۵۰۳ یعنی خطای موقت؛ برنامه این را «آفلاین» می‌بیند و توکن را پاک نمی‌کند
      return json({ ok: false, error: String(err && err.message ? err.message : err) }, 503);
    }
  },
};
