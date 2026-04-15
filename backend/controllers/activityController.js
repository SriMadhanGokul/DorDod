const Activity    = require('../models/Activity');
const Goal        = require('../models/Goal');
const Habit       = require('../models/Habit');
const Achievement = require('../models/Achievement');
const { awardXP } = require('./xpController');

const SUGGESTIONS = {
  'Career':       ['Research the topic deeply','Create a weekly study schedule','Complete one full tutorial','Build a practice project from scratch','Review and revise notes','Share progress with a mentor','Join a relevant online community'],
  'Fitness':      ['Morning workout session','Track calories for the day','Drink 8 glasses of water','Rest and recovery day','Stretching routine','Cardio session 30 mins','Meal prep for the week'],
  'Financial':    ['Review monthly budget','Track daily expenses','Research one investment option','Set a savings milestone','Read a finance article','Cut one unnecessary expense'],
  'Intellectual': ['Read for 30 minutes','Watch one educational video','Write a summary of learning','Discuss topic with a peer','Take a practice quiz','Write 5 key takeaways'],
  'Spiritual':    ['10-minute morning meditation','Journal your thoughts','Gratitude practice — list 3 things','Mindfulness walk','Read inspirational content','Breathing exercise'],
  'Social':       ['Reach out to one new person','Attend a community event','Schedule a catch-up call','Join an online group','Send a thoughtful message to a friend'],
  'Family':       ['Plan a family activity','Have a meaningful conversation','Cook a meal together','Share something you learned','Write a note of appreciation'],
  'Other':        ['Break the task into 3 smaller steps','Research and plan before acting','Take action on the first step','Review your progress today','Celebrate a small win','Remove one distraction'],
};

const getSuggestions = (category) =>
  (SUGGESTIONS[category] || SUGGESTIONS['Other']).map(title => ({ title, autoSuggested: true }));

const getActivities = async (req, res) => {
  try {
    const { goalId, status } = req.query;
    const filter = { user: req.user.id };
    if (goalId && goalId !== 'all') filter.goalId = goalId;
    if (status && status !== 'all')  filter.status = status;
    const activities = await Activity.find(filter)
      .populate('goalId', 'title category')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: activities });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch activities' });
  }
};

const getActivitySuggestions = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.goalId, user: req.user.id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    res.status(200).json({ success: true, data: getSuggestions(goal.category), goalTitle: goal.title });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get suggestions' });
  }
};

const createActivity = async (req, res) => {
  try {
    const { title, description, priority, dueDate, goalId, subGoalId, autoSuggested } = req.body;
    if (!title?.trim())
      return res.status(400).json({ success: false, message: 'Title is required' });
    let goalTitle = '';
    if (goalId) {
      const goal = await Goal.findById(goalId).select('title');
      goalTitle = goal?.title || '';
    }
    const activity = await Activity.create({
      user: req.user.id, title, description: description || '',
      priority: priority || 'Medium', dueDate: dueDate || null,
      goalId: goalId || null, subGoalId: subGoalId || null,
      goalTitle, autoSuggested: autoSuggested || false,
    });
    res.status(201).json({ success: true, message: 'Activity created!', data: activity });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create activity' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['todo','inprogress','done'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });
    const activity = await Activity.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { status }, { new: true }
    ).populate('goalId', 'title category');
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    // Award XP when marked done
    if (status === 'done') {
      awardXP(req.user.id, 'activity_done', `Activity "${activity.title}" completed! ✅`).catch(console.error);
    }
    res.status(200).json({ success: true, message: 'Status updated!', data: activity });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

const addToHabit = async (req, res) => {
  try {
    const { reminderTime, frequency } = req.body;
    const activity = await Activity.findOne({ _id: req.params.id, user: req.user.id });
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    if (activity.addedToHabit)
      return res.status(400).json({ success: false, message: 'Already added to habits!' });
    const habit = await Habit.create({
      user: req.user.id, name: activity.title,
      days: Array(21).fill(false),
      reminderTime: reminderTime || null,
      frequency: frequency || 'daily',
      fromActivity: activity._id,
      fromGoal: activity.goalTitle || '',
    });
    activity.addedToHabit = true;
    activity.habitId = habit._id;
    await activity.save();
    res.status(201).json({ success: true, message: `✅ "${activity.title}" added as a daily habit!`, data: { activity, habit } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add to habits' });
  }
};

const addToAchievement = async (req, res) => {
  try {
    const { description } = req.body;
    const activity = await Activity.findOne({ _id: req.params.id, user: req.user.id });
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    if (activity.status !== 'done')
      return res.status(400).json({ success: false, message: 'Mark activity as Done first!' });
    if (activity.addedToAchievement)
      return res.status(400).json({ success: false, message: 'Already added as achievement!' });
    await Achievement.create({
      user: req.user.id,
      title: activity.title,
      description: description || `Completed: ${activity.title}${activity.goalTitle ? ` (Goal: ${activity.goalTitle})` : ''}`,
      type: 'Performance', date: new Date(),
      linkedGoal: activity.goalId || null,
      autoGenerated: false, progress: 100,
    });
    activity.addedToAchievement = true;
    await activity.save();
    // Award XP for achievement
    awardXP(req.user.id, 'achievement', `Achievement unlocked: "${activity.title}" 🏆`).catch(console.error);
    res.status(201).json({ success: true, message: `🏆 "${activity.title}" added as an Achievement!`, data: activity });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create achievement' });
  }
};

const deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    res.status(200).json({ success: true, message: 'Activity deleted!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete activity' });
  }
};

module.exports = {
  getActivities, getActivitySuggestions, createActivity,
  updateStatus, addToHabit, addToAchievement, deleteActivity,
};