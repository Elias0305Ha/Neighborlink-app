const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: [
      'assignment_claimed',      // Someone claimed your request
      'assignment_approved',     // Your claim was approved
      'assignment_rejected',     // Your claim was rejected
      'assignment_status_changed', // Assignment status updated
      'new_comment',            // Someone commented on your post
      'assignment_completed',    // Assignment marked as completed
      'assignment_cancelled',   // Assignment was cancelled
      'new_message'             // New chat message received
    ],
    required: true,
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: function() {
      // Post is only required for non-chat notifications
      return this.type !== 'new_message';
    },
  },
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  }
}, {
  timestamps: true,
});

// Index for efficient queries
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, type: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
