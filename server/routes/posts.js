const express = require('express');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

// Create a new post (protected)
router.post('/', auth, (req, res, next) => {
  const upload = req.app.get('upload');
  upload.single('image')(req, res, next);
}, async (req, res) => {
  try {
    const { title, description, type, category, location } = req.body;
    
    // Get the uploaded file path if image was uploaded
    const image = req.file ? `/uploads/${req.file.filename}` : '';
    
    const post = await Post.create({
      title,
      description,
      type,
      category,
      location,
      image,
      createdBy: req.user.userId, // Set the user from the token
    });
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get all posts (public)
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('createdBy', 'name email profilePicture')
      .populate({
        path: 'assignments',
        match: { status: { $in: ['pending', 'approved', 'in_progress'] } },
        populate: { path: 'helper', select: 'name profilePicture' }
      });
    res.json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get posts by user
router.get('/user/:userId', async (req, res) => {
  try {
    const posts = await Post.find({ createdBy: req.params.userId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get a single post by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId)
      .populate('createdBy', 'name email')
      .populate({
        path: 'assignments',
        match: { status: { $in: ['pending', 'approved', 'in_progress'] } },
        populate: { path: 'helper', select: 'name profilePicture' }
      });
    
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }
    
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update a post (protected - only post owner can edit)
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, type, category, location } = req.body;
    const postId = req.params.id;
    
    // Find the post and check if it exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }
    
    // Check if the current user is the post owner
    if (post.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only edit your own posts' 
      });
    }
    
    // Update the post
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { title, description, type, category, location },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');
    
    res.json({ success: true, data: updatedPost });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete a post (protected - only post owner can delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const postId = req.params.id;
    
    // Find the post and check if it exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }
    
    // Check if the current user is the post owner
    if (post.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only delete your own posts' 
      });
    }
    
    // Delete the post
    await Post.findByIdAndDelete(postId);
    
    res.json({ 
      success: true, 
      message: 'Post deleted successfully' 
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router; 