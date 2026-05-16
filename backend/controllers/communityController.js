const Post = require('../models/Post');
const path = require('path');
const fs   = require('fs');

const formatPost = (post, currentUserId) => {
  const currentUserIdStr = currentUserId?.toString() || '';
  return {
    _id:           post._id,
    author:        post.user?.name || 'Unknown',
    avatar:        post.user?.avatar || '',
    userId:        post.user?._id?.toString() || '',
    isOwner:       post.user?._id?.toString() === currentUserIdStr,  // ← definitive flag
    content:       post.content,
    tags:          post.tags,
    likes:         post.likes?.length || 0,
    liked:         post.likes?.some(id => id.toString() === currentUserIdStr) || false,
    comments:      (post.comments || []).map(c => ({
      _id:     c._id,
      content: c.content,
      author:  c.user?.name || 'Unknown',
      avatar:  c.user?.avatar || '',
      userId:  c.user?._id?.toString() || '',
      isOwner: c.user?._id?.toString() === currentUserIdStr,  // ← definitive flag
      isPostOwner: post.user?._id?.toString() === currentUserIdStr,
      edited:  c.edited || false,
      time:    c.createdAt,
    })),
    time:          post.createdAt,
    mediaType:     post.mediaType || 'none',
    mediaUrl:      post.mediaUrl || '',
    mediaFileName: post.mediaFileName || '',
    linkPreview:   post.linkPreview || {},
  };
};

const getPosts = async (req, res) => {
  try {
    const { tag, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (tag && tag !== 'All') filter.tags = tag;
    const posts = await Post.find(filter)
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    res.status(200).json({ success: true, data: posts.map(p => formatPost(p, req.user.id)) });
  } catch (err) {
    console.error('getPosts:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
};

const createPost = async (req, res) => {
  try {
    const { content, tags, mediaUrl } = req.body;
    if (!content?.trim() && !req.file && !mediaUrl?.trim())
      return res.status(400).json({ success: false, message: 'Post must have text, media, or a link' });

    let finalMediaType = 'none';
    let finalMediaUrl  = '';
    let mediaFileName  = '';

    if (req.file) {
      const mime = req.file.mimetype;
      if (mime.startsWith('image/'))      finalMediaType = 'image';
      else if (mime.startsWith('video/')) finalMediaType = 'video';
      else                                finalMediaType = 'file';
      finalMediaUrl = `/uploads/community/${req.file.filename}`;
      mediaFileName = req.file.originalname;
    } else if (mediaUrl?.trim()) {
      finalMediaType = 'link';
      finalMediaUrl  = mediaUrl.trim();
    }

    const tagList = tags
      ? (Array.isArray(tags) ? tags : [tags])
      : ['General'];

    const post = await Post.create({
      user:      req.user.id,
      content:   content?.trim() || '',
      tags:      tagList,
      mediaType: finalMediaType,
      mediaUrl:  finalMediaUrl,
      mediaFileName,
      linkPreview: finalMediaType === 'link' ? { url: finalMediaUrl } : {},
    });

    await post.populate('user', 'name avatar');
    res.status(201).json({ success: true, message: 'Post shared!', data: formatPost(post, req.user.id) });
  } catch (err) {
    console.error('createPost:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create post' });
  }
};

const editPost = async (req, res) => {
  try {
    const { content, tags } = req.body;
    const post = await Post.findOne({ _id: req.params.id, user: req.user.id });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found or not yours' });
    if (content !== undefined) post.content = content.trim();
    if (tags) post.tags = Array.isArray(tags) ? tags : [tags];
    await post.save();
    await post.populate('user', 'name avatar');
    await post.populate('comments.user', 'name avatar');
    res.status(200).json({ success: true, message: 'Post updated!', data: formatPost(post, req.user.id) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update post' });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found or not yours' });
    if (post.mediaUrl?.startsWith('/uploads/')) {
      const fullPath = path.join(__dirname, '..', post.mediaUrl);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }
    res.status(200).json({ success: true, message: 'Post deleted!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
};

const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    const idx = post.likes.indexOf(req.user.id);
    if (idx > -1) post.likes.splice(idx, 1);
    else          post.likes.push(req.user.id);
    await post.save();
    res.status(200).json({ success: true, data: formatPost(post, req.user.id) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed' });
  }
};

const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
    const post = await Post.findById(req.params.id)
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    post.comments.push({ user: req.user.id, content: content.trim(), edited: false });
    await post.save();
    await post.populate('comments.user', 'name avatar');
    const newC = post.comments[post.comments.length - 1];
    res.status(201).json({
      success: true,
      data: {
        _id:         newC._id,
        content:     newC.content,
        author:      newC.user?.name || 'You',
        avatar:      newC.user?.avatar || '',
        userId:      req.user.id,
        isOwner:     true,
        isPostOwner: post.user?._id?.toString() === req.user.id?.toString(),
        edited:      false,
        time:        newC.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};

const editComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
    const post = await Post.findById(req.params.postId)
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.user._id.toString() !== req.user.id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized to edit this comment' });
    comment.content = content.trim();
    comment.edited  = true;
    post.markModified('comments');
    await post.save();
    res.status(200).json({
      success: true,
      message: 'Comment updated!',
      data: {
        _id:     comment._id,
        content: comment.content,
        author:  comment.user?.name || 'You',
        userId:  req.user.id,
        isOwner: true,
        edited:  true,
        time:    comment.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to edit comment' });
  }
};

const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.user.toString() !== req.user.id && post.user.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' });
    post.comments = post.comments.filter(c => c._id.toString() !== req.params.commentId);
    await post.save();
    res.status(200).json({ success: true, message: 'Comment deleted!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
};

module.exports = { getPosts, createPost, editPost, deletePost, toggleLike, addComment, editComment, deleteComment };