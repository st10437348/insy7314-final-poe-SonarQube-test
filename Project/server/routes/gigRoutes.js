const express = require("express");
const router = express.Router();
const {
  getGigs,
  getGigById,
  getMyGigById,
  createGig,
  updateGig,
  deleteGig,
  getMyGigs
} = require("../controllers/gigController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { validateGig, validateId } = require("../middleware/validateMarketplace");

router.get("/", getGigs);
router.get("/my-gigs", protect, authorizeRoles("Freelancer"), getMyGigs);
router.get("/my-gigs/:id", protect, authorizeRoles("Freelancer"), validateId, getMyGigById);
router.get("/:id", validateId, getGigById);

// Add protect middleware to POST, PUT, and DELETE routes:
router.post("/", protect, authorizeRoles("Freelancer"), validateGig, createGig);
router.put("/:id", protect, authorizeRoles("Freelancer"), validateId, validateGig, updateGig);
router.delete("/:id", protect, authorizeRoles("Freelancer"), validateId, deleteGig);

module.exports = router;
