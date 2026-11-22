"use client";

import { btnPri, card, input, label, muted } from "@/components/finance/ui";
import { AUTH_HASH, AUTH_USER, sha256Hex } from "@/lib/auth";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";

const KEY = "hb-auth";

export function logout() {
  localStorage.removeItem(KEY);
  location.reload();
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    setAuthed(localStorage.getItem(KEY) === "1");
    setReady(true);
  }, []);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const hash = await sha256Hex(pass);
    if (user.trim() === AUTH_USER && hash === AUTH_HASH) {
      localStorage.setItem(KEY, "1");
      setAuthed(true);
    } else {
      setErr("نام کاربری یا رمز اشتباه است");
    }
  };

  if (!ready) return null;
  if (authed) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
      <form onSubmit={submit} className={`${card} w-full max-w-sm space-y-4`}>
        <div className="text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-brand-500 text-xl font-bold text-white">H</div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Hashem-Budget</h1>
          <p className={muted}>برای ورود، نام کاربری و رمز را وارد کن</p>
        </div>
        <div>
          <label className={label}>نام کاربری</label>
          <input className={input} dir="ltr" autoComplete="username" value={user} onChange={(e) => setUser(e.target.value)} />
        </div>
        <div>
          <label className={label}>رمز</label>
          <input className={input} dir="ltr" type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} />
        </div>
        {err && <p className="text-sm text-red-500">{err}</p>}
        <button type="submit" className={`${btnPri} w-full`}>ورود</button>
      </form>
    </div>
  );
}
