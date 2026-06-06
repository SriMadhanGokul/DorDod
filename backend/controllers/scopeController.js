const Scope = require("../models/Scope");
const User = require("../models/User");

// GET current SCOP — auto-create if missing
exports.getScope = async (req, res) => {
  try {
    let scope = await Scope.findOne({ user: req.user.id });
    if (!scope) {
      scope = new Scope({
        user: req.user.id,
        strengths: "",
        constraints: "",
        opportunities: "",
        patterns: "",
        keyInsight: "",
        myFocus: "",
        myNextStep: "",
      });
      await scope.save();
    }
    res.json({ success: true, data: scope });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST save/update SCOP
exports.saveScope = async (req, res) => {
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

    if (
      !strengths?.trim() ||
      !constraints?.trim() ||
      !opportunities?.trim() ||
      !patterns?.trim()
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All SCOP sections are required" });
    }

    let scope = await Scope.findOne({ user: req.user.id });
    if (!scope) {
      scope = new Scope({ user: req.user.id });
    }

    // Update fields
    scope.strengths = strengths.trim();
    scope.constraints = constraints.trim();
    scope.opportunities = opportunities.trim();
    scope.patterns = patterns.trim();
    scope.keyInsight = keyInsight?.trim() || "";
    scope.myFocus = myFocus?.trim() || "";
    scope.myNextStep = myNextStep?.trim() || "";
    scope.lastUpdated = new Date();

    await scope.save();

    // Optionally update user's profile to note SCOP completion
    await User.findByIdAndUpdate(req.user.id, {
      scopeLastCompleted: new Date(),
    });

    res.json({ success: true, data: scope });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET SCOP history — past submissions
exports.getScopeHistory = async (req, res) => {
  try {
    const scopes = await Scope.find({ user: req.user.id })
      .select(
        "strengths constraints opportunities patterns keyInsight myFocus myNextStep lastUpdated createdAt",
      )
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, data: scopes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST generate follow-up questions (optional AI integration)
// If using Claude API, this could generate reflective prompts based on user input
exports.generateFollowUpQuestions = async (req, res) => {
  try {
    const { strengths, constraints, opportunities, patterns } = req.body;

    // Placeholder: could integrate with Claude API to generate AI questions
    // For now, return structured reflection prompts based on user input

    const followUpQuestions = {
      strengths: [
        "How can you leverage these strengths even more?",
        "Which strength could you teach to someone else?",
        "What would become possible if you doubled down on this strength?",
      ],
      constraints: [
        "What's one small step to reduce this constraint?",
        "Who could help you navigate this?",
        "Is this constraint fixed, or can it change?",
      ],
      opportunities: [
        "Which opportunity excites you most?",
        "What would you need to pursue this?",
        "How soon could you start?",
      ],
      patterns: [
        "What triggers this pattern?",
        "How would breaking this pattern change things?",
        "What would you do instead?",
      ],
    };

    res.json({ success: true, data: followUpQuestions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE SCOP (reset)
exports.deleteScope = async (req, res) => {
  try {
    await Scope.findOneAndDelete({ user: req.user.id });
    res.json({ success: true, message: "SCOP deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
