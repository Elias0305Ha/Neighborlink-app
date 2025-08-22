const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  helper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  message: {
    type: String,
    required: [true, 'Please provide a message explaining why you can help'],
    trim: true,
  },
  startedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  review: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Ensure only one active assignment per post
AssignmentSchema.index({ post: 1, status: 1 }, { 
  unique: true, 
  partialFilterExpression: { 
    status: { $in: ['pending', 'approved', 'in_progress'] } 
  } 
});

module.exports = mongoose.model('Assignment', AssignmentSchema);
