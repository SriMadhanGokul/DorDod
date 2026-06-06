const express = require("express");
const protect = require("../middleware/auth");
const {
  getScope,
  saveScope,
  getScopeHistory,
  generateFollowUpQuestions,
  deleteScope,
} = require("../controllers/scopeController");

const router = express.Router();

// GET /api/scop — current SCOP (auto-create blank if missing)
router.get("/", protect, getScope);

// POST /api/scop — save/update SCOP
router.post("/", protect, saveScope);

// GET /api/scop/history — past submissions
router.get("/history", protect, getScopeHistory);

// POST /api/scop/follow-up — generate reflection prompts (optional)
router.post("/follow-up", protect, generateFollowUpQuestions);

// DELETE /api/scop — reset/delete SCOP
router.delete("/", protect, deleteScope);

module.exports = router;
