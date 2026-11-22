import assert from "node:assert/strict";
import { EMPTY, addMonths, applyOp, balanceOf, budgetAlerts, categorize, findDuplicates, forecastSpend, parseAmount, yearSummary, type Data, type Tx } from "./finance";

const mk = (o: Partial<Tx>): Tx => ({
  id: "", date: "1405.08.10", time: "10:00", type: "برداشت", subtype: "", total: 100, amount: 100,
  rand: 0, balance: 0, account: "", title: "", source: "sms", category: "", ...o,
});

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

const dupe = findDuplicates([mk({ id: "x", time: "10:00", total: 500 }), mk({ id: "y", time: "10:03", total: 500 }), mk({ id: "z", time: "10:03", total: 900 })]);
assert.ok(dupe.has("x") && dupe.has("y") && !dupe.has("z"));

const d2: Data = { ...EMPTY, tx: [mk({ total: 3000 })] };
assert.equal(forecastSpend(d2, "1405.08", "1405.08.10"), 9000);
assert.equal(forecastSpend(d2, "1405.08", "1405.09.01"), null);

const d3: Data = { ...EMPTY, budgets: [["خوراک", "1000"]], tx: [mk({ category: "خوراک", total: 850 })] };
assert.equal(budgetAlerts(d3, "1405.08").length, 1);
assert.equal(yearSummary(d3, "1405.08").length, 12);

console.log("finance tests passed");
