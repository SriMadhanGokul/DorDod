const Scope = require("../models/Scope");

// NOTE: uses req.user.id to match your profile + financial controllers.

// ── GET /api/scop — fetch the user's SCOP worksheet (creates blank if none) ───
const getScope = async (req, res) => {
  try {
    let scope = await Scope.findOne({ user: req.user.id });
    if (!scope) scope = await Scope.create({ user: req.user.id });
    res.status(200).json({ success: true, data: scope });
  } catch (err) {
    console.error("getScope error:", err);
    res.status(500).json({ success: false, message: "Failed to load SCOP" });
  }
};

// ── POST /api/scop — save / update the worksheet ──────────────────────────────
const saveScope = async (req, res) => {
  try {
    const {
      strengths,
      constraints,
      opportunities,
      patterns,
      keyInsight,
      myFocus,
      myNextStep,
    } = req.body;

    const update = { user: req.user.id };
    if (strengths !== undefined) update.strengths = strengths;
    if (constraints !== undefined) update.constraints = constraints;
    if (opportunities !== undefined) update.opportunities = opportunities;
    if (patterns !== undefined) update.patterns = patterns;
    if (keyInsight !== undefined) update.keyInsight = keyInsight;
    if (myFocus !== undefined) update.myFocus = myFocus;
    if (myNextStep !== undefined) update.myNextStep = myNextStep;

    const scope = await Scope.findOneAndUpdate({ user: req.user.id }, update, {
      new: true,
      upsert: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: scope });
  } catch (err) {
    console.error("saveScope error:", err);
    res.status(500).json({ success: false, message: "Failed to save SCOP" });
  }
};

// ── GET /api/scop/history — fetch follow-up history ──────────────────────────────
const getScopeHistory = async (req, res) => {
  try {
    const scope = await Scope.findOne({ user: req.user.id });
    if (!scope || !scope.followUps) {
      return res.status(200).json({ success: true, data: [] });
    }
    res.status(200).json({
      success: true,
      data: scope.followUps.sort((a, b) => new Date(b.date) - new Date(a.date)),
    });
  } catch (err) {
    console.error("getScopeHistory error:", err);
    res.status(500).json({ success: false, message: "Failed to load history" });
  }
};

// ── POST /api/scop/follow-up — add follow-up entry ──────────────────────────────
const addFollowUp = async (req, res) => {
  try {
    const { status, notes } = req.body;

    let scope = await Scope.findOne({ user: req.user.id });
    if (!scope) {
      scope = await Scope.create({ user: req.user.id });
    }

    if (!scope.followUps) scope.followUps = [];
    scope.followUps.push({
      date: new Date(),
      status,
      notes,
    });

    await scope.save();

    res.status(200).json({
      success: true,
      message: "Follow-up added successfully",
      data: scope,
    });
  } catch (err) {
    console.error("addFollowUp error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to add follow-up" });
  }
};

module.exports = { getScope, saveScope, getScopeHistory, addFollowUp };
