const express = require("express");
const router = express.Router();
const {
  updateProfile,
  updateNotifications,
  getProfessionalProfile,
  manageWorkExperience,
  manageEducation,
  manageLanguages,
  manageCertifications,
  manageFunctionalSkills,
  manageTechnicalSkills,
  manageHonorsAwards,
} = require("../controllers/profileController");
const protect = require("../utils/protect");

router.use(protect);

router.put("/", updateProfile);
router.put("/notifications", updateNotifications);

// Professional profile
router.get("/professional", getProfessionalProfile);
router.route("/professional/work").post(manageWorkExperience);
router
  .route("/professional/work/:itemId")
  .put(manageWorkExperience)
  .delete(manageWorkExperience);
router.route("/professional/education").post(manageEducation);
router
  .route("/professional/education/:itemId")
  .put(manageEducation)
  .delete(manageEducation);
router.route("/professional/languages").post(manageLanguages);
router
  .route("/professional/languages/:itemId")
  .put(manageLanguages)
  .delete(manageLanguages);
router.route("/professional/certifications").post(manageCertifications);
router
  .route("/professional/certifications/:itemId")
  .put(manageCertifications)
  .delete(manageCertifications);
router.route("/professional/functional-skills").post(manageFunctionalSkills);
router
  .route("/professional/functional-skills/:itemId")
  .put(manageFunctionalSkills)
  .delete(manageFunctionalSkills);
router.route("/professional/technical-skills").post(manageTechnicalSkills);
router
  .route("/professional/technical-skills/:itemId")
  .put(manageTechnicalSkills)
  .delete(manageTechnicalSkills);
router.route("/professional/honors").post(manageHonorsAwards);
router
  .route("/professional/honors/:itemId")
  .put(manageHonorsAwards)
  .delete(manageHonorsAwards);

module.exports = router;
