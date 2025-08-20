const express = require('express');
const { register, login } = require('../controllers/auth');
const auth = require('../middleware/auth'); // Import the auth middleware
const User = require('../models/User'); // Import User model

const router = express.Router();

// Route for /api/v1/auth/register
router.post('/register', register);

// Route for /api/v1/auth/login
router.post('/login', login);

// Protected route: only logged-in users can access this
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('name email _id');
    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 