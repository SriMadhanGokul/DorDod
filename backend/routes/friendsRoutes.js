const express = require("express");
const router = express.Router();
const {
  getFriends,
  getRequests,
  searchUsers,
  sendRequest,
  acceptRequest,
  removeFriend,
  getInviteLink,
  acceptInvite,
} = require("../controllers/friendsController");
const protect = require("../utils/protect");
router.use(protect);
router.get("/", getFriends);
router.get("/requests", getRequests);
router.get("/search", searchUsers);
router.get("/invite-link", getInviteLink);
router.get("/accept-invite/:token", acceptInvite);
router.post("/request", sendRequest);
router.patch("/:id/accept", acceptRequest);
router.delete("/:id", removeFriend);
module.exports = router;
