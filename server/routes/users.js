const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

// Get user profile by ID
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get posts by user
router.get('/:userId/posts', async (req, res) => {
  try {
    const posts = await Post.find({ createdBy: req.params.userId })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get comments by user
router.get('/:userId/comments', async (req, res) => {
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

// Update user profile picture (protected - only user can update their own)
router.put('/:userId/profile-picture', auth, (req, res, next) => {
  const upload = req.app.get('upload');
  upload.single('image')(req, res, next);
}, async (req, res) => {
  try {
    // Check if user is updating their own profile
    if (req.params.userId !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only update your own profile' 
      });
    }

    // Get the uploaded file path if image was uploaded
    const profilePicture = req.file ? `/uploads/${req.file.filename}` : '';
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { profilePicture },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 