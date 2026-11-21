"use client";

import { useFinance } from "@/context/finance-context";
import { categorize, categoriesOf, jnow, parseAmount, toFaDigits, toFaMoney, type Tx, type TxType } from "@/lib/finance";
import { useState } from "react";
import { Modal, btnPri, btnSec, input, label, muted } from "./ui";

export function TxEdit({ tx, onClose }: { tx: Tx | null; onClose: () => void }) {
  return (
    <Modal open={!!tx} onClose={onClose}>
      {tx && <TxEditForm key={tx.id} tx={tx} onClose={onClose} />}
    </Modal>
  );
}

function TxEditForm({ tx, onClose }: { tx: Tx; onClose: () => void }) {
  const { data, write } = useFinance();
  const [title, setTitle] = useState(tx.title);
  const [cat, setCat] = useState(tx.category);

  const save = () => {
    // اگر دسته را دستی عوض نکرده‌ای، از روی عنوان خودکار پیدا می‌شود
    const category = cat !== (tx.category || "") ? cat : categorize(title, data.rules) || cat;
    write({ action: "update", id: tx.id, title: title.trim(), category });
    onClose();
  };

  const remove = () => {
    if (!confirm("این تراکنش حذف شود؟")) return;
    write({ action: "delete", id: tx.id });
    onClose();
  };

  return (
    <div className="grid gap-4">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {toFaDigits(tx.date)} · {toFaDigits(tx.time)} · {toFaMoney(tx.total)} · {tx.account || "حساب نامشخص"}
      </div>
      {tx.subtype && <div className={muted}>{tx.subtype}</div>}
      <div>
        <label className={label}>عنوان: این مبلغ برای چه بود؟</label>
        <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className={label}>دسته</label>
        <input
          className={input}
          list="cats"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          placeholder="خالی بگذار تا خودکار پیدا شود"
        />
        <datalist id="cats">
          {categoriesOf(data).map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={remove} className={`${btnSec} text-red-500`}>
          حذف
        </button>
        <button type="button" onClick={save} className={btnPri}>
          ذخیره
        </button>
      </div>
    </div>
  );
}

export function TxAdd({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, write } = useFinance();
  const [type, setType] = useState<TxType>("برداشت");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState("");
  const [account, setAccount] = useState("");

  const save = () => {
    const n = parseAmount(amount);
    if (!n) return;
    const now = jnow();
    write({
      action: "add",
      t: {
        id: crypto.randomUUID(),
        date: now.date,
        time: now.time,
        type,
        amount: n,
        account: account || "نامشخص",
        title: title.trim(),
        category: cat.trim() || categorize(title, data.rules),
      },
    });
    setAmount("");
    setTitle("");
    setCat("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="grid gap-4">
        <h2 className="text-base font-medium">افزودن تراکنش</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>نوع</label>
            <select className={input} value={type} onChange={(e) => setType(e.target.value as TxType)}>
              <option>برداشت</option>
              <option>واریز</option>
            </select>
          </div>
          <div>
            <label className={label}>مبلغ (تومان)</label>
            <input className={input} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>
        <div>
          <label className={label}>عنوان</label>
          <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>دسته</label>
            <input
              className={input}
              list="cats"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              placeholder="خودکار"
            />
          </div>
          <div>
            <label className={label}>حساب</label>
            <select className={input} value={account} onChange={(e) => setAccount(e.target.value)}>
              <option value="">نامشخص</option>
              {data.accounts.map((a) => (
                <option key={a[0]} value={a[1]}>
                  {a[1]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <datalist id="cats">
          {categoriesOf(data).map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className={btnSec}>
            انصراف
          </button>
          <button type="button" onClick={save} className={btnPri}>
            ثبت
          </button>
        </div>
      </div>
    </Modal>
  );
}
