const express = require('express');
const auth = require('../middleware/auth');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/analytics/overview
// @desc    Get overview analytics for all elections
// @access  Private/Admin
router.get('/overview', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const totalElections = await Election.countDocuments();
    const activeElections = await Election.countDocuments({ status: 'active' });
    const upcomingElections = await Election.countDocuments({ status: 'upcoming' });
    const completedElections = await Election.countDocuments({ status: 'completed' });
    
    const totalVoters = await User.countDocuments({ role: 'voter', isActive: true });
    const totalVotesCast = await Vote.countDocuments();
    
    // Calculate average turnout
    const electionsWithVotes = await Election.aggregate([
      { $match: { status: { $in: ['active', 'completed'] } } },
      { $lookup: { from: 'votes', localField: '_id', foreignField: 'electionId', as: 'votes' } },
      { $project: { 
        title: 1, 
        voteCount: { $size: '$votes' },
        allowedBranches: 1,
        allowedYears: 1
      }},
      { $lookup: { 
        from: 'users', 
        let: { branches: '$allowedBranches', years: '$allowedYears' },
        pipeline: [
          { $match: { 
            $and: [
              { role: 'voter' },
              { isActive: true },
              { $expr: { $in: ['$branch', '$$branches'] } },
              { $expr: { $in: ['$year', '$$years'] } }
            ]
          }}
        ],
        as: 'eligibleVoters'
      }},
      { $project: {
        title: 1,
        voteCount: 1,
        eligibleVoters: { $size: '$eligibleVoters' },
        turnout: { 
          $cond: { 
            if: { $gt: [{ $size: '$eligibleVoters' }, 0] },
            then: { $multiply: [{ $divide: ['$voteCount', { $size: '$eligibleVoters' }] }, 100] },
            else: 0
          }
        }
      }}
    ]);

    const averageTurnout = electionsWithVotes.length > 0 
      ? electionsWithVotes.reduce((sum, election) => sum + election.turnout, 0) / electionsWithVotes.length
      : 0;

    res.json({
      totalElections,
      activeElections,
      upcomingElections,
      completedElections,
      totalVoters,
      totalVotesCast,
      averageTurnout: Math.round(averageTurnout * 10) / 10
    });
  } catch (error) {
    console.error('Get overview analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/election/:electionId
// @desc    Get detailed analytics for a specific election
// @access  Private/Admin
router.get('/election/:electionId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const electionId = req.params.electionId;
    const election = await Election.findById(electionId);
    
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    // Get total votes for this election
    const totalVotes = await Vote.countDocuments({ electionId });

    // Get turnout by department/branch
    const turnoutByDepartment = await Vote.aggregate([
      { $match: { electionId: election._id } },
      { $lookup: { from: 'users', localField: 'voterId', foreignField: '_id', as: 'voter' } },
      { $unwind: '$voter' },
      { $group: { _id: '$voter.branch', count: { $sum: 1 } } },
      { $lookup: {
        from: 'users',
        let: { branch: '$_id' },
        pipeline: [
          { $match: { 
            $and: [
              { role: 'voter' },
              { isActive: true },
              { $expr: { $eq: ['$branch', '$$branch'] } },
              { $expr: { $in: ['$branch', election.allowedBranches] } },
              { $expr: { $in: ['$year', election.allowedYears] } }
            ]
          }}
        ],
        as: 'eligibleInBranch'
      }},
      { $project: {
        department: '$_id',
        votes: '$count',
        eligibleVoters: { $size: '$eligibleInBranch' },
        turnout: { 
          $cond: {
            if: { $gt: [{ $size: '$eligibleInBranch' }, 0] },
            then: { $multiply: [{ $divide: ['$count', { $size: '$eligibleInBranch' }] }, 100] },
            else: 0
          }
        }
      }},
      { $sort: { turnout: -1 } }
    ]);

    // Get turnout by year
    const turnoutByYear = await Vote.aggregate([
      { $match: { electionId: election._id } },
      { $lookup: { from: 'users', localField: 'voterId', foreignField: '_id', as: 'voter' } },
      { $unwind: '$voter' },
      { $group: { _id: '$voter.year', count: { $sum: 1 } } },
      { $lookup: {
        from: 'users',
        let: { year: '$_id' },
        pipeline: [
          { $match: { 
            $and: [
              { role: 'voter' },
              { isActive: true },
              { $expr: { $eq: ['$year', '$$year'] } },
              { $expr: { $in: ['$branch', election.allowedBranches] } },
              { $expr: { $in: ['$year', election.allowedYears] } }
            ]
          }}
        ],
        as: 'eligibleInYear'
      }},
      { $project: {
        year: { $concat: [{ $toString: '$_id' }, { $cond: { if: { $eq: ['$_id', 1] }, then: 'st Year', else: { $cond: { if: { $eq: ['$_id', 2] }, then: 'nd Year', else: { $cond: { if: { $eq: ['$_id', 3] }, then: 'rd Year', else: 'th Year' } } } } } }] },
        votes: '$count',
        eligibleVoters: { $size: '$eligibleInYear' },
        turnout: { 
          $cond: {
            if: { $gt: [{ $size: '$eligibleInYear' }, 0] },
            then: { $multiply: [{ $divide: ['$count', { $size: '$eligibleInYear' }] }, 100] },
            else: 0
          }
        }
      }},
      { $sort: { '_id': 1 } }
    ]);

    // Get voting patterns by hour
    const votingPatterns = await Vote.aggregate([
      { $match: { electionId: election._id } },
      { $project: {
        hour: { $hour: '$createdAt' },
        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
      }},
      { $group: { _id: '$hour', count: { $sum: 1 } } },
      { $project: {
        hour: { $concat: [
          { $cond: { if: { $eq: ['$_id', 0] }, then: '12', else: { $cond: { if: { $lte: ['$_id', 12] }, then: { $toString: '$_id' }, else: { $toString: { $subtract: ['$_id', 12] } } } } } },
          ':00 ',
          { $cond: { if: { $lt: ['$_id', 12] }, then: 'AM', else: 'PM' } }
        ] },
        votes: '$count'
      }},
      { $sort: { '_id': 1 } }
    ]);

    // Get candidate performance
    const candidatePerformance = await Vote.aggregate([
      { $match: { electionId: election._id } },
      { $group: { _id: { candidateId: '$candidateId', position: '$position' }, count: { $sum: 1 } } },
      { $lookup: { from: 'candidates', localField: '_id.candidateId', foreignField: '_id', as: 'candidate' } },
      { $unwind: '$candidate' },
      { $lookup: { from: 'users', localField: 'candidate.userId', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: {
        name: '$user.name',
        position: '$_id.position',
        votes: '$count',
        department: '$user.branch',
        year: { $concat: [{ $toString: '$user.year' }, { $cond: { if: { $eq: ['$user.year', 1] }, then: 'st Year', else: { $cond: { if: { $eq: ['$user.year', 2] }, then: 'nd Year', else: { $cond: { if: { $eq: ['$user.year', 3] }, then: 'rd Year', else: 'th Year' } } } } } }] }
      }},
      { $group: {
        _id: '$position',
        candidates: { $push: '$$ROOT' },
        totalVotes: { $sum: '$votes' }
      }},
      { $unwind: '$candidates' },
      { $project: {
        name: '$candidates.name',
        position: '$_id',
        votes: '$candidates.votes',
        percentage: { $multiply: [{ $divide: ['$candidates.votes', '$totalVotes'] }, 100] },
        department: '$candidates.department',
        year: '$candidates.year'
      }},
      { $sort: { position: 1, percentage: -1 } }
    ]);

    // Get demographics
    const demographics = await Vote.aggregate([
      { $match: { electionId: election._id } },
      { $lookup: { from: 'users', localField: 'voterId', foreignField: '_id', as: 'voter' } },
      { $unwind: '$voter' },
      { $facet: {
        byGender: [
          { $group: { _id: '$voter.gender', count: { $sum: 1 } } },
          { $project: { label: '$_id', count: '$count' } }
        ],
        byAge: [
          { $project: { age: { $subtract: [{ $year: new Date() }, { $add: [{ $multiply: ['$voter.year', -1] }, 22] }] } } },
          { $bucket: {
            groupBy: '$age',
            boundaries: [18, 20, 22, 24, 30],
            default: '24+',
            output: { count: { $sum: 1 } }
          }},
          { $project: {
            range: { $switch: {
              branches: [
                { case: { $eq: ['$_id', 18] }, then: '18-19' },
                { case: { $eq: ['$_id', 20] }, then: '20-21' },
                { case: { $eq: ['$_id', 22] }, then: '22-23' }
              ],
              default: '24+'
            }},
            count: '$count'
          }}
        ]
      }}
    ]);

    // Calculate percentages for demographics
    const genderStats = demographics[0].byGender.map(item => ({
      ...item,
      percentage: Math.round((item.count / totalVotes) * 1000) / 10
    }));

    const ageStats = demographics[0].byAge.map(item => ({
      ...item,
      percentage: Math.round((item.count / totalVotes) * 1000) / 10
    }));

    res.json({
      election: {
        id: election._id,
        title: election.title,
        status: election.status,
        startDate: election.startDate,
        endDate: election.endDate
      },
      overview: {
        totalVotes,
        totalCandidates: await Candidate.countDocuments({ electionId, isApproved: true }),
        eligibleVoters: await User.countDocuments({
          role: 'voter',
          isActive: true,
          branch: { $in: election.allowedBranches },
          year: { $in: election.allowedYears }
        })
      },
      turnoutByDepartment,
      turnoutByYear,
      votingPatterns: {
        peakHours: votingPatterns
      },
      candidatePerformance,
      demographics: {
        gender: genderStats,
        age: ageStats
      }
    });
  } catch (error) {
    console.error('Get election analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/live/:electionId
// @desc    Get real-time vote counts for an active election
// @access  Private
router.get('/live/:electionId', auth, async (req, res) => {
  try {
    const electionId = req.params.electionId;
    const election = await Election.findById(electionId);
    
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    // Get live vote counts by position and candidate
    const liveResults = await Vote.aggregate([
      { $match: { electionId: election._id } },
      { $group: { _id: { candidateId: '$candidateId', position: '$position' }, count: { $sum: 1 } } },
      { $lookup: { from: 'candidates', localField: '_id.candidateId', foreignField: '_id', as: 'candidate' } },
      { $unwind: '$candidate' },
      { $lookup: { from: 'users', localField: 'candidate.userId', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: {
        position: '$_id.position',
        candidateId: '$_id.candidateId',
        candidateName: '$user.name',
        votes: '$count'
      }},
      { $sort: { position: 1, votes: -1 } }
    ]);

    // Group by position
    const resultsByPosition = liveResults.reduce((acc, result) => {
      if (!acc[result.position]) {
        acc[result.position] = [];
      }
      acc[result.position].push({
        candidateId: result.candidateId,
        name: result.candidateName,
        votes: result.votes
      });
      return acc;
    }, {});

    // Get total votes and voter turnout
    const totalVotes = await Vote.countDocuments({ electionId });
    const eligibleVoters = await User.countDocuments({
      role: 'voter',
      isActive: true,
      branch: { $in: election.allowedBranches },
      year: { $in: election.allowedYears }
    });

    const turnoutPercentage = eligibleVoters > 0 ? Math.round((totalVotes / eligibleVoters) * 1000) / 10 : 0;

    res.json({
      election: {
        id: election._id,
        title: election.title,
        status: election.status
      },
      totalVotes,
      eligibleVoters,
      turnoutPercentage,
      results: resultsByPosition,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Get live analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/elections
// @desc    Get list of elections with basic analytics
// @access  Private
router.get('/elections', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    
    // Non-admin users can only see completed elections for results
    if (req.user.role !== 'admin') {
      filter.status = 'completed';
    } else if (status) {
      filter.status = status;
    }

    const elections = await Election.aggregate([
      { $match: filter },
      { $lookup: { from: 'votes', localField: '_id', foreignField: 'electionId', as: 'votes' } },
      { $lookup: { from: 'candidates', localField: '_id', foreignField: 'electionId', as: 'candidates' } },
      { $lookup: {
        from: 'users',
        let: { branches: '$allowedBranches', years: '$allowedYears' },
        pipeline: [
          { $match: {
            $and: [
              { role: 'voter' },
              { isActive: true },
              { $expr: { $in: ['$branch', '$$branches'] } },
              { $expr: { $in: ['$year', '$$years'] } }
            ]
          }}
        ],
        as: 'eligibleVoters'
      }},
      { $project: {
        title: 1,
        status: 1,
        startDate: 1,
        endDate: 1,
        totalVotes: { $size: '$votes' },
        totalCandidates: { $size: { $filter: { input: '$candidates', cond: { $eq: ['$$this.isApproved', true] } } } },
        eligibleVoters: { $size: '$eligibleVoters' },
        turnout: {
          $cond: {
            if: { $gt: [{ $size: '$eligibleVoters' }, 0] },
            then: { $multiply: [{ $divide: [{ $size: '$votes' }, { $size: '$eligibleVoters' }] }, 100] },
            else: 0
          }
        }
      }},
      { $sort: { startDate: -1 } }
    ]);

    res.json(elections);
  } catch (error) {
    console.error('Get elections analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;