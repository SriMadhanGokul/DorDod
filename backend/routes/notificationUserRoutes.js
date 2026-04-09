const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const protect = require("../utils/protect");

router.use(protect);

// GET /api/notifications
router.get("/", async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const filter = { user: req.user.id };
    if (unreadOnly === "true") filter.read = false;
    const notifs = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(20);
    res.status(200).json({ success: true, data: notifs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
  }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// PATCH /api/notifications/read-all
router.patch("/read-all", async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true },
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
