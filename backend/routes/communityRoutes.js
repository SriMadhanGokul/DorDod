const express = require('express');
const router  = express.Router();
const protect = require('../utils/protect');
const {
  getPosts, createPost, editPost, deletePost,
  toggleLike, addComment, editComment, deleteComment,
} = require('../controllers/communityController');

// Safe multer import
let uploadMedia;
try {
  const multer  = require('multer');
  const path    = require('path');
  const fs      = require('fs');
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '..', 'uploads', 'community');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname)}`);
    },
  });
  uploadMedia = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = ['.jpg','.jpeg','.png','.gif','.webp','.mp4','.mov','.avi','.webm','.pdf'];
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, allowed.includes(ext));
    },
  });
} catch {
  uploadMedia = { single: () => (req, res, next) => next() };
}

router.use(protect);
router.get('/',                                    getPosts);
router.post('/',    uploadMedia.single('media'),   createPost);
router.put('/:id',                                 editPost);
router.delete('/:id',                              deletePost);
router.patch('/:id/like',                          toggleLike);
router.post('/:id/comments',                       addComment);
router.put('/:postId/comments/:commentId',         editComment);
router.delete('/:postId/comments/:commentId',      deleteComment);

module.exports = router;