import type { Data, Op } from "./finance";

// همه‌ی درخواست‌ها از Worker خودمان می‌روند؛ Worker با Google Sheets حرف می‌زند
export const API_URL = "/api";

const DB_NAME = "fin";
let dbp: Promise<IDBDatabase> | null = null;

// نسخه‌ی ۲ هر دو فروشگاه را دارد؛ sw.js هم همین نسخه را باز می‌کند
function db(): Promise<IDBDatabase> {
  return (dbp ??= new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 2);
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains("q")) r.result.createObjectStore("q", { keyPath: "id" });
      if (!r.result.objectStoreNames.contains("kv")) r.result.createObjectStore("kv", { keyPath: "key" });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
}

async function store<T>(name: "q" | "kv", mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const t = (await db()).transaction(name, mode);
  const req = fn(t.objectStore(name));
  return new Promise((res, rej) => {
    t.oncomplete = () => res(req.result);
    t.onerror = () => rej(t.error);
  });
}

interface QueueItem {
  id: string;
  body: Op;
}

// شناسه با زمان شروع می‌شود تا صف به ترتیب ثبت ارسال شود
let seq = 0;
export const enqueue = (body: Op) =>
  store("q", "readwrite", (s) => s.put({ id: `${String(Date.now()).padStart(15, "0")}-${String(++seq).padStart(6, "0")}`, body }));
const queued = () => store<QueueItem[]>("q", "readonly", (s) => s.getAll());
const dequeue = (id: string) => store("q", "readwrite", (s) => s.delete(id));
export const pending = async () => (await queued()).length;

export const kvSet = (key: string, value: string) => store("kv", "readwrite", (s) => s.put({ key, value }));

// ارسال‌ها پشت سر هم انجام شوند تا یک عملیات دو بار فرستاده نشود
let chain: Promise<unknown> = Promise.resolve();
export function flushSerial(token: string): Promise<"ok" | "auth" | "offline"> {
  const p = chain.then(() => flush(token)) as Promise<"ok" | "auth" | "offline">;
  chain = p.catch(() => undefined);
  return p;
}

async function flush(token: string): Promise<"ok" | "auth" | "offline"> {
  for (const it of await queued()) {
    let j: { ok?: boolean } = {};
    try {
      const r = await fetch(`${API_URL}?token=${encodeURIComponent(token)}&app=1`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(it.body),
      });
      if (r.status >= 500) return "offline";
      j = await r.json();
    } catch {
      return "offline";
    }
    if (!j.ok) return "auth";
    await dequeue(it.id);
  }
  return "ok";
}

export async function fetchAll(token: string): Promise<Data | "auth" | "offline"> {
  try {
    const r = await fetch(`${API_URL}?token=${encodeURIComponent(token)}`);
    if (r.status >= 500) return "offline";
    const j = await r.json();
    if (!j.ok) return "auth";
    return { tx: j.tx, accounts: j.accounts, rules: j.rules, budgets: j.budgets, settings: j.settings };
  } catch {
    return "offline";
  }
}
