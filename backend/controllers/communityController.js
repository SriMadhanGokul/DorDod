const Post = require("../models/Post");

// @route GET /api/community
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name avatar firstName lastName")
      .populate("comments.user", "name avatar")
      .sort({ createdAt: -1 })
      .limit(50);

    const formatted = posts.map((p) => ({
      _id: p._id,
      author: p.user?.name || "Unknown",
      avatar: p.user?.name?.substring(0, 2).toUpperCase() || "U",
      userId: p.user?._id,
      content: p.content,
      tags: p.tags,
      likes: p.likes.length,
      liked: p.likes.map((id) => id.toString()).includes(req.user.id),
      comments: p.comments.map((c) => ({
        _id: c._id,
        author: c.user?.name || "Unknown",
        content: c.content,
        time: c.createdAt,
      })),
      time: p.createdAt,
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error("getPosts error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch posts" });
  }
};

// @route POST /api/community
const createPost = async (req, res) => {
  try {
    const { content, tags } = req.body;
    if (!content?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Content is required" });

    const post = await Post.create({
      user: req.user.id,
      content,
      tags: tags || ["General"],
    });
    await post.populate("user", "name avatar");

    res.status(201).json({
      success: true,
      message: "Post shared!",
      data: {
        _id: post._id,
        author: post.user?.name,
        avatar: post.user?.name?.substring(0, 2).toUpperCase(),
        userId: post.user?._id,
        content: post.content,
        tags: post.tags,
        likes: 0,
        liked: false,
        comments: [],
        time: post.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create post" });
  }
};

// @route PATCH /api/community/:id/like
const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const uid = req.user.id;
    const liked = post.likes.map((id) => id.toString()).includes(uid);

    if (liked) post.likes = post.likes.filter((id) => id.toString() !== uid);
    else post.likes.push(uid);

    await post.save();
    res
      .status(200)
      .json({
        success: true,
        data: { likes: post.likes.length, liked: !liked },
      });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to toggle like" });
  }
};

// @route POST /api/community/:id/comments
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Comment cannot be empty" });

    const post = await Post.findById(req.params.id);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    post.comments.push({ user: req.user.id, content });
    await post.save();
    await post.populate("comments.user", "name");

    const newComment = post.comments[post.comments.length - 1];
    res.status(201).json({
      success: true,
      message: "Comment added!",
      data: {
        _id: newComment._id,
        author: req.user.name,
        content: newComment.content,
        time: newComment.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add comment" });
  }
};

// @route DELETE /api/community/:id
const deletePost = async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.user.id });
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    await post.deleteOne();
    res.status(200).json({ success: true, message: "Post deleted!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete post" });
  }
};

module.exports = { getPosts, createPost, toggleLike, addComment, deletePost };
