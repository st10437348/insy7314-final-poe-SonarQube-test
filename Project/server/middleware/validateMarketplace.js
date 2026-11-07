const mongoose = require("mongoose");

const bad = (res, message) => res.status(400).json({ message });
const text = (value, max = 500) =>
  typeof value === "string" && value.trim().length > 0 &&
  value.trim().length <= max && !/[<>]/.test(value);
const money = (value) => typeof value === "number" && Number.isFinite(value) &&
  value >= 0 && value <= 10000000 && Math.abs(Math.round(value * 100) - value * 100) < 1e-6;
const objectId = (value) => mongoose.isValidObjectId(value);

const validateGig = (req, res, next) => {
  const { title, description, category, price, deliveryDays, location, imageUrl, status } = req.body || {};
  if (!text(title, 120) || !text(description, 3000) || !text(category, 80) ||
      !money(price) || !Number.isInteger(deliveryDays) || deliveryDays < 1 || deliveryDays > 365 ||
      !location || typeof location !== "object" || Array.isArray(location) ||
      !text(location.address, 200) ||
      (imageUrl !== undefined && imageUrl !== "" &&
        (typeof imageUrl !== "string" || imageUrl.length > 500 || !/^https?:\/\//i.test(imageUrl))) ||
      (status !== undefined && !["active", "paused"].includes(status))) {
    return bad(res, "Invalid gig details.");
  }
  next();
};

const validateBooking = (req, res, next) => {
  const { gigId, bookingDate } = req.body || {};
  const date = new Date(bookingDate);
  if (!objectId(gigId) || !bookingDate || Number.isNaN(date.valueOf()) ||
      date.getTime() < Date.now() - 86400000 || date.getTime() > Date.now() + 366 * 86400000) {
    return bad(res, "Choose a valid gig and booking date.");
  }
  next();
};

const validateId = (req, res, next) =>
  objectId(req.params.id) ? next() : bad(res, "Invalid record ID.");

module.exports = { validateGig, validateBooking, validateId };
