const express = require("express");
const router = express.Router();
const {
  getPosts,
  createPost,
  toggleLike,
  addComment,
  deletePost,
} = require("../controllers/communityController");
const protect = require("../utils/protect");

router.use(protect);
router.route("/").get(getPosts).post(createPost);
router.patch("/:id/like", toggleLike);
router.post("/:id/comments", addComment);
router.delete("/:id", deletePost);

module.exports = router;
