const express = require("express");
const router = express.Router();
const {
  getActivities,
  createActivity,
  updateActivity,
  addUpdate,
  deleteActivity,
} = require("../controllers/activityController");
const protect = require("../utils/protect");
router.use(protect);
router.route("/").get(getActivities).post(createActivity);
router.route("/:id").put(updateActivity).delete(deleteActivity);
router.post("/:id/updates", addUpdate);
module.exports = router;
