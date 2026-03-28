const express = require("express");
const router = express.Router();
const {
  getSkills,
  saveSkills,
  generateSwot,
} = require("../controllers/skillController");
const protect = require("../utils/protect");

router.use(protect);

router.route("/").get(getSkills).put(saveSkills);
router.post("/swot", generateSwot);

module.exports = router;
