const express = require("express");
const router = express.Router();
const protect = require("../utils/protect");
const {
  getScope,
  saveScope,
  getAllScopes,
  getScopeHistory,
  deleteScope,
  createNewScope,
  deleteArchivedScope,
} = require("../controllers/scopeController");

// ✅ Apply protect middleware to all routes
router.use(protect);

// Current/Active SCOP
router.get("/", getScope); // Get current active SCOP
router.post("/", saveScope); // Save/update current SCOP
router.delete("/", deleteScope); // Reset current SCOP (saves to history)

// History & Archive
router.get("/history", getScopeHistory); // Get history of current SCOP's resets/updates
router.get("/all", getAllScopes); // Get all SCOPs (active + archived)

// Create new SCOP
router.post("/create", createNewScope); // Archive current, create new active SCOP

// Delete specific archived SCOP
router.delete("/:id", deleteArchivedScope); // Delete a specific archived SCOP

module.exports = router;
