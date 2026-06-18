const express = require("express");
const router = express.Router();
const {
  getCareers,
  getSkillPath,
  selectCareerPath,
  activatePath,
  deletePath,
  updateSkillStatus,
  addSkillToGoal,
  getSkillLearningResources,
  getCareerDetails,
} = require("../controllers/skillPathController");
const protect = require("../utils/protect");

router.use(protect);

// Get careers list
router.get("/careers", getCareers);
router.get("/careers/:id", getCareerDetails);

// Skill path management
router.get("/", getSkillPath); // Get all paths + active path
router.post("/select", selectCareerPath); // Add new path (or activate if exists)

// ✅ NEW: Switch between paths
router.patch("/:pathId/activate", activatePath);

// ✅ NEW: Delete a path
router.delete("/paths/:pathId", deletePath);

// Skill management
router.patch("/skills/:skillId", updateSkillStatus);
router.post("/skills/:skillId/add-goal", addSkillToGoal);

// Resources
router.get("/resources/:skillName", getSkillLearningResources);

module.exports = router;
