const express = require("express");
const router = express.Router();
const {
  getCustomSkills,
  createCustomSkill,
  updateCustomSkill,
  deleteCustomSkill,
} = require("../controllers/customSkillController");
const protect = require("../utils/protect");

router.use(protect);
router.route("/").get(getCustomSkills).post(createCustomSkill);
router.route("/:id").put(updateCustomSkill).delete(deleteCustomSkill);

module.exports = router;
