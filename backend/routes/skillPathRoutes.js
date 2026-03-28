const express = require("express");
const router = express.Router();
const {
  getCareers,
  getSkillPath,
  selectCareerPath,
  updateSkillStatus,
  addSkillToGoal,
  getSkillLearningResources,
  getCareerDetails,
} = require("../controllers/skillPathController");
const protect = require("../utils/protect");

router.use(protect);

router.get("/careers", getCareers);
router.get("/careers/:id", getCareerDetails);
router.get("/resources/:skillName", getSkillLearningResources);
router.get("/", getSkillPath);
router.post("/select", selectCareerPath);
router.patch("/skills/:skillId", updateSkillStatus);
router.post("/skills/:skillId/add-goal", addSkillToGoal);

module.exports = router;
