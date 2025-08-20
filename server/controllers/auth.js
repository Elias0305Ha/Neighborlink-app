const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper function to generate a JWT token for a user
function generateToken(user) {
  return jwt.sign(
    { userId: user._id }, // Payload: just the user's ID
    process.env.JWT_SECRET, // Secret key from .env
    { expiresIn: '7d' } // Token is valid for 7 days
  );
}

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, zipCode } = req.body;

    // Create user in the database
    const user = await User.create({
      name,
      email,
      password,
      zipCode,
    });

    const token = generateToken(user);

    // For now, we'll just send a success message.
    // We will add JWT token generation in the next step.
    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      token,
      data: { userId: user._id, name: user.name }
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Login a user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {  try {
    const { email, password } = req.body;

    // 1. Check if the user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials (user not found)' });
    }

    // 2. Compare the password
    const isMatch = await require('bcryptjs').compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials (wrong password)' });
    }

    const token = generateToken(user);

    // 3. Respond with success (we'll add JWT soon)
    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      data: { userId: user._id, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}; 