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

module.exports = mongoose.model('Post', PostSchema); 