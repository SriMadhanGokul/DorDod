const express = require("express");
const router = express.Router();
const protect = require("../utils/protect");

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

  // Only images and PDF
  const fileFilter = (req, file, cb) => {
    const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only images (JPG, PNG, GIF, WebP) and PDF files are allowed",
        ),
        false,
      );
    }
  };

  upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  });
} catch {
  console.warn("⚠️ multer not installed. Run: npm install multer");
  upload = { single: () => (req, res, next) => next() };
}

const {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
} = require("../controllers/documentController");

router.use(protect);
router.get("/", getDocuments);
router.post("/", upload.single("file"), createDocument);
router.put("/:id", updateDocument);
router.delete("/:id", deleteDocument);

module.exports = router;
