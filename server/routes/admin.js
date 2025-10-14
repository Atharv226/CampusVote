const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');

// Import socket functions with fallback
let emitElectionStatusChange, emitCandidateApproved;
try {
  const socketConfig = require('../socket/socketConfig');
  emitElectionStatusChange = socketConfig.emitElectionStatusChange || (() => console.log('Socket not available for status change'));
  emitCandidateApproved = socketConfig.emitCandidateApproved || (() => console.log('Socket not available for candidate approval'));
} catch (error) {
  console.warn('Failed to import socket configuration:', error.message);
  emitElectionStatusChange = () => console.log('Socket not available for status change');
  emitCandidateApproved = () => console.log('Socket not available for candidate approval');
}

const router = express.Router();

// @route   GET /api/admin/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/users', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const users = await User.find().select('-password -otp -otpExpiry');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/admin/users/:id/approve
// @desc    Approve a user (admin only)
// @access  Private/Admin
router.post('/users/:id/approve', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select('-password -otp -otpExpiry');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User approved successfully', user });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/elections/public
// @desc    Get all public elections (no auth required)
// @access  Public
router.get('/elections/public', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { isPublic: true };
    if (status) filter.status = status;

    // Only return elections that are not in draft status
    if (!status) {
      filter.status = { $ne: 'draft' };
    }

    const elections = await Election.find(filter)
      .select('-createdBy -updatedBy -__v')
      .sort({ startDate: -1 });
    
    res.json(elections);
  } catch (error) {
    console.error('Get public elections error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// =============== Additional Admin Endpoints ===============

// @route   GET /api/admin/elections
// @desc    Get all elections (admin only)
// @access  Private/Admin
router.get('/elections', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const elections = await Election.find(filter).sort({ startDate: -1 });
    res.json(elections);
  } catch (error) {
    console.error('Get elections error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/candidates
// @desc    Get candidates, optionally filtered by electionId (admin only)
// @access  Private/Admin
router.get('/candidates', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { electionId, isApproved } = req.query;
    const filter = {};
    if (electionId) filter.electionId = electionId;
    if (typeof isApproved !== 'undefined') filter.isApproved = isApproved === 'true';

    const candidates = await Candidate.find(filter)
      .populate('userId', 'name email branch year')
      .populate('electionId', 'title status startDate endDate')
      .sort({ position: 1, createdAt: -1 });

    res.json(candidates);
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/admin/candidates/:id/approve
// @desc    Approve candidate (admin only)
// @access  Private/Admin
router.post('/candidates/:id/approve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, approvedBy: req.user.id, approvedAt: new Date() },
      { new: true }
    )
      .populate('userId', 'name email branch year')
      .populate('electionId', 'title');

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Emit real-time notification
    emitCandidateApproved(candidate);

    res.json({ message: 'Candidate approved successfully', candidate });
  } catch (error) {
    console.error('Approve candidate error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/admin/elections
// @desc    Create a new election (admin only)
// @access  Private/Admin
router.post('/elections', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const {
      title,
      description,
      startDate,
      endDate,
      positions,
      allowedBranches,
      allowedYears,
      isPublic
    } = req.body;

    // Set default values for branches and years if not provided or empty
    const defaultBranches = ['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Chemical', 'Biotechnology', 'Information Technology'];
    const defaultYears = [1, 2, 3, 4];
    
    const finalAllowedBranches = (allowedBranches && allowedBranches.length > 0) ? allowedBranches : defaultBranches;
    const finalAllowedYears = (allowedYears && allowedYears.length > 0) ? allowedYears : defaultYears;

    // Determine status based on start date
    const now = new Date();
    const start = new Date(startDate);
    let status = 'upcoming';
    
    if (start <= now) {
      status = 'active'; // If start date is now or in the past, make it active
    }
    
    const election = new Election({
      title,
      description,
      startDate,
      endDate,
      positions,
      allowedBranches: finalAllowedBranches,
      allowedYears: finalAllowedYears,
      isPublic: isPublic !== undefined ? isPublic : true,
      status, // Use calculated status
      createdBy: req.user.id
    });

    await election.save();
    res.status(201).json(election);
  } catch (error) {
    console.error('Create election error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors
      });
    }
    
    // Handle other mongoose errors
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Election with this title already exists' });
    }
    
    res.status(500).json({ 
      error: 'Server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/admin/elections/:id
// @desc    Update an election (admin only)
// @access  Private/Admin
router.put('/elections/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const {
      title,
      description,
      startDate,
      endDate,
      positions,
      allowedBranches,
      allowedYears,
      isPublic
    } = req.body;

    const election = await Election.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        startDate,
        endDate,
        positions,
        allowedBranches,
        allowedYears,
        isPublic,
        updatedBy: req.user.id,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    res.json(election);
  } catch (error) {
    console.error('Update election error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PATCH /api/admin/elections/:id/status
// @desc    Change election status (admin only)
// @access  Private/Admin
router.patch('/elections/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { status } = req.body;
    const electionId = req.params.id;
    
    console.log('Status change request:', { electionId, status, userId: req.user.id });
    
    // Validate election ID
    if (!electionId || electionId === 'undefined') {
      console.error('Invalid election ID:', electionId);
      return res.status(400).json({ error: 'Invalid election ID provided' });
    }
    
    // Validate status
    if (!['draft', 'upcoming', 'active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Find the election first to ensure it exists
    const existingElection = await Election.findById(electionId);
    if (!existingElection) {
      console.error('Election not found with ID:', electionId);
      return res.status(404).json({ error: 'Election not found' });
    }

    // Update the election status
    const election = await Election.findByIdAndUpdate(
      req.params.id,
      {
        status,
        updatedBy: req.user.id,
        updatedAt: Date.now()
      },
      { new: true }
    );

    console.log(`Election status updated: ${election.title} -> ${status}`);

    // Emit real-time notification for election status change with error handling
    try {
      emitElectionStatusChange(election);
      console.log('Socket notification sent successfully');
    } catch (socketError) {
      console.warn('Failed to emit socket notification:', socketError.message);
      // Don't fail the request if socket emission fails
    }

    res.json(election);
  } catch (error) {
    console.error('Update election status error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/admin/elections/:id
// @desc    Delete an election (admin only)
// @access  Private/Admin
router.delete('/elections/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const election = await Election.findById(req.params.id);
    
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    // Only allow deletion of draft or cancelled elections
    if (!['draft', 'cancelled'].includes(election.status)) {
      return res.status(400).json({ 
        error: 'Cannot delete an active or completed election. Change status to cancelled first.' 
      });
    }

    await Election.deleteOne({ _id: req.params.id });
    res.json({ message: 'Election deleted successfully' });
  } catch (error) {
    console.error('Delete election error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/candidates/:id
// @desc    Delete/reject a candidate (admin only)
// @access  Private/Admin
router.delete('/candidates/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const candidate = await Candidate.findById(req.params.id)
      .populate('userId', 'name email branch year')
      .populate('electionId', 'title');
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Store candidate info for response
    const candidateInfo = {
      name: candidate.userId?.name,
      position: candidate.position,
      election: candidate.electionId?.title
    };

    await Candidate.deleteOne({ _id: req.params.id });
    
    res.json({ 
      message: 'Candidate rejected and removed successfully', 
      candidate: candidateInfo 
    });
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
