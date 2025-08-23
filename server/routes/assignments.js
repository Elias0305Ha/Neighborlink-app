const express = require('express');
const Assignment = require('../models/Assignment');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const { 
  notifyAssignmentClaimed, 
  notifyAssignmentApproved, 
  notifyAssignmentRejected,
  notifyAssignmentStatusChanged 
} = require('../services/notificationService');

const router = express.Router();

// Get all assignments (for debugging/testing)
router.get('/', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Assignments endpoint working!',
      routes: ['POST /', 'GET /post/:postId', 'GET /helper/:userId']
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Claim a request (create assignment)
router.post('/', auth, async (req, res) => {
  try {
    const { postId, message } = req.body;
    
    // Check if post exists and is a request
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }
    
    if (post.type !== 'request') {
      return res.status(400).json({ 
        success: false, 
        message: 'You can only claim requests, not offers' 
      });
    }
    
    if (post.status !== 'open') {
      return res.status(400).json({ 
        success: false, 
        message: 'This request is no longer open for claims' 
      });
    }
    
    // Check if user is trying to claim their own request
    if (post.createdBy.toString() === req.user.userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot claim your own request' 
      });
    }
    
    // Check if there's already an active assignment for this post
    const existingAssignment = await Assignment.findOne({
      post: postId,
      status: { $in: ['pending', 'approved', 'in_progress'] }
    });
    
    if (existingAssignment) {
      return res.status(400).json({ 
        success: false, 
        message: 'This request already has an active assignment' 
      });
    }
    
    // Create the assignment
    const assignment = await Assignment.create({
      post: postId,
      helper: req.user.userId,
      message,
      status: 'pending'
    });
    
    // Populate the helper info for the response
    await assignment.populate('helper', 'name profilePicture');
    
    // Create notification for the post owner
    const io = req.app.get('io');
    const userConnections = req.app.get('userConnections');
    await notifyAssignmentClaimed(assignment, io, userConnections);
    
    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get assignments for a specific post
router.get('/post/:postId', async (req, res) => {
  try {
    const assignments = await Assignment.find({ post: req.params.postId })
      .populate('helper', 'name profilePicture')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get assignments for a specific user (as helper)
router.get('/helper/:userId', async (req, res) => {
  try {
    const assignments = await Assignment.find({ helper: req.params.userId })
      .populate('post', 'title description type status')
      .populate('helper', 'name profilePicture')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Approve/reject a claim (post owner only)
router.put('/:id/approve', auth, async (req, res) => {
  try {
    const { approved } = req.body;
    const assignmentId = req.params.id;
    
    const assignment = await Assignment.findById(assignmentId).populate('post');
    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment not found' 
      });
    }
    
    // Check if current user is the post owner
    if (assignment.post.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only the post owner can approve claims' 
      });
    }
    
    if (assignment.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Assignment is not in pending status' 
      });
    }
    
    if (approved) {
      // Approve the claim
      assignment.status = 'approved';
      assignment.post.status = 'in_progress';
      
      // Update both the assignment and the post
      await assignment.save();
      await assignment.post.save();
      
      // Create notification for the helper
      const io = req.app.get('io');
      const userConnections = req.app.get('userConnections');
      await notifyAssignmentApproved(assignment, io, userConnections);
      
      res.json({ success: true, data: assignment });
    } else {
      // Reject the claim
      await Assignment.findByIdAndDelete(assignmentId);
      
      // Create notification for the helper
      const io = req.app.get('io');
      const userConnections = req.app.get('userConnections');
      await notifyAssignmentRejected(assignment, io, userConnections);
      
      res.json({ 
        success: true, 
        message: 'Claim rejected successfully' 
      });
    }
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update assignment status (helper or post owner)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const assignmentId = req.params.id;
    
    const assignment = await Assignment.findById(assignmentId).populate('post');
    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment not found' 
      });
    }
    
    // Check if user is either the helper or the post owner
    if (assignment.helper.toString() !== req.user.userId && 
        assignment.post.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only update assignments you are involved in' 
      });
    }
    
    // Validate status transitions
    const validTransitions = {
      'approved': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };
    
    if (!validTransitions[assignment.status].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot transition from ${assignment.status} to ${status}` 
      });
    }
    
    // Update assignment status
    assignment.status = status;
    
    // Handle special cases
    if (status === 'in_progress') {
      assignment.startedAt = new Date();
    } else if (status === 'completed') {
      assignment.completedAt = new Date();
      assignment.post.status = 'completed';
      await assignment.post.save();
    } else if (status === 'cancelled') {
      assignment.post.status = 'open';
      await assignment.post.save();
    }
    
    await assignment.save();
    
    // Create notification for status changes
    const io = req.app.get('io');
    const userConnections = req.app.get('userConnections');
    await notifyAssignmentStatusChanged(assignment, assignment.status, status, io, userConnections);
    
    res.json({ success: true, data: assignment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Add rating and review (post owner only)
router.put('/:id/review', auth, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const assignmentId = req.params.id;
    
    const assignment = await Assignment.findById(assignmentId).populate('post');
    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment not found' 
      });
    }
    
    // Check if current user is the post owner
    if (assignment.post.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only the post owner can add reviews' 
      });
    }
    
    if (assignment.status !== 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Can only review completed assignments' 
      });
    }
    
    // Update rating and review
    assignment.rating = rating;
    assignment.review = review;
    await assignment.save();
    
    res.json({ success: true, data: assignment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
