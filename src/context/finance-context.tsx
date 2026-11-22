"use client";

import TokenDialog from "@/components/finance/token-dialog";
import { addMonths, applyOp, type Data, EMPTY, jnow, type Op, type Tx } from "@/lib/finance";
import { API_URL, enqueue, fetchAll, flushSerial, kvSet, pending } from "@/lib/sync";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";

interface FinanceCtx {
  data: Data;
  month: string;
  shift: (n: number) => void;
  write: (op: Op) => void;
  deleteTx: (t: Tx) => void;
  undoDelete: () => void;
  dismissUndo: () => void;
  lastDeleted: Tx | null;
  pendingCount: number;
  syncInfo: { at: string; error: boolean };
  refresh: () => void;
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
  const [pendingCount, setPendingCount] = useState(0);
  const [lastDeleted, setLastDeleted] = useState<Tx | null>(null);
  const [syncInfo, setSyncInfo] = useState({ at: "", error: false });

  const refreshPending = useCallback(() => {
    pending().then(setPendingCount).catch(() => undefined);
  }, []);

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
    refreshPending();
    navigator.serviceWorker?.register("/sw.js");
  }, [refreshPending]);

  useEffect(() => {
    const st = document.documentElement.style;
    st.setProperty("--color-brand-500", accent);
    st.setProperty("--color-brand-600", `color-mix(in srgb, ${accent} 85%, black)`);
    st.setProperty("--color-brand-400", `color-mix(in srgb, ${accent} 80%, white)`);
    st.setProperty("--color-brand-50", `color-mix(in srgb, ${accent} 12%, white)`);
  }, [accent]);

  const sync = useCallback(
    async (t: string) => {
      const r = await flushSerial(t);
      refreshPending();
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
      if (typeof d === "string") {
        setSyncInfo((prev) => ({ at: prev.at, error: true }));
        return;
      }
      setData(d);
      localStorage.setItem("fin-cache", JSON.stringify(d));
      setSyncInfo({ at: jnow().time, error: false });
    },
    [refreshPending]
  );

  const refresh = useCallback(() => {
    if (token) sync(token);
  }, [token, sync]);

  useEffect(() => {
    if (!token) return;
    refresh();
    addEventListener("online", refresh);
    return () => removeEventListener("online", refresh);
  }, [token, refresh]);

  // داده‌ها وقتی برنامه جلو می‌آید و هر ۶۰ ثانیه تازه می‌شوند
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const id = setInterval(onVisible, 60000);
    document.addEventListener("visibilitychange", onVisible);
    addEventListener("focus", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      removeEventListener("focus", onVisible);
    };
  }, [refresh]);

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
        refreshPending();
        if (token) sync(token);
      });
    },
    [token, sync, refreshPending]
  );

  const deleteTx = useCallback(
    (t: Tx) => {
      write({ action: "delete", id: t.id });
      // فقط تراکنش‌های دستی برگشت داده می‌شوند؛ پیامکی‌ها متن و موجودی‌شان را از دست می‌دهند
      setLastDeleted(t.source === "manual" ? t : null);
    },
    [write]
  );

  const dismissUndo = useCallback(() => setLastDeleted(null), []);

  const undoDelete = useCallback(() => {
    if (!lastDeleted) return;
    const t = lastDeleted;
    write({
      action: "add",
      t: { id: t.id, date: t.date, time: t.time, type: t.type, amount: t.total, account: t.account, title: t.title, category: t.category },
    });
    setLastDeleted(null);
  }, [lastDeleted, write]);

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
    <Ctx.Provider
      value={{ data, month, shift, write, deleteTx, undoDelete, dismissUndo, lastDeleted, pendingCount, syncInfo, refresh, accent, setAccent, resetToken }}
    >
      {children}
      <TokenDialog open={needToken} onSave={saveToken} />
    </Ctx.Provider>
  );
}
