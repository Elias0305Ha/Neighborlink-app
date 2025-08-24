const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text',
  },
  fileUrl: {
    type: String,
    trim: true,
  },
  fileName: {
    type: String,
    trim: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const ChatSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
    unique: true, // One chat per assignment
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  messages: [MessageSchema],
  lastMessage: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
ChatSchema.index({ assignment: 1 });
ChatSchema.index({ participants: 1 });
ChatSchema.index({ lastMessage: -1 });

// Virtual for unread message count per user
ChatSchema.virtual('unreadCounts').get(function() {
  const counts = {};
  this.participants.forEach(participantId => {
    counts[participantId] = this.messages.filter(
      msg => !msg.read && msg.sender.toString() !== participantId.toString()
    ).length;
  });
  return counts;
});

// Ensure virtual fields are serialized
ChatSchema.set('toJSON', { virtuals: true });
ChatSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Chat', ChatSchema);
