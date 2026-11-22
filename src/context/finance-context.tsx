"use client";

import TokenDialog from "@/components/finance/token-dialog";
import { applyOp, type Data, EMPTY, jnow, type Op, addMonths } from "@/lib/finance";
import { API_URL, enqueue, fetchAll, flushSerial, kvSet, pending } from "@/lib/sync";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";

interface FinanceCtx {
  data: Data;
  month: string;
  shift: (n: number) => void;
  write: (op: Op) => void;
  accent: string;
  setAccent: (c: string) => void;
  resetToken: () => void;
}

const Ctx = createContext<FinanceCtx | null>(null);

export function useFinance(): FinanceCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useFinance باید داخل FinanceProvider استفاده شود");
  return c;
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(EMPTY);
  const [month, setMonth] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [needToken, setNeedToken] = useState(false);
  const [accent, setAccentState] = useState("#12b76a");

  // بار اول: کش محلی نشان داده می‌شود، بعد سرور جواب می‌دهد
  useEffect(() => {
    setMonth(jnow().date.slice(0, 7));
    const cached = localStorage.getItem("fin-cache");
    if (cached) setData(JSON.parse(cached));
    const a = localStorage.getItem("fin-accent");
    if (a) setAccentState(a);
    const t = localStorage.getItem("fin-token");
    if (t) {
      setToken(t);
      kvSet("token", t);
      kvSet("api", API_URL);
    } else {
      setNeedToken(true);
    }
    navigator.serviceWorker?.register("/sw.js");
  }, []);

  useEffect(() => {
    const st = document.documentElement.style;
    st.setProperty("--color-brand-500", accent);
    st.setProperty("--color-brand-600", `color-mix(in srgb, ${accent} 85%, black)`);
    st.setProperty("--color-brand-400", `color-mix(in srgb, ${accent} 80%, white)`);
    st.setProperty("--color-brand-50", `color-mix(in srgb, ${accent} 12%, white)`);
  }, [accent]);

  const sync = useCallback(async (t: string) => {
    const r = await flushSerial(t);
    if (r === "auth") {
      localStorage.removeItem("fin-token");
      setToken(null);
      setNeedToken(true);
      return;
    }
    if (r !== "ok" || (await pending()) > 0) return;
    const d = await fetchAll(t);
    if (d === "auth") {
      localStorage.removeItem("fin-token");
      setToken(null);
      setNeedToken(true);
      return;
    }
    if (typeof d === "string") return;
    setData(d);
    localStorage.setItem("fin-cache", JSON.stringify(d));
  }, []);

  useEffect(() => {
    if (!token) return;
    const run = () => sync(token);
    run();
    addEventListener("online", run);
    return () => removeEventListener("online", run);
  }, [token, sync]);

  // هر تغییر: فوری روی صفحه، بعد در صف، بعد ارسال (یا ارسال در پس‌زمینه وقتی اینترنت برگشت)
  const write = useCallback(
    (op: Op) => {
      setData((prev) => {
        const next = applyOp(prev, op);
        localStorage.setItem("fin-cache", JSON.stringify(next));
        return next;
      });
      enqueue(op).then(() => {
        navigator.serviceWorker?.ready
          .then((r) => (r as unknown as { sync?: { register(tag: string): Promise<void> } }).sync?.register("flush"))
          .catch(() => undefined);
        if (token) sync(token);
      });
    },
    [token, sync]
  );

  const saveToken = (t: string) => {
    localStorage.setItem("fin-token", t);
    kvSet("token", t);
    kvSet("api", API_URL);
    setToken(t);
    setNeedToken(false);
  };

  const resetToken = () => {
    localStorage.removeItem("fin-token");
    setToken(null);
    setNeedToken(true);
  };

  const setAccent = (c: string) => {
    localStorage.setItem("fin-accent", c);
    setAccentState(c);
  };

  const shift = (n: number) => setMonth((m) => addMonths(m, n));

  return (
    <Ctx.Provider value={{ data, month, shift, write, accent, setAccent, resetToken }}>
      {children}
      <TokenDialog open={needToken} onSave={saveToken} />
    </Ctx.Provider>
  );
}
