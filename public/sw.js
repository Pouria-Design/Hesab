const V = "hb-v4";
const SHELL = ["/", "/manifest.json", "/icon.svg"];
const API_DB = "fin";

self.addEventListener("install", (e) => e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL))));
self.addEventListener("activate", (e) =>
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k))))));

self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        caches.open(V).then((c) => c.put(e.request, r.clone()));
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || (e.request.mode === "navigate" ? caches.match("/") : undefined)))
  );
});

// ارسال صف در پس‌زمینه: توکن و آدرس API را صفحه داخل IndexedDB گذاشته
self.addEventListener("sync", (e) => {
  if (e.tag === "flush") e.waitUntil(flushQueue());
});

function openDb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(API_DB, 2);
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
    const r = await fetch(`${api}?token=${encodeURIComponent(token)}&app=1`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(it.body),
    });
    const j = await r.json();
    if (!j.ok) return;
    await req(db.transaction("q", "readwrite").objectStore("q").delete(it.id));
  }
}
