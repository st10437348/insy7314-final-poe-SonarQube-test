const test = require("node:test");
const assert = require("node:assert/strict");
const { estimateTax } = require("../services/taxEstimate");

test("SARS 2027 primary rebate and threshold", () => {
  assert.equal(estimateTax(0), 0);
  assert.equal(estimateTax(99000), 0);
  assert.equal(estimateTax(100000), 180);
});

test("progressive brackets apply only to income above each boundary", () => {
  assert.equal(estimateTax(245100), 26298);
  assert.equal(estimateTax(383100), 62178);
  assert.equal(estimateTax(500000), 98417);
  assert.equal(estimateTax(2000000), 703149);
});
