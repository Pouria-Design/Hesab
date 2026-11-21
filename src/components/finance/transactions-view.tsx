"use client";

import { useFinance } from "@/context/finance-context";
import { norm, recentTx, type Tx } from "@/lib/finance";
import { PlusIcon } from "@/icons";
import { useState } from "react";
import TxRow from "./tx-row";
import { TxAdd, TxEdit } from "./tx-dialogs";
import { btnPri, card, input, muted, pageTitle } from "./ui";

export default function TransactionsView() {
  const { data } = useFinance();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Tx | null>(null);
  const [adding, setAdding] = useState(false);

  const needle = norm(q);
  const list = recentTx(data).filter(
    (t) => !needle || norm(t.title).includes(needle) || norm(t.category).includes(needle)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={pageTitle}>تراکنش‌ها</h1>
        <button type="button" onClick={() => setAdding(true)} className={btnPri}>
          <PlusIcon className="size-5" />
          افزودن
        </button>
      </div>

      <input className={input} placeholder="جستجو در عنوان یا دسته" value={q} onChange={(e) => setQ(e.target.value)} />

      <div className={card}>
        {list.map((t) => (
          <TxRow key={t.id} t={t} onClick={() => setEdit(t)} />
        ))}
        {!list.length && <p className={muted}>تراکنشی پیدا نشد.</p>}
      </div>

      <TxEdit tx={edit} onClose={() => setEdit(null)} />
      <TxAdd open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}
