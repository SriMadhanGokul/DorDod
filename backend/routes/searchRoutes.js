const express = require("express");
const router = express.Router();
const { globalSearch } = require("../controllers/searchController");
const protect = require("../utils/protect");
router.use(protect);
router.get("/", globalSearch);
module.exports = router;
