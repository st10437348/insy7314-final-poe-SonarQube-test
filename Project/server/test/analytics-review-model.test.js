const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Analytics = require('../models/Analytics');
const Review = require('../models/Review');

const id = () => new mongoose.Types.ObjectId();

test('daily analytics requires a date and starts counters at zero', () => {
  const missingDate = new Analytics();
  assert.equal(missingDate.validateSync().errors.date.kind, 'required');

  const daily = new Analytics({ date: new Date('2026-11-07') });
  assert.equal(daily.validateSync(), undefined);
  assert.equal(daily.activeUsers, 0);
  assert.equal(daily.apiRequests, 0);
  assert.equal(daily.bookings, 0);
  assert.equal(daily.revenue, 0);
});

test('reviews require related records and a rating between one and five', () => {
  const review = new Review({
    gigId: id(), bookingId: id(), clientId: id(), freelancerId: id(), rating: 4
  });
  assert.equal(review.validateSync(), undefined);
  assert.equal(review.comment, '');

  review.rating = 0;
  assert.equal(review.validateSync().errors.rating.kind, 'min');
  review.rating = 6;
  assert.equal(review.validateSync().errors.rating.kind, 'max');

  const missingLinks = new Review({ rating: 3 });
  const errors = missingLinks.validateSync().errors;
  for (const field of ['gigId', 'bookingId', 'clientId', 'freelancerId']) {
    assert.equal(errors[field].kind, 'required');
  }
});
