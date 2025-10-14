const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Booth = require('../models/Booth');
const Election = require('../models/Election');

const router = express.Router();

// @route   GET /api/voter/profile
// @desc    Get voter profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/voter/profile
// @desc    Update voter profile
// @access  Private
router.put('/profile', [
  auth,
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('branch').optional().isIn(['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Chemical', 'Biotechnology', 'Information Technology']).withMessage('Invalid branch'),
  body('year').optional().isInt({ min: 1, max: 4 }).withMessage('Year must be between 1 and 4')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, branch, year } = req.body;
    const updateFields = {};
    
    if (name) updateFields.name = name;
    if (branch) updateFields.branch = branch;
    if (year) updateFields.year = year;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/voter/booth
// @desc    Get assigned voting booth for current election
// @access  Private
router.get('/booth', auth, async (req, res) => {
  try {
    // Find active election
    const activeElection = await Election.findOne({ status: 'active' });
    if (!activeElection) {
      return res.status(404).json({ error: 'No active election found' });
    }

    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find booth assigned to user's branch and year
    const booth = await Booth.findOne({
      electionId: activeElection._id,
      assignedBranches: user.branch,
      assignedYears: user.year,
      isActive: true
    });

    if (!booth) {
      return res.status(404).json({ error: 'No booth assigned for your branch and year' });
    }

    res.json({
      booth,
      election: {
        title: activeElection.title,
        startDate: activeElection.startDate,
        endDate: activeElection.endDate
      }
    });
  } catch (error) {
    console.error('Get booth error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/voter/elections
// @desc    Get elections available for voter
// @access  Private
router.get('/elections', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const elections = await Election.find({
      $or: [
        { status: 'upcoming' },
        { status: 'active' }
      ],
      $and: [
        {
          $or: [
            { allowedBranches: { $size: 0 } }, // No restrictions
            { allowedBranches: user.branch }   // User's branch is allowed
          ]
        },
        {
          $or: [
            { allowedYears: { $size: 0 } },    // No restrictions
            { allowedYears: user.year }        // User's year is allowed
          ]
        }
      ],
      isPublic: true
    }).select('title description startDate endDate status positions allowedBranches allowedYears');

    res.json(elections);
  } catch (error) {
    console.error('Get elections error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/voter/elections/candidate-registration
// @desc    Get elections available for candidate registration
// @access  Private
router.get('/elections/candidate-registration', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get elections that are upcoming or active, and are open for candidate registration
    // More lenient filtering for candidate registration
    const elections = await Election.find({
      status: { $in: ['upcoming', 'active'] },
      isPublic: true,
      startDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Allow registration up to 24 hours before start
    }).select('title description startDate endDate status positions allowedBranches allowedYears');

    // Filter elections based on user eligibility
    const eligibleElections = elections.filter(election => {
      // If no branch restrictions or user's branch is allowed
      const branchEligible = election.allowedBranches.length === 0 || election.allowedBranches.includes(user.branch);
      // If no year restrictions or user's year is allowed
      const yearEligible = election.allowedYears.length === 0 || election.allowedYears.includes(user.year);
      
      return branchEligible && yearEligible;
    });

    res.json(eligibleElections);
  } catch (error) {
    console.error('Get candidate registration elections error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/voter/voting-status
// @desc    Check if voter has already voted in current election
// @access  Private
router.get('/voting-status', auth, async (req, res) => {
  try {
    const activeElection = await Election.findOne({ status: 'active' });
    if (!activeElection) {
      return res.status(404).json({ error: 'No active election found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      hasVoted: user.hasVoted,
      electionId: activeElection._id,
      electionTitle: activeElection.title
    });
  } catch (error) {
    console.error('Get voting status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/voter/request-booth-assignment
// @desc    Request booth assignment for current election
// @access  Private
router.post('/request-booth-assignment', auth, async (req, res) => {
  try {
    const activeElection = await Election.findOne({ status: 'active' });
    if (!activeElection) {
      return res.status(400).json({ error: 'No active election found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already assigned to a booth
    const existingBooth = await Booth.findOne({
      electionId: activeElection._id,
      'staffAssigned.userId': user._id
    });

    if (existingBooth) {
      return res.status(400).json({ error: 'You are already assigned to a booth' });
    }

    // Find available booth
    const booth = await Booth.findOne({
      electionId: activeElection._id,
      assignedBranches: user.branch,
      assignedYears: user.year,
      isActive: true,
      currentOccupancy: { $lt: '$capacity' }
    });

    if (!booth) {
      return res.status(404).json({ error: 'No available booth found for your branch and year' });
    }

    // Assign user to booth
    booth.staffAssigned.push({
      userId: user._id,
      role: 'assistant'
    });
    booth.currentOccupancy += 1;
    await booth.save();

    res.json({
      message: 'Booth assignment successful',
      booth: {
        name: booth.name,
        location: booth.location,
        role: 'assistant'
      }
    });
  } catch (error) {
    console.error('Booth assignment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
