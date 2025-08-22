const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
  },
  type: {
    type: String,
    enum: ['request', 'offer'], // Only allow these two values
    required: [true, 'Please specify if this is a request or offer'],
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed', 'cancelled'],
    default: 'open',
  },
  category: {
    type: String,
    default: 'general',
  },
  location: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  coordinates: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields automatically
});

// Virtual for assignments
PostSchema.virtual('assignments', {
  ref: 'Assignment',
  localField: '_id',
  foreignField: 'post'
});

// Ensure virtual fields are serialized
PostSchema.set('toJSON', { virtuals: true });
PostSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Post', PostSchema); 