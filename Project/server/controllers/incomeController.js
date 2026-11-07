const Transaction = require("../models/Transaction");
const { estimateTax, roundMoney, PRIMARY_REBATE } = require("../services/taxEstimate");

function buildIncomeData(transactions, now = new Date()) {
  const taxYear = now.getUTCMonth() >= 2 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
  const start = new Date(Date.UTC(taxYear - 1, 2, 1));
  const end = new Date(Date.UTC(taxYear, 2, 1));
  const monthlyIncome = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(taxYear - 1, index + 2, 1));
    return {
      month: date.toLocaleDateString("en-ZA", { month: "short", year: "numeric", timeZone: "UTC" }),
      amount: 0
    };
  });

  let gross = 0;
  let fees = 0;
  let recordedTax = 0;
  for (const tx of transactions) {
    if (tx.status !== "completed" || tx.bookingId?.status !== "completed") continue;
    const completedAt = new Date(tx.bookingId.completedAt || tx.createdAt);
    if (Number.isNaN(completedAt.getTime()) || completedAt < start || completedAt >= end || completedAt > now) continue;
    const amount = Number(tx.amount) || 0;
    const fee = Number(tx.platformFee) || 0;
    gross += amount;
    fees += fee;
    recordedTax += Number(tx.taxAmount) || 0;
    const monthIndex = (completedAt.getUTCMonth() - 2 + 12) % 12;
    monthlyIncome[monthIndex].amount += amount - fee;
  }

  gross = roundMoney(gross);
  fees = roundMoney(fees);
  recordedTax = roundMoney(recordedTax);
  const taxable = roundMoney(Math.max(0, gross - fees));
  const tax = estimateTax(taxable);
  return {
    period: { taxYear, start: start.toISOString(), end: end.toISOString() },
    summary: { gross, fees, taxable, tax, net: roundMoney(taxable - tax), recordedTax },
    monthlyIncome: monthlyIncome.map((month) => ({ ...month, amount: roundMoney(month.amount) })),
    taxMethod: {
      ratesYear: 2027,
      primaryRebate: PRIMARY_REBATE,
      source: "https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/",
      note: "Indicative South African personal income tax on completed HustleHub earnings after platform fees. Assumes a taxpayer under 65, with no other income, expenses, deductions or credits. Not tax withheld or a tax return."
    }
  };
}

exports.buildIncomeData = buildIncomeData;

// GET /api/income - authenticated freelancer's current tax-year earnings.
exports.getIncomeData = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({
      freelancerId: req.user.id,
      status: "completed"
    }).populate("bookingId", "status completedAt");
    res.status(200).json({ success: true, income: buildIncomeData(transactions) });
  } catch (error) {
    next(error);
  }
};
