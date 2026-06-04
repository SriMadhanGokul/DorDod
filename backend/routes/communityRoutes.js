const express  = require('express');
const router   = express.Router();
const protect  = require('../utils/protect');
const { uploadMedia } = require('../utils/uploadMiddleware');
const { getPosts, createPost, editPost, deletePost, toggleLike, addComment, editComment, deleteComment } = require('../controllers/communityController');

router.use(protect);
router.get('/',                                    getPosts);
router.post('/',  uploadMedia.single('media'),     createPost);
router.put('/:id',                                 editPost);
router.delete('/:id',                              deletePost);
router.patch('/:id/like',                          toggleLike);
router.post('/:id/comments',                       addComment);
router.put('/:postId/comments/:commentId',         editComment);
router.delete('/:postId/comments/:commentId',      deleteComment);

module.exports = router;