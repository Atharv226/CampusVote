const jwt = require('jsonwebtoken');

const auth = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// Middleware to check if user is admin
const isAdmin = function(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

// Middleware to check if user is verified
const isVerified = function(req, res, next) {
  if (!req.user.isVerified) {
    return res.status(403).json({ error: 'Access denied. Please verify your email first.' });
  }
  next();
};

// Middleware to check if user hasn't voted yet
const hasNotVoted = function(req, res, next) {
  if (req.user.hasVoted) {
    return res.status(403).json({ error: 'You have already voted in this election.' });
  }
  next();
};

module.exports = auth;
module.exports.isAdmin = isAdmin;
module.exports.isVerified = isVerified;
module.exports.hasNotVoted = hasNotVoted;
