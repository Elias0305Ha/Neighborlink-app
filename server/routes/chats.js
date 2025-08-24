const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');
const Assignment = require('../models/Assignment');
const { notifyNewMessage } = require('../services/notificationService');

// Get chat for an assignment
router.get('/assignment/:assignmentId', auth, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user.userId; // Changed from req.user.id to req.user.userId

    // Check if user is part of this assignment
    const assignment = await Assignment.findById(assignmentId)
      .populate({
        path: 'post',
        select: 'title description createdAt',
        populate: { path: 'createdBy', select: 'name profilePicture' }
      })
      .populate('helper', 'name profilePicture');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (!assignment.post || !assignment.post.createdBy || !assignment.helper) {
      console.error('Assignment missing required fields:', {
        hasPost: !!assignment.post,
        hasCreatedBy: !!assignment.post?.createdBy,
        hasHelper: !!assignment.helper
      });
      return res.status(400).json({ success: false, message: 'Assignment data incomplete' });
    }

    // Check if user is the post owner or the helper
    const postOwnerId = assignment.post.createdBy._id.toString();
    const helperId = assignment.helper._id.toString();
    
    if (userId !== postOwnerId && userId !== helperId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Find or create chat
    let chat = await Chat.findOne({ assignment: assignmentId })
      .populate('participants', 'name profilePicture')
      .populate('messages.sender', 'name profilePicture');

    if (!chat) {
      // Create new chat
      chat = new Chat({
        assignment: assignmentId,
        participants: [postOwnerId, helperId],
        messages: []
      });
      await chat.save();
      
      // Populate the new chat
      chat = await Chat.findById(chat._id)
        .populate('participants', 'name profilePicture')
        .populate('messages.sender', 'name profilePicture');
    }

    // Mark messages as read for current user
    await Chat.updateMany(
      { 
        _id: chat._id,
        'messages.sender': { $ne: userId },
        'messages.read': false
      },
      { $set: { 'messages.$.read': true } }
    );

    // Return chat with populated assignment data
    const responseData = {
      ...chat.toObject(),
      assignment: assignment // Include the full populated assignment
    };

    res.json({ success: true, data: responseData });
  } catch (err) {
    console.error('Error getting chat:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Send a message
router.post('/assignment/:assignmentId/message', auth, (req, res, next) => {
  const upload = req.app.get('upload');
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      console.log('Message route hit - assignmentId:', req.params.assignmentId);
      console.log('Request body:', req.body);
      console.log('User ID:', req.user.userId);
      
      const { assignmentId } = req.params;
      const { content, messageType = 'text' } = req.body;
      const userId = req.user.userId; // Changed from req.user.id to req.user.userId

      const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
      const fileName = req.file ? req.file.originalname : null;

      if (!content && !fileUrl) {
        return res.status(400).json({ success: false, message: 'Message content or file is required' });
      }

      // Check if user is part of this assignment
      console.log('Looking up assignment:', assignmentId);
      const assignment = await Assignment.findById(assignmentId)
        .populate({
          path: 'post',
          populate: { path: 'createdBy', select: '_id' }
        })
        .populate('helper', '_id');

      console.log('Found assignment:', assignment);

      if (!assignment) {
        return res.status(404).json({ success: false, message: 'Assignment not found' });
      }

      if (!assignment.post || !assignment.post.createdBy || !assignment.helper) {
        console.error('Assignment missing required fields:', {
          hasPost: !!assignment.post,
          hasCreatedBy: !!assignment.post?.createdBy,
          hasHelper: !!assignment.helper
        });
        return res.status(400).json({ success: false, message: 'Assignment data incomplete' });
      }

      const postOwnerId = assignment.post.createdBy._id.toString();
      const helperId = assignment.helper._id.toString();
      
      console.log('User IDs - postOwner:', postOwnerId, 'helper:', helperId, 'currentUser:', userId);
      
      if (userId !== postOwnerId && userId !== helperId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      // Find or create chat
      let chat = await Chat.findOne({ assignment: assignmentId });
      
      if (!chat) {
        chat = new Chat({
          assignment: assignmentId,
          participants: [postOwnerId, helperId],
          messages: []
        });
      }

      // Add message
      const message = {
        sender: userId,
        content: content || '',
        messageType: fileUrl ? 'image' : 'text',
        fileUrl,
        fileName,
        read: false
      };

      console.log('Adding message to chat:', message);
      chat.messages.push(message);
      chat.lastMessage = new Date();
      await chat.save();
      console.log('Chat saved successfully');

      // Populate the message for response
      const populatedChat = await Chat.findById(chat._id)
        .populate('participants', 'name profilePicture')
        .populate('messages.sender', 'name profilePicture');

      const newMessage = populatedChat.messages[populatedChat.messages.length - 1];

              // Send real-time notification to other participant
        const otherParticipantId = userId === postOwnerId ? helperId : postOwnerId;
        const io = req.app.get('io'); // Get io from app
        const userConnections = req.app.get('userConnections'); // Get userConnections from app
        
        // Send real-time message to other participant
        if (io) {
          const messageData = {
            assignmentId: assignmentId,
            message: newMessage
          };
          
          // Send message to all clients - this maintains real-time functionality
          // The duplication fix is on the client side, not here
          io.emit('new-message', messageData);
          console.log('Real-time message sent to all clients:', messageData);
        } else {
          console.log('Socket.IO not available for real-time messaging');
        }
        
        // Create notification for all users
        notifyNewMessage(otherParticipantId, assignmentId, newMessage, io, userConnections);

        res.json({ success: true, data: newMessage });
    } catch (err) {
      console.error('Error sending message:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });
});

// Mark messages as read
router.put('/assignment/:assignmentId/read', auth, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const userId = req.user.userId; // Changed from req.user.id to req.user.userId

    // Check if user is part of this assignment
    const assignment = await Assignment.findById(assignmentId)
      .populate('post.createdBy', '_id')
      .populate('helper', '_id');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const postOwnerId = assignment.post.createdBy._id.toString();
    const helperId = assignment.helper._id.toString();
    
    if (userId !== postOwnerId && userId !== helperId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Mark messages as read
    await Chat.updateMany(
      { 
        assignment: assignmentId,
        'messages.sender': { $ne: userId },
        'messages.read': false
      },
      { $set: { 'messages.$.read': true } }
    );

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (err) {
    console.error('Error marking messages as read:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user's active chats
router.get('/my-chats', auth, async (req, res) => {
  try {
    const userId = req.user.userId; // Changed from req.user.id to req.user.userId

    const chats = await Chat.find({
      participants: userId,
      isActive: true
    })
    .populate({
      path: 'assignment',
      populate: [
        { 
          path: 'post', 
          select: 'title description createdAt',
          populate: { path: 'createdBy', select: 'name profilePicture' }
        },
        { path: 'helper', select: 'name profilePicture' }
      ]
    })
    .populate('participants', 'name profilePicture')
    .sort({ lastMessage: -1 });

    console.log('Chats found:', chats.length);
    if (chats.length > 0) {
      console.log('First chat assignment data:', JSON.stringify(chats[0].assignment, null, 2));
    }

    res.json({ success: true, data: chats });
  } catch (err) {
    console.error('Error getting user chats:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
