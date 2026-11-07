const express = require("express");
const router = express.Router();
const { getIncomeData } = require("../controllers/incomeController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/", protect, authorizeRoles("Freelancer"), getIncomeData);

module.exports = router;
