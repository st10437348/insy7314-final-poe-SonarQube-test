const express = require("express");
const router = express.Router();
const {
  getMyTransactions,
  getTransactionById,
  processPayout
} = require("../controllers/transactionController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { validateId } = require("../middleware/validateMarketplace");

// Protect all user transaction endpoints
router.get("/my-transactions", protect, getMyTransactions);
router.get("/:id", protect, validateId, getTransactionById);
router.patch("/:id/payout", protect, authorizeRoles("Admin"), validateId, processPayout);

module.exports = router;
