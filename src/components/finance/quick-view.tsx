"use client";

import { useRouter } from "next/navigation";
import { TxAdd } from "./tx-dialogs";
import { muted, pageTitle } from "./ui";

export default function QuickView() {
  const router = useRouter();
  return (
    <div className="space-y-2">
      <h1 className={pageTitle}>ثبت سریع</h1>
      <p className={muted}>تراکنش را وارد کن. بعد از ثبت به داشبورد برمی‌گردی.</p>
      <TxAdd open onClose={() => router.push("/")} />
    </div>
  );
}
