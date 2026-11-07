const test = require("node:test");
const assert = require("node:assert/strict");
const { buildIncomeData } = require("../controllers/incomeController");

test("income uses completion date, current tax year and platform earnings", () => {
  const data = buildIncomeData([
    { status: "completed", amount: 120000, platformFee: 12000, taxAmount: 0,
      bookingId: { status: "completed", completedAt: "2026-10-01" } },
    { status: "completed", amount: 1000, platformFee: 100, taxAmount: 135,
      bookingId: { status: "completed", completedAt: "2026-02-28" } },
    { status: "pending", amount: 5000, platformFee: 500,
      bookingId: { status: "pending", completedAt: "2026-10-02" } }
  ], new Date("2026-11-07"));
  assert.equal(data.period.taxYear, 2027);
  assert.deepEqual(data.summary, {
    gross: 120000, fees: 12000, taxable: 108000, tax: 1620, net: 106380, recordedTax: 0
  });
  assert.equal(data.monthlyIncome[7].amount, 108000);
  assert.equal(data.monthlyIncome.length, 12);
});
