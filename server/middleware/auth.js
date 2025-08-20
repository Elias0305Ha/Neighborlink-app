const jwt = require('jsonwebtoken');

// Middleware: Protect routes by requiring a valid JWT token
module.exports = function (req, res, next) {
  // 1. Get token from the Authorization header (format: 'Bearer <token>')
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided. Access denied.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 3. Attach user info to the request object
    req.user = { userId: decoded.userId };
    next(); // Let the request continue
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}; 