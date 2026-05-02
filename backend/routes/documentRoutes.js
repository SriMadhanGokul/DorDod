const express = require("express");
const router = express.Router();
const protect = require("../utils/protect");

// Safe multer import — won't crash server if not installed
let upload;
try {
  const multer = require("multer");
  const path = require("path");
  const fs = require("fs");
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, "..", "uploads", "documents");
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });
  upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = [
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".ppt",
        ".pptx",
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".mp4",
        ".mp3",
        ".zip",
        ".txt",
      ];
      const ext = require("path").extname(file.originalname).toLowerCase();
      cb(null, allowed.includes(ext));
    },
  });
} catch (err) {
  console.warn("⚠️  multer not installed. Run: npm install multer");
  upload = { single: () => (req, res, next) => next() };
}

const {
  getDocuments,
  createDocument,
  deleteDocument,
} = require("../controllers/documentController");

router.use(protect);
router.get("/", getDocuments);
router.post("/", upload.single("file"), createDocument);
router.delete("/:id", deleteDocument);

module.exports = router;
