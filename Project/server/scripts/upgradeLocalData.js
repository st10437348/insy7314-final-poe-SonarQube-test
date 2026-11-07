require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const connectDB = require("../config/database");
const Booking = require("../models/Booking");
const Transaction = require("../models/Transaction");
const Gig = require("../models/Gig");

async function upgradeLocalData() {
  if (process.env.NODE_ENV === "production" ||
      !/(local|dev|test)/i.test(process.env.MONGO_DB_NAME || "")) {
    throw new Error("This upgrade is limited to a local, dev, or test database.");
  }

  await connectDB();
  const bookings = await Booking.find().select("_id status").lean();
  const bookingStatus = new Map(bookings.map(booking =>
    [booking._id.toString(), booking.status]));
  const transactions = await Transaction.find().select("_id bookingId status").lean();
  const updates = transactions.flatMap(transaction => {
    const status = bookingStatus.get(transaction.bookingId?.toString());
    const expected = status === "cancelled" ? "refunded" :
      status === "completed" ? "completed" : "pending";
    return transaction.status === expected ? [] : [{
      updateOne: {
        filter: { _id: transaction._id },
        update: { $set: { status: expected } }
      }
    }];
  });

  if (updates.length) await Transaction.bulkWrite(updates);
  const obsoleteLocationFields = {
    "location.placeId": "",
    "location.latitude": "",
    "location.longitude": ""
  };
  await Gig.collection.updateMany({}, {
    $unset: { ...obsoleteLocationFields, weather: "" }
  });
  await Booking.collection.updateMany({}, {
    $unset: obsoleteLocationFields
  });
  console.log(`Local data updated: ${updates.length} transaction statuses reconciled.`);
}

upgradeLocalData()
  .catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
