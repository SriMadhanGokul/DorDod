const express  = require('express');
const router   = express.Router();
const protect  = require('../utils/protect');
const { uploadAvatar: uploadAvatarMiddleware } = require('../utils/uploadMiddleware');
const {
  updateProfile, uploadAvatar, getProfileScore, updateNotifications,
  getProfessionalProfile, manageProfessionalSection, updateProfessionalItem, deleteProfessionalItem,
} = require('../controllers/profileController');

router.use(protect);

router.put('/',                                        updateProfile);
router.post('/avatar',    uploadAvatarMiddleware.single('avatar'), uploadAvatar);
router.get('/score',                                   getProfileScore);
router.put('/notifications',                           updateNotifications);
router.get('/professional',                            getProfessionalProfile);
router.post('/professional/:section',                  manageProfessionalSection);
router.put('/professional/:section/:itemId',           updateProfessionalItem);
router.delete('/professional/:section/:itemId',        deleteProfessionalItem);

module.exports = router;