// backend/utils/uploadMiddleware.js
// Uses multer memoryStorage — files go to Cloudinary, NOT local disk
const multer = require("multer");

const memoryStorage = multer.memoryStorage();

const createUpload = (allowedTypes = null, maxSizeMB = 20) => {
  return multer({
    storage: memoryStorage,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!allowedTypes) return cb(null, true);
      const ext = require("path").extname(file.originalname).toLowerCase();
      if (allowedTypes.includes(ext)) cb(null, true);
      else cb(new Error(`File type ${ext} not allowed`), false);
    },
  });
};

// Profile pictures: images only, 5MB max
const uploadAvatar = createUpload(
  [".jpg", ".jpeg", ".png", ".gif", ".webp"],
  5,
);

// Documents: images + PDF only, 2MB max (client requirement)
const uploadDocument = createUpload(
  [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"],
  2,
);

// Community posts: images + video + PDF, 50MB max
const uploadMedia = createUpload(
  [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".mp4",
    ".mov",
    ".avi",
    ".webm",
    ".pdf",
  ],
  50,
);

module.exports = { uploadAvatar, uploadDocument, uploadMedia };
