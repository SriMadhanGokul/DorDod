const GuidanceSession = require("../models/GuidanceSession");
const DailyCheckIn = require("../models/DailyCheckIn");
const Goal = require("../models/Goal");

const todayStr = () => new Date().toISOString().slice(0, 10);

// Rule-based guide responses — NO AI, fully self-contained
const GUIDE_RESPONSES = {
  Avoidance: [
    {
      trigger: /start|begin|first step/i,
      response:
        "The smallest action breaks the avoidance loop. What is the one thing — even 5 minutes — you could do right now?",
    },
    {
      trigger: /afraid|fear|scared/i,
      response:
        "Fear of starting is often fear of failing. What would you do if you knew it wouldn't be judged?",
    },
    {
      trigger: /don't know where/i,
      response:
        "That's the loop talking. Pick any starting point — you can adjust direction once moving.",
    },
    {
      trigger: /overwhelm/i,
      response:
        "Overwhelm means too many options. Pick ONE and forget the rest for today.",
    },
  ],
  Overthinking: [
    {
      trigger: /think|plan|prepare/i,
      response:
        "More thinking won't bring clarity. Action will. What can you do in the next 10 minutes?",
    },
    {
      trigger: /perfect|right|best/i,
      response:
        "Waiting for perfect is another name for avoiding. Done is better than perfect.",
    },
    {
      trigger: /not ready/i,
      response:
        "You will never feel 100% ready. Readiness comes through action, not preparation.",
    },
  ],
  Inconsistency: [
    {
      trigger: /habit|routine|consistent/i,
      response:
        "Consistency isn't about willpower — it's about design. What would make this behavior automatic?",
    },
    {
      trigger: /forget|miss|skip/i,
      response:
        "Missing is normal. The question is: what triggered the miss? That's your real pattern.",
    },
    {
      trigger: /motivation/i,
      response:
        "Don't rely on motivation. Design your environment so the behavior is the easiest option.",
    },
  ],
  General: [
    {
      trigger: /why|reason|understand/i,
      response:
        "Understanding comes after awareness. You're already here — that's the first step.",
    },
    {
      trigger: /stuck|loop|repeat/i,
      response:
        "Loops exist to protect you from something. What are you protecting yourself from?",
    },
    {
      trigger: /change|different|better/i,
      response:
        "Change starts with one honest conversation — the one you're having with yourself right now.",
    },
    {
      trigger: /help|guide|what should/i,
      response:
        "I won't tell you what to do. But I can ask: what do you already know you need to do?",
    },
  ],
};

// Question flow per loop type
const OPENING_QUESTIONS = {
  Avoidance:
    "I can see there's an avoidance pattern. Let's explore it — not to judge, but to understand. What task or situation keeps getting pushed to tomorrow?",
  Overthinking:
    "It looks like there's a lot of thinking happening but not enough movement. That's not a character flaw — it's a pattern. What decision feels impossible to make right now?",
  Inconsistency:
    "Your intentions are clear but the behavior isn't matching. That gap has information in it. When you skip a habit or goal action, what usually just happened?",
  None: "You chose to explore Guidance today. That itself is a form of awareness. What's on your mind that you want to understand better?",
  Clear:
    "You're in a clear state — that's valuable. What do you want to make progress on while this clarity is present?",
  Focused:
    "You're focused. Guidance can help you deepen that. What's the most important thing this focus should go toward?",
  Anxious:
    "Anxiety often carries important information. Let's not fight it — let's hear it. What is the anxiety trying to tell you?",
  Confused:
    "Confusion usually means two things are in conflict. What are the two options or directions pulling at you right now?",
  Avoiding:
    "Something is being avoided. That's okay — avoidance is protection. What does it feel like when you think about that thing you're not doing?",
};

const getGuideResponse = (message, loopType, context) => {
  const loop = loopType || "General";
  const all = [...(GUIDE_RESPONSES[loop] || []), ...GUIDE_RESPONSES.General];
  const matched = all.find((r) => r.trigger.test(message));
  if (matched) return matched.response;

  // Fallback contextual responses
  const fallbacks = [
    "Tell me more about that.",
    "What does that feel like when you sit with it?",
    "If you already knew the answer — what would it be?",
    "What would change if this wasn't a problem?",
    "What are you making this mean about yourself?",
    "You mentioned something important there. Can you say more?",
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
};

// POST /api/guidance/start  — start or resume today's session
const startSession = async (req, res) => {
  try {
    const { context } = req.body; // { goal, loopType, mindState }
    let session = await GuidanceSession.findOne({
      user: req.user.id,
      date: todayStr(),
    });

    if (!session) {
      const opening =
        OPENING_QUESTIONS[context?.loopType] ||
        OPENING_QUESTIONS[context?.mindState] ||
        OPENING_QUESTIONS.None;
      session = await GuidanceSession.create({
        user: req.user.id,
        date: todayStr(),
        context: context || {},
        messages: [{ role: "guide", content: opening }],
      });
    }
    res.status(200).json({ success: true, data: session });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to start session" });
  }
};

// POST /api/guidance/message  — send a message and get guide response
const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Message is empty" });

    let session = await GuidanceSession.findOne({
      user: req.user.id,
      date: todayStr(),
    });
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Start a session first" });

    // Add seeker message
    session.messages.push({ role: "seeker", content: content.trim() });

    // Generate guide response
    const guideText = getGuideResponse(
      content,
      session.context?.loopType,
      session.context,
    );
    session.messages.push({ role: "guide", content: guideText });

    await session.save();
    res
      .status(200)
      .json({ success: true, data: session, guideResponse: guideText });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

// GET /api/guidance/today
const getTodaySession = async (req, res) => {
  try {
    const session = await GuidanceSession.findOne({
      user: req.user.id,
      date: todayStr(),
    });
    res.status(200).json({ success: true, data: session });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch session" });
  }
};

// GET /api/guidance/history
const getHistory = async (req, res) => {
  try {
    const sessions = await GuidanceSession.find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(10)
      .select("date context completed intentUpdate sessionInsight");
    res.status(200).json({ success: true, data: sessions });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch history" });
  }
};

// POST /api/guidance/complete  — finalize session + update Intent/Behavior/Insights
const completeSession = async (req, res) => {
  try {
    const { intentUpdate, behaviorSuggestion, sessionInsight } = req.body;
    const session = await GuidanceSession.findOneAndUpdate(
      { user: req.user.id, date: todayStr() },
      {
        completed: true,
        intentUpdate: intentUpdate || "",
        behaviorSuggestion: behaviorSuggestion || "",
        sessionInsight: sessionInsight || "",
      },
      { new: true },
    );
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "No session today" });

    // Push update to DailyCheckIn (close the loop — item #12)
    await DailyCheckIn.findOneAndUpdate(
      { user: req.user.id, date: todayStr() },
      {
        guidanceSessionDone: true,
        guidanceGoalUpdate: intentUpdate || "",
        guidanceBehaviorSugg: behaviorSuggestion || "",
        guidanceInsight: sessionInsight || "",
      },
    );

    res
      .status(200)
      .json({
        success: true,
        message: "Session completed and system updated!",
        data: session,
      });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to complete session" });
  }
};

module.exports = {
  startSession,
  sendMessage,
  getTodaySession,
  getHistory,
  completeSession,
};
