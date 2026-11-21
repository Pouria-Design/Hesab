import assert from "node:assert/strict";
import { EMPTY, addMonths, applyOp, balanceOf, categorize, parseAmount, type Data } from "./finance";

assert.equal(addMonths("1405.01", -1), "1404.12");
assert.equal(addMonths("1405.12", 1), "1406.01");
assert.equal(parseAmount("۱٬۲۳۴٬۰۰۰ تومان"), 1234000);
assert.equal(categorize("خرید از سوپر مارکت", [["سوپر", "خوراک"]]), "خوراک");
assert.equal(categorize("نامشخص", [["سوپر", "خوراک"]]), "");

let d: Data = applyOp(EMPTY, { action: "setting", key: "initial_balance", value: "1000" });
d = applyOp(d, { action: "setting", key: "initial_at", value: "1405.08.30 10:00" });
const base = { account: "x", title: "", category: "" };
d = applyOp(d, { action: "add", t: { ...base, id: "a", date: "1405.08.30", time: "11:00", type: "برداشت", amount: 300 } });
d = applyOp(d, { action: "add", t: { ...base, id: "b", date: "1405.08.30", time: "09:00", type: "واریز", amount: 50 } });
assert.equal(balanceOf(d), 700, "تراکنش قبل از موجودی اولیه نباید حساب شود");

d = applyOp(d, { action: "update", id: "a", title: "نان", category: "خوراک" });
assert.equal(d.tx.find((t) => t.id === "a")?.title, "نان");
d = applyOp(d, { action: "delete", id: "a" });
assert.equal(d.tx.length, 1);

d = applyOp(d, { action: "budget", category: "خوراک", amount: 500 });
d = applyOp(d, { action: "budget", category: "خوراک", amount: 600 });
assert.deepEqual(d.budgets, [["خوراک", "600"]]);

console.log("finance tests passed");
