const express = require("express");
const {
  getCustomSkills,
  createCustomSkill,
  getCustomSkill,
  updateCustomSkill,
  deleteCustomSkill,
  linkSkillToGoal,
  unlinkSkillFromGoal,
} = require("../controllers/customSkillController");
const protect = require("../utils/protect");

const router = express.Router();

// Protect all routes
router.use(protect);

// ✅ GET ALL CUSTOM SKILLS
router.get("/", getCustomSkills);

// ✅ CREATE CUSTOM SKILL(S)
router.post("/", createCustomSkill);

// ✅ GET SINGLE CUSTOM SKILL
router.get("/:id", getCustomSkill);

// ✅ UPDATE CUSTOM SKILL
router.put("/:id", updateCustomSkill);

// ✅ DELETE CUSTOM SKILL
router.delete("/:id", deleteCustomSkill);

// ✅ LINK SKILL TO GOAL
router.post("/:id/link-goal", linkSkillToGoal);

// ✅ UNLINK SKILL FROM GOAL
router.post("/:id/unlink-goal", unlinkSkillFromGoal);

module.exports = router;
