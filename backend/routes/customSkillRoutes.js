const express = require('express');
const router  = express.Router();
const {
  getCustomSkills, createCustomSkill, updateCustomSkill,
  deleteCustomSkill, addTagToGoal,
} = require('../controllers/customSkillController');
const protect = require('../utils/protect');

router.use(protect);

router.get('/',    getCustomSkills);
router.post('/',   createCustomSkill);
router.put('/:id', updateCustomSkill);
router.delete('/:id', deleteCustomSkill);

// Add a specific "want to learn" tag as a goal
router.post('/:skillId/tags/:tagId/add-goal', addTagToGoal);

module.exports = router;