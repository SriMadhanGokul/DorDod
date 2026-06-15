// backend/routes/scopeRoutes.js
const express = require("express");
const router = express.Router();
const protect = require("../utils/protect"); // ✅ CORRECT PATH
const {
  getScope,
  saveScope,
  getScopeHistory,
  addFollowUp,
} = require("../controllers/scopeController");

// ✅ Apply protect middleware to all routes
router.use(protect);

router.get("/", getScope);
router.get("/history", getScopeHistory);
router.post("/", saveScope);
router.post("/follow-up", addFollowUp);

module.exports = router;
