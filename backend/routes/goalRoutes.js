const express = require("express");
const router = express.Router();
const protect = require("../utils/protect");
const goalController = require("../controllers/goalController");

// ⚠️ CRITICAL: Specific routes MUST come BEFORE dynamic routes like /:id
// Otherwise "stats" will be matched as an ID

// 1️⃣ GET /api/goals/stats - MUST BE FIRST
router.get("/stats", protect, goalController.getGoalStats);

// 2️⃣ GET /api/goals - Get all goals
router.get("/", protect, goalController.getGoals);

// 3️⃣ POST /api/goals - Create goal
router.post("/", protect, goalController.createGoal);

// ⚠️ DYNAMIC ROUTES MUST BE LAST

// 4️⃣ GET /api/goals/:id - Get single goal
router.get("/:id", protect, goalController.getGoal);

// 5️⃣ PUT /api/goals/:id - Update goal
router.put("/:id", protect, goalController.updateGoal);

// 6️⃣ DELETE /api/goals/:id - Delete goal
router.delete("/:id", protect, goalController.deleteGoal);

// 7️⃣ PATCH /api/goals/:id/day/:day/complete - Mark specific day complete (FOR EXECUTIONPAGE)
router.patch("/:id/day/:day/complete", protect, goalController.markDayComplete);

// 8️⃣ POST /api/goals/:id/mark-complete - Mark today complete
router.post("/:id/mark-complete", protect, goalController.markGoalComplete);

// 9️⃣ POST /api/goals/:id/mark-incomplete - Mark day incomplete
router.post("/:id/mark-incomplete", protect, goalController.markGoalIncomplete);

// 🔟 PATCH /api/goals/:id/activate - Activate goal
router.patch("/:id/activate", protect, goalController.activateGoal);

// 1️⃣1️⃣ PUT /api/goals/:id/pause - Pause goal
router.put("/:id/pause", protect, goalController.pauseGoal);

// 1️⃣2️⃣ PUT /api/goals/:id/resume - Resume goal
router.put("/:id/resume", protect, goalController.resumeGoal);

module.exports = router;
