const ScoreCard = require("../models/ScoreCard");
const User = require("../models/User");

const getOrCreate = async (userId) => {
  let card = await ScoreCard.findOne({ user: userId });
  if (!card) card = await ScoreCard.create({ user: userId });
  return card;
};

// GET /api/scorecard
const getMyScoreCard = async (req, res) => {
  try {
    const card = await getOrCreate(req.user.id);
    await card.populate("scoresReceived.from", "name");
    await card.populate("scoresGiven.from", "name");

    const avgReceived = card.scoresReceived.length
      ? Math.round(
          card.scoresReceived.reduce((s, r) => s + r.score, 0) /
            card.scoresReceived.length,
        )
      : 0;

    res
      .status(200)
      .json({ success: true, data: { ...card.toObject(), avgReceived } });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch score card" });
  }
};

// POST /api/scorecard/give/:userId
const giveScore = async (req, res) => {
  try {
    const { score, comment, category } = req.body;
    if (!score || score < 1 || score > 100)
      return res
        .status(400)
        .json({ success: false, message: "Score must be between 1 and 100" });

    const targetUser = await User.findById(req.params.userId);
    if (!targetUser)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    if (req.params.userId === req.user.id)
      return res
        .status(400)
        .json({ success: false, message: "You cannot score yourself" });

    // Add to giver's given list
    const giverCard = await getOrCreate(req.user.id);
    giverCard.scoresGiven.push({ from: req.user.id, score, comment, category });
    await giverCard.save();

    // Add to receiver's received list
    const receiverCard = await getOrCreate(req.params.userId);
    receiverCard.scoresReceived.push({
      from: req.user.id,
      score,
      comment,
      category,
    });
    // Recompute myScore as average
    receiverCard.myScore = Math.round(
      receiverCard.scoresReceived.reduce((s, r) => s + r.score, 0) /
        receiverCard.scoresReceived.length,
    );
    await receiverCard.save();

    res
      .status(201)
      .json({ success: true, message: "Score given successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to give score" });
  }
};

// GET /api/scorecard/users  — list all users to give score to
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } }).select(
      "name email",
    );
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

module.exports = { getMyScoreCard, giveScore, getUsers };
