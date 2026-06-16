const Scope = require("../models/Scope");

// ✅ GET /api/scop — fetch user's active SCOP (most recent)
const getScope = async (req, res) => {
  try {
    // ✅ Use findOneAndUpdate with upsert to avoid duplicate key errors
    let scope = await Scope.findOneAndUpdate(
      {
        user: req.user.id,
        status: "active",
      },
      {},
      { new: true },
    );

    if (!scope) {
      scope = await Scope.create({
        user: req.user.id,
        title: `SCOP — ${new Date().toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`,
        status: "active",
      });
    }

    res.status(200).json({ success: true, data: scope });
  } catch (err) {
    console.error("getScope error:", err);
    res.status(500).json({ success: false, message: "Failed to load SCOP" });
  }
};

// ✅ POST /api/scop — save / update the current SCOP
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

    // ✅ Get current SCOP
    let scope = await Scope.findOne({
      user: req.user.id,
      status: "active",
    }).sort({ createdAt: -1 });

    if (!scope) {
      // Create new if doesn't exist
      scope = await Scope.create({
        user: req.user.id,
        strengths,
        constraints,
        opportunities,
        patterns,
        keyInsight,
        myFocus,
        myNextStep,
        status: "active",
      });
    } else {
      // ✅ Save current state to history before updating
      if (
        scope.strengths ||
        scope.constraints ||
        scope.opportunities ||
        scope.patterns
      ) {
        scope.history.push({
          date: new Date(),
          strengths: scope.strengths,
          constraints: scope.constraints,
          opportunities: scope.opportunities,
          patterns: scope.patterns,
          keyInsight: scope.keyInsight,
          myFocus: scope.myFocus,
          myNextStep: scope.myNextStep,
          reason: "update",
        });
      }

      // Update with new values
      scope.strengths = strengths || scope.strengths;
      scope.constraints = constraints || scope.constraints;
      scope.opportunities = opportunities || scope.opportunities;
      scope.patterns = patterns || scope.patterns;
      scope.keyInsight = keyInsight || scope.keyInsight;
      scope.myFocus = myFocus || scope.myFocus;
      scope.myNextStep = myNextStep || scope.myNextStep;

      await scope.save();
    }

    res.status(200).json({ success: true, data: scope });
  } catch (err) {
    console.error("saveScope error:", err);
    res.status(500).json({ success: false, message: "Failed to save SCOP" });
  }
};

// ✅ GET /api/scop/all — fetch all past SCOPs (for history/archive)
const getAllScopes = async (req, res) => {
  try {
    const scopes = await Scope.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({ success: true, data: scopes });
  } catch (err) {
    console.error("getAllScopes error:", err);
    res.status(500).json({ success: false, message: "Failed to load scopes" });
  }
};

// ✅ GET /api/scop/history — fetch history of resets/updates from current SCOP
const getScopeHistory = async (req, res) => {
  try {
    const scope = await Scope.findOne({
      user: req.user.id,
      status: "active",
    }).sort({ createdAt: -1 });

    if (!scope || !scope.history || scope.history.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Sort history by date descending
    const sortedHistory = scope.history.sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );

    res.status(200).json({ success: true, data: sortedHistory });
  } catch (err) {
    console.error("getScopeHistory error:", err);
    res.status(500).json({ success: false, message: "Failed to load history" });
  }
};

// ✅ DELETE /api/scop — reset current SCOP (saves to history first)
const deleteScope = async (req, res) => {
  try {
    const scope = await Scope.findOne({
      user: req.user.id,
      status: "active",
    }).sort({ createdAt: -1 });

    if (!scope) {
      return res
        .status(404)
        .json({ success: false, message: "SCOP not found" });
    }

    // ✅ SAVE TO HISTORY BEFORE DELETING
    if (
      scope.strengths ||
      scope.constraints ||
      scope.opportunities ||
      scope.patterns
    ) {
      scope.history.push({
        date: new Date(),
        strengths: scope.strengths,
        constraints: scope.constraints,
        opportunities: scope.opportunities,
        patterns: scope.patterns,
        keyInsight: scope.keyInsight,
        myFocus: scope.myFocus,
        myNextStep: scope.myNextStep,
        reason: "reset", // Mark as reset
      });
    }

    // Clear the fields
    scope.strengths = "";
    scope.constraints = "";
    scope.opportunities = "";
    scope.patterns = "";
    scope.keyInsight = "";
    scope.myFocus = "";
    scope.myNextStep = "";

    await scope.save();

    console.log(`✅ SCOP reset for user ${req.user.id}, saved to history`);
    res.status(200).json({
      success: true,
      message: "SCOP reset and saved to history",
      data: scope,
    });
  } catch (err) {
    console.error("deleteScope error:", err);
    res.status(500).json({ success: false, message: "Failed to reset SCOP" });
  }
};

// ✅ POST /api/scop/create — create a NEW SCOP (archive current, create fresh)
const createNewScope = async (req, res) => {
  try {
    const { title } = req.body;

    // Archive the current active SCOP
    await Scope.updateOne(
      { user: req.user.id, status: "active" },
      { status: "archived" },
    );

    // Create new active SCOP
    const newScope = await Scope.create({
      user: req.user.id,
      title:
        title ||
        `SCOP — ${new Date().toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`,
      status: "active",
    });

    console.log(`✅ New SCOP created for user ${req.user.id}`);
    res.status(201).json({
      success: true,
      message: "New SCOP created",
      data: newScope,
    });
  } catch (err) {
    console.error("createNewScope error:", err);
    res.status(500).json({ success: false, message: "Failed to create SCOP" });
  }
};

// ✅ DELETE /api/scop/:id — delete a specific archived SCOP
const deleteArchivedScope = async (req, res) => {
  try {
    const scope = await Scope.findById(req.params.id);

    if (!scope || scope.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this SCOP",
      });
    }

    await Scope.findByIdAndDelete(req.params.id);

    console.log(`✅ SCOP ${req.params.id} deleted`);
    res.status(200).json({ success: true, message: "SCOP deleted" });
  } catch (err) {
    console.error("deleteArchivedScope error:", err);
    res.status(500).json({ success: false, message: "Failed to delete SCOP" });
  }
};

module.exports = {
  getScope,
  saveScope,
  getAllScopes,
  getScopeHistory,
  deleteScope,
  createNewScope,
  deleteArchivedScope,
};
