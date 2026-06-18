const express = require("express");
const {
  getCustomSkills,
  createCustomSkill,
  getCustomSkill,
  updateCustomSkill,
  deleteCustomSkill,
} = require("../controllers/customSkillController");
const protect = require("../utils/protect");

const router = express.Router();

// Protect all routes
router.use(protect);

// ✅ GET ALL CUSTOM SKILLS
router.get("/", getCustomSkills);

// ✅ CREATE CUSTOM SKILL
router.post("/", createCustomSkill);

// ✅ GET SINGLE CUSTOM SKILL (must come before /:id route)
router.get("/:id", getCustomSkill);

// ✅ UPDATE CUSTOM SKILL
router.put("/:id", updateCustomSkill);

// ✅ DELETE CUSTOM SKILL
router.delete("/:id", deleteCustomSkill);

module.exports = router;
