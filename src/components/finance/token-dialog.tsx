"use client";

import { useState } from "react";
import { Modal, btnPri, input, muted } from "./ui";

export default function TokenDialog({ open, onSave }: { open: boolean; onSave: (t: string) => void }) {
  const [v, setV] = useState("");
  return (
    <Modal open={open} onClose={() => undefined} dismissable={false}>
      <div className="grid gap-4">
        <h2 className="text-base font-medium">توکن دسترسی</h2>
        <p className={muted}>همان مقدار TOKEN در Apps Script را وارد کن. فقط یک بار لازم است.</p>
        <input className={input} dir="ltr" value={v} onChange={(e) => setV(e.target.value)} />
        <button type="button" className={btnPri} onClick={() => v.trim() && onSave(v.trim())}>
          ذخیره
        </button>
      </div>
    </Modal>
  );
}
