const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const User = require('../models/User');
const auth = require('../middleware/auth');
// OTP functionality removed

// Configure multer for handling form data
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', upload.single('idImage'), async (req, res) => {
  try {
    const { name, rollNo, email, password, branch, year, studentId } = req.body;

    // Manual validation since express-validator doesn't work well with FormData
    const validationErrors = [];

    if (!name || name.trim().length < 2 || name.trim().length > 50) {
      validationErrors.push({ msg: 'Name must be between 2 and 50 characters' });
    }
    if (!rollNo || !rollNo.trim()) {
      validationErrors.push({ msg: 'Roll number is required' });
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      validationErrors.push({ msg: 'Please enter a valid email' });
    }
    if (!password || password.length < 6) {
      validationErrors.push({ msg: 'Password must be at least 6 characters' });
    }
    if (!['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Chemical', 'Biotechnology', 'Information Technology'].includes(branch)) {
      validationErrors.push({ msg: 'Invalid branch' });
    }
    if (!year || isNaN(year) || year < 1 || year > 4) {
      validationErrors.push({ msg: 'Year must be between 1 and 4' });
    }
    if (!studentId || !studentId.trim()) {
      validationErrors.push({ msg: 'Student ID is required' });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors[0].msg });
    }

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { rollNo }, { studentId }] });
    if (user) {
      return res.status(400).json({ 
        error: 'User already exists with this email, roll number, or student ID' 
      });
    }

    // Handle ID image
    let idImagePath = null;
    if (req.file) {
      // For now, we'll just store a placeholder since we're using memory storage
      idImagePath = 'placeholder_id_image.jpg';
    }

    // Create new user
    user = new User({
      name: name.trim(),
      rollNo: rollNo.trim(),
      email: email.toLowerCase().trim(),
      password,
      branch,
      year: parseInt(year),
      studentId: studentId.trim(),
      idImage: idImagePath
    });

    // Auto-verify user; OTP flow disabled
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: user.getPublicProfile(),
          message: 'Registration successful.'
        });
      }
    );

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check if user is approved
    if (!user.isApproved) {
      return res.status(400).json({ error: 'Account not yet approved by admin' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: user.getPublicProfile()
        });
      }
    );

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for email verification
// @access  Private
router.post('/verify-otp', auth, async (req, res) => {
  return res.status(400).json({ error: 'OTP verification is disabled.' });
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP for email verification
// @access  Private
router.post('/resend-otp', auth, async (req, res) => {
  return res.status(400).json({ error: 'OTP is disabled; resending is not available.' });
});

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
