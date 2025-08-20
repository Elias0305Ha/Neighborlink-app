const express = require('express');
const router = express.Router();
const { createComment, getCommentsByPost, deleteComment } = require('../controllers/comments');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

// @route   POST /api/v1/comments
// @desc    Create a comment
// @access  Private
router.post('/', auth, createComment);

// @route   GET /api/v1/comments/post/:postId
// @desc    Get comments for a post
// @access  Public
router.get('/post/:postId', getCommentsByPost);

// @route   GET /api/v1/comments/user/:userId
// @desc    Get comments by user
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const comments = await Comment.find({ createdBy: req.params.userId })
      .populate('post', 'title')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: comments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/v1/comments/:id
// @desc    Delete a comment
// @access  Private
router.delete('/:id', auth, deleteComment);

module.exports = router; 