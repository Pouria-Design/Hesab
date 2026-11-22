const V = "hb-v6";
const SHELL = ["/", "/manifest.json", "/icon.svg"];
const DB = "fin";

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function withTimeout(p, ms) {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error("timeout")), ms);
    p.then(
      (v) => { clearTimeout(t); res(v); },
      (err) => { clearTimeout(t); rej(err); }
    );
  });
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const u = new URL(req.url);
  if (req.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/api")) return;

  // پاسخ را قبل از برگرداندن کپی می‌کنیم؛ بعد از مصرف بدنه، کپی ممکن نیست
  const put = (r) => {
    if (r.ok) {
      const copy = r.clone();
      caches.open(V).then((c) => c.put(req, copy));
    }
    return r;
  };

  if (req.mode === "navigate") {
    e.respondWith(
      withTimeout(fetch(req).then(put), 3000).catch(() =>
        caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("/"))
      )
    );
    return;
  }

  // فایل‌های نسخه‌دار Next و آیکون‌ها: از کش، و اگر نبود از شبکه
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then(put)));
});

// ارسال صف در پس‌زمینه
self.addEventListener("sync", (e) => {
  if (e.tag === "flush") e.waitUntil(flushQueue());
});

function openDb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 2);
    r.onupgradeneeded = () => {
      const d = r.result;
      if (!d.objectStoreNames.contains("q")) d.createObjectStore("q", { keyPath: "id" });
      if (!d.objectStoreNames.contains("kv")) d.createObjectStore("kv", { keyPath: "key" });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
const req = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

async function flushQueue() {
  const db = await openDb();
  const token = (await req(db.transaction("kv").objectStore("kv").get("token")))?.value;
  const api = (await req(db.transaction("kv").objectStore("kv").get("api")))?.value;
  if (!token || !api) return;
  const items = await req(db.transaction("q").objectStore("q").getAll());
  for (const it of items) {
    const url = new URL(api, self.location.origin);
    url.searchParams.set("token", token);
    url.searchParams.set("app", "1");
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(it.body) });
    const j = await r.json();
    if (!j.ok) return;
    await req(db.transaction("q", "readwrite").objectStore("q").delete(it.id));
  }
}
