// SARS 2027 year of assessment: 1 March 2026 to 28 February 2027.
// This is an indicative calculation for a person under 65 with no other income,
// deductions or credits. It does not represent tax withheld from a transaction.
const BRACKETS = [
  { upTo: 245100, base: 0, rate: 0.18, above: 0 },
  { upTo: 383100, base: 44118, rate: 0.26, above: 245100 },
  { upTo: 530200, base: 79998, rate: 0.31, above: 383100 },
  { upTo: 695800, base: 125599, rate: 0.36, above: 530200 },
  { upTo: 887000, base: 185215, rate: 0.39, above: 695800 },
  { upTo: 1878600, base: 259783, rate: 0.41, above: 887000 },
  { upTo: Infinity, base: 666339, rate: 0.45, above: 1878600 }
];

const PRIMARY_REBATE = 17820;
const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

function estimateTax(taxableIncome) {
  const amount = Math.max(0, Number(taxableIncome) || 0);
  const bracket = BRACKETS.find(({ upTo }) => amount <= upTo);
  const beforeRebate = bracket.base + (amount - bracket.above) * bracket.rate;
  return roundMoney(Math.max(0, beforeRebate - PRIMARY_REBATE));
}

module.exports = { estimateTax, roundMoney, PRIMARY_REBATE };
