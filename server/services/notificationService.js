const Notification = require('../models/Notification');

// Create a notification and emit it via Socket.IO
const createNotification = async (notificationData, io, userConnections) => {
  try {
    // Create the notification in the database
    const notification = await Notification.create(notificationData);
    
    // Populate the notification with user and post info
    await notification.populate('sender', 'name profilePicture');
    await notification.populate('post', 'title');
    
    // Emit real-time notification to the recipient
    if (io && userConnections) {
      const recipientSocketId = userConnections.get(notification.recipient.toString());
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('new-notification', notification);
        console.log('Real-time notification sent to user:', notification.recipient);
      }
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Notification for when someone claims a request
const notifyAssignmentClaimed = async (assignment, io, userConnections) => {
  const notificationData = {
    recipient: assignment.post.createdBy,
    sender: assignment.helper,
    type: 'assignment_claimed',
    post: assignment.post._id,
    assignment: assignment._id,
    message: `${assignment.helper.name} has claimed your request "${assignment.post.title}"`,
    data: {
      assignmentId: assignment._id,
      postId: assignment.post._id,
      helperName: assignment.helper.name
    }
  };
  
  return await createNotification(notificationData, io, userConnections);
};

// Notification for when a claim is approved
const notifyAssignmentApproved = async (assignment, io, userConnections) => {
  const notificationData = {
    recipient: assignment.helper,
    sender: assignment.post.createdBy,
    type: 'assignment_approved',
    post: assignment.post._id,
    assignment: assignment._id,
    message: `Your claim for "${assignment.post.title}" has been approved!`,
    data: {
      assignmentId: assignment._id,
      postId: assignment.post._id,
      postTitle: assignment.post.title
    }
  };
  
  return await createNotification(notificationData, io, userConnections);
};

// Notification for when a claim is rejected
const notifyAssignmentRejected = async (assignment, io, userConnections) => {
  const notificationData = {
    recipient: assignment.helper,
    sender: assignment.post.createdBy,
    type: 'assignment_rejected',
    post: assignment.post._id,
    assignment: assignment._id,
    message: `Your claim for "${assignment.post.title}" was not approved.`,
    data: {
      assignmentId: assignment._id,
      postId: assignment.post._id,
      postTitle: assignment.post.title
    }
  };
  
  return await createNotification(notificationData, io, userConnections);
};

// Notification for when assignment status changes
const notifyAssignmentStatusChanged = async (assignment, oldStatus, newStatus, io, userConnections) => {
  const statusMessages = {
    'in_progress': 'has started working on',
    'completed': 'has completed',
    'cancelled': 'has cancelled'
  };
  
  const message = statusMessages[newStatus];
  if (!message) return null;
  
  const notificationData = {
    recipient: assignment.post.createdBy,
    sender: assignment.helper,
    type: 'assignment_status_changed',
    post: assignment.post._id,
    assignment: assignment._id,
    message: `${assignment.helper.name} ${message} your request "${assignment.post.title}"`,
    data: {
      assignmentId: assignment._id,
      postId: assignment.post._id,
      oldStatus,
      newStatus,
      helperName: assignment.helper.name
    }
  };
  
  return await createNotification(notificationData, io, userConnections);
};

// Notification for new comments
const notifyNewComment = async (comment, io, userConnections) => {
  // Don't notify if user is commenting on their own post
  if (comment.post.createdBy.toString() === comment.createdBy.toString()) {
    return null;
  }
  
  const notificationData = {
    recipient: comment.post.createdBy,
    sender: comment.createdBy,
    type: 'new_comment',
    post: comment.post._id,
    comment: comment._id,
    message: `${comment.createdBy.name} commented on your post "${comment.post.title}"`,
    data: {
      commentId: comment._id,
      postId: comment.post._id,
      commentContent: comment.content.substring(0, 100) // First 100 chars
    }
  };
  
  return await createNotification(notificationData, io, userConnections);
};

// Notification for new chat messages
const notifyNewMessage = async (recipientId, assignmentId, message, io, userConnections) => {
  // Always create a notification for chat messages
  // This ensures consistency and proper tracking
  const notificationData = {
    recipient: recipientId,
    sender: message.sender._id || message.sender,
    type: 'new_message',
    assignment: assignmentId,
    message: `You have a new message from ${message.sender.name || 'someone'}`,
    data: {
      assignmentId: assignmentId,
      messageId: message._id,
      senderName: message.sender.name || 'Someone'
    }
  };
  
  // Create the notification and emit real-time update
  return await createNotification(notificationData, io, userConnections);
};

module.exports = {
  createNotification,
  notifyAssignmentClaimed,
  notifyAssignmentApproved,
  notifyAssignmentRejected,
  notifyAssignmentStatusChanged,
  notifyNewComment,
  notifyNewMessage
};
