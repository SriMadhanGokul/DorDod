const Friendship = require("../models/Friendship");
const User = require("../models/User");
const UserScore = require("../models/UserScore");
const Notification = require("../models/Notification");
const crypto = require("crypto");

const getFriends = async (req, res) => {
  try {
    const friendships = await Friendship.find({
      $or: [{ requester: req.user.id }, { recipient: req.user.id }],
      status: "accepted",
    })
      .populate("requester", "name email avatar")
      .populate("recipient", "name email avatar");

    const friends = friendships.map((f) => {
      const friend =
        f.requester._id.toString() === req.user.id.toString()
          ? f.recipient
          : f.requester;
      return { friendshipId: f._id, ...friend.toObject() };
    });

    const scores = await UserScore.find({
      user: { $in: friends.map((f) => f._id) },
    });
    const scoreMap = {};
    scores.forEach((s) => {
      scoreMap[s.user.toString()] = s;
    });

    const enriched = friends.map((f) => ({
      ...f,
      xp: scoreMap[f._id?.toString()]?.totalXP || 0,
      level: scoreMap[f._id?.toString()]?.level || 1,
      levelName: scoreMap[f._id?.toString()]?.levelName || "🥉 Bronze",
      streak: scoreMap[f._id?.toString()]?.streak || 0,
    }));

    res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch friends" });
  }
};

const getRequests = async (req, res) => {
  try {
    const requests = await Friendship.find({
      recipient: req.user.id,
      status: "pending",
    }).populate("requester", "name email avatar");
    res.status(200).json({ success: true, data: requests });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch requests" });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2)
      return res
        .status(400)
        .json({ success: false, message: "Query too short" });

    const users = await User.find({
      _id: { $ne: req.user.id },
      role: "user",
      $or: [
        { email: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
      ],
    })
      .select("name email avatar")
      .limit(10);

    const ids = users.map((u) => u._id);
    const existing = await Friendship.find({
      $or: [
        { requester: req.user.id, recipient: { $in: ids } },
        { requester: { $in: ids }, recipient: req.user.id },
      ],
    });
    const statusMap = {};
    existing.forEach((f) => {
      const otherId =
        f.requester.toString() === req.user.id.toString()
          ? f.recipient.toString()
          : f.requester.toString();
      statusMap[otherId] =
        f.status === "accepted"
          ? "friends"
          : f.requester.toString() === req.user.id.toString()
            ? "sent"
            : "received";
    });

    const result = users.map((u) => ({
      ...u.toObject(),
      friendStatus: statusMap[u._id.toString()] || "none",
    }));
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: "Search failed" });
  }
};

const sendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (recipientId === req.user.id.toString())
      return res
        .status(400)
        .json({ success: false, message: "Cannot add yourself!" });

    const existing = await Friendship.findOne({
      $or: [
        { requester: req.user.id, recipient: recipientId },
        { requester: recipientId, recipient: req.user.id },
      ],
    });
    if (existing)
      return res
        .status(400)
        .json({ success: false, message: "Request already exists" });

    await Friendship.create({ requester: req.user.id, recipient: recipientId });
    const me = await User.findById(req.user.id).select("name");
    await Notification.create({
      user: recipientId,
      type: "info",
      title: "👋 Friend Request!",
      message: `${me.name} wants to be your friend on DoR-DoD! 🤝`,
    });
    res.status(201).json({ success: true, message: "Friend request sent! 🤝" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to send request" });
  }
};

const acceptRequest = async (req, res) => {
  try {
    const f = await Friendship.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id, status: "pending" },
      { status: "accepted" },
      { new: true },
    ).populate("requester", "name");
    if (!f)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    const me = await User.findById(req.user.id).select("name");
    await Notification.create({
      user: f.requester._id,
      type: "success",
      title: "🎉 You have a new friend!",
      message: `${me.name} accepted your friend request! Compete on the leaderboard! 🏆`,
    });
    res
      .status(200)
      .json({
        success: true,
        message: `You and ${f.requester.name} are now friends! 🎉`,
      });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to accept" });
  }
};

const removeFriend = async (req, res) => {
  try {
    await Friendship.findOneAndDelete({
      _id: req.params.id,
      $or: [{ requester: req.user.id }, { recipient: req.user.id }],
    });
    res.status(200).json({ success: true, message: "Removed." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to remove" });
  }
};

// GET /api/friends/invite-link  — generate shareable invite
const getInviteLink = async (req, res) => {
  try {
    const token = Buffer.from(req.user.id.toString()).toString("base64");
    const link = `${process.env.CLIENT_URL}/join?ref=${token}`;
    res.status(200).json({ success: true, data: { link, token } });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to generate link" });
  }
};

// GET /api/friends/accept-invite/:token
const acceptInvite = async (req, res) => {
  try {
    const senderId = Buffer.from(req.params.token, "base64").toString();
    if (senderId === req.user.id.toString())
      return res
        .status(400)
        .json({ success: false, message: "Cannot add yourself" });

    const existing = await Friendship.findOne({
      $or: [
        { requester: senderId, recipient: req.user.id },
        { requester: req.user.id, recipient: senderId },
      ],
    });
    if (existing && existing.status === "accepted")
      return res
        .status(400)
        .json({ success: false, message: "Already friends!" });
    if (!existing) {
      await Friendship.create({
        requester: senderId,
        recipient: req.user.id,
        status: "accepted",
      });
    } else {
      existing.status = "accepted";
      await existing.save();
    }
    const sender = await User.findById(senderId).select("name");
    res
      .status(200)
      .json({
        success: true,
        message: `You and ${sender?.name || "user"} are now friends! 🎉`,
      });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to accept invite" });
  }
};

module.exports = {
  getFriends,
  getRequests,
  searchUsers,
  sendRequest,
  acceptRequest,
  removeFriend,
  getInviteLink,
  acceptInvite,
};
