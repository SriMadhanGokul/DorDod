const express = require("express");
const router = express.Router();
const protect = require("../utils/protect");
const { uploadAvatar: uploadAvatarMw } = require("../utils/uploadMiddleware");

const {
  updateProfile,
  uploadAvatar,
  getProfileScore,
  updateNotifications,
  getProfessionalProfile,
  manageProfessionalSection,
  updateProfessionalItem,
  deleteProfessionalItem,
  manageWorkExperience,
  manageEducation,
  manageLanguages,
  manageCertifications,
  manageTechnicalSkills,
  manageFunctionalSkills,
  manageHonorsAwards,
} = require("../controllers/profileController");

router.use(protect);

// Personal
router.put("/", updateProfile);
router.post("/avatar", uploadAvatarMw.single("avatar"), uploadAvatar);
router.get("/score", getProfileScore);
router.put("/notifications", updateNotifications);

// Professional — GET
router.get("/professional", getProfessionalProfile);

// Professional — POST (add item to section)
router.post("/professional/work", (req, res) => {
  req.params.section = "work";
  manageWorkExperience(req, res);
});
router.post("/professional/education", (req, res) => {
  req.params.section = "education";
  manageEducation(req, res);
});
router.post("/professional/languages", (req, res) => {
  req.params.section = "languages";
  manageLanguages(req, res);
});
router.post("/professional/certifications", (req, res) => {
  req.params.section = "certifications";
  manageCertifications(req, res);
});
router.post("/professional/technical-skills", (req, res) => {
  req.params.section = "technical-skills";
  manageTechnicalSkills(req, res);
});
router.post("/professional/functional-skills", (req, res) => {
  req.params.section = "functional-skills";
  manageFunctionalSkills(req, res);
});
router.post("/professional/honors", (req, res) => {
  req.params.section = "honors";
  manageHonorsAwards(req, res);
});

// Professional — PUT (update item) — param is :itemId
router.put("/professional/work/:itemId", (req, res) => {
  req.params.section = "work";
  req.params.id = req.params.itemId;
  updateProfessionalItem(req, res);
});
router.put("/professional/education/:itemId", (req, res) => {
  req.params.section = "education";
  req.params.id = req.params.itemId;
  updateProfessionalItem(req, res);
});
router.put("/professional/languages/:itemId", (req, res) => {
  req.params.section = "languages";
  req.params.id = req.params.itemId;
  updateProfessionalItem(req, res);
});
router.put("/professional/certifications/:itemId", (req, res) => {
  req.params.section = "certifications";
  req.params.id = req.params.itemId;
  updateProfessionalItem(req, res);
});
router.put("/professional/technical-skills/:itemId", (req, res) => {
  req.params.section = "technical-skills";
  req.params.id = req.params.itemId;
  updateProfessionalItem(req, res);
});
router.put("/professional/functional-skills/:itemId", (req, res) => {
  req.params.section = "functional-skills";
  req.params.id = req.params.itemId;
  updateProfessionalItem(req, res);
});
router.put("/professional/honors/:itemId", (req, res) => {
  req.params.section = "honors";
  req.params.id = req.params.itemId;
  updateProfessionalItem(req, res);
});

// Professional — DELETE (delete item) — param is :itemId
router.delete("/professional/work/:itemId", (req, res) => {
  req.params.section = "work";
  req.params.id = req.params.itemId;
  deleteProfessionalItem(req, res);
});
router.delete("/professional/education/:itemId", (req, res) => {
  req.params.section = "education";
  req.params.id = req.params.itemId;
  deleteProfessionalItem(req, res);
});
router.delete("/professional/languages/:itemId", (req, res) => {
  req.params.section = "languages";
  req.params.id = req.params.itemId;
  deleteProfessionalItem(req, res);
});
router.delete("/professional/certifications/:itemId", (req, res) => {
  req.params.section = "certifications";
  req.params.id = req.params.itemId;
  deleteProfessionalItem(req, res);
});
router.delete("/professional/technical-skills/:itemId", (req, res) => {
  req.params.section = "technical-skills";
  req.params.id = req.params.itemId;
  deleteProfessionalItem(req, res);
});
router.delete("/professional/functional-skills/:itemId", (req, res) => {
  req.params.section = "functional-skills";
  req.params.id = req.params.itemId;
  deleteProfessionalItem(req, res);
});
router.delete("/professional/honors/:itemId", (req, res) => {
  req.params.section = "honors";
  req.params.id = req.params.itemId;
  deleteProfessionalItem(req, res);
});

module.exports = router;
