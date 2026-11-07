const Transaction = require("../models/Transaction");

// @desc    Create a new transaction (payment log)
// @route   POST /api/transactions
// Transactions are created by the booking flow, not by a caller-supplied amount.

// @desc    Get transaction history for a logged-in user
// @route   GET /api/transactions/my-transactions
exports.getMyTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const transactions = await Transaction.find({
      $or: [{ clientId: userId }, { freelancerId: userId }]
    })
      .populate({ path: "bookingId", populate: { path: "gigId", select: "title" } })
      .populate("clientId", "name email")
      .populate("freelancerId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: transactions.length, transactions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction / invoice details
// @route   GET /api/transactions/:id
exports.getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("bookingId")
      .populate("clientId", "name email phone location")
      .populate("freelancerId", "name email phone location");

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    if (req.user.role !== "Admin" &&
        transaction.clientId._id.toString() !== req.user.id &&
        transaction.freelancerId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied." });
    }

    res.status(200).json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
};

// @desc    Process payout for freelancer
// @route   PATCH /api/transactions/:id/payout
exports.processPayout = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("bookingId", "status");
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    if (transaction.status !== "completed" ||
        transaction.bookingId?.status !== "completed" || transaction.payoutDate) {
      return res.status(409).json({ message: "Only unpaid completed bookings can be paid out." });
    }

    transaction.payoutDate = new Date();
    await transaction.save();

    res.status(200).json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
};
