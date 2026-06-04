// backend/utils/uploadMiddleware.js
// Uses multer memoryStorage so files go to Firebase, NOT local disk
const multer = require('multer');

const memoryStorage = multer.memoryStorage();

// Generic upload middleware factory
const createUpload = (allowedTypes = null, maxSizeMB = 20) => {
  return multer({
    storage: memoryStorage,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!allowedTypes) return cb(null, true);
      const ext = require('path').extname(file.originalname).toLowerCase();
      if (allowedTypes.includes(ext)) cb(null, true);
      else cb(new Error(`File type ${ext} not allowed`), false);
    },
  });
};

// For profile pictures: images only, 5MB max
const uploadAvatar = createUpload(
  ['.jpg','.jpeg','.png','.gif','.webp'], 5
);

// For documents: images + PDF + video, 50MB max
const uploadDocument = createUpload(
  ['.jpg','.jpeg','.png','.gif','.webp','.pdf','.mp4','.mov','.avi','.webm'], 50
);

// For community posts: images + video + PDF, 50MB max
const uploadMedia = createUpload(
  ['.jpg','.jpeg','.png','.gif','.webp','.mp4','.mov','.avi','.webm','.pdf'], 50
);

module.exports = { uploadAvatar, uploadDocument, uploadMedia };