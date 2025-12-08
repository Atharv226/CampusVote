const jwt = require('jsonwebtoken');
const User = require('../server/models/User');

let io;

const initializeSocket = (server) => {
  const socketIo = require('socket.io')(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001', process.env.CLIENT_URL].filter(Boolean),
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  // Authentication middleware for Socket.IO
  socketIo.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.user.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  socketIo.on('connection', (socket) => {
    console.log(`User ${socket.user.name} connected with socket ID: ${socket.id}`);
    
    // Join user to their appropriate rooms
    socket.join(`user_${socket.user._id}`);
    socket.join(`role_${socket.user.role}`);
    
    // Join election-specific rooms for active/upcoming elections
    socket.on('join_election', (electionId) => {
      console.log(`User ${socket.user.name} joined election room: ${electionId}`);
      socket.join(`election_${electionId}`);
    });

    // Leave election room
    socket.on('leave_election', (electionId) => {
      console.log(`User ${socket.user.name} left election room: ${electionId}`);
      socket.leave(`election_${electionId}`);
    });

    // Handle voting updates (for admins monitoring live results)
    socket.on('subscribe_live_results', (electionId) => {
      if (socket.user.role === 'admin') {
        socket.join(`live_results_${electionId}`);
        console.log(`Admin ${socket.user.name} subscribed to live results for election: ${electionId}`);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.name} disconnected`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  io = socketIo;
  return socketIo;
};

// Emit vote cast event to relevant rooms
const emitVoteCast = (electionId, voteData) => {
  if (!io) return;
  
  // Emit to election room (for general updates)
  io.to(`election_${electionId}`).emit('vote_cast', {
    electionId,
    timestamp: new Date(),
    totalVotes: voteData.totalVotes,
    turnoutPercentage: voteData.turnoutPercentage
  });
  
  // Emit detailed results to admins
  io.to(`live_results_${electionId}`).emit('live_results_update', {
    electionId,
    results: voteData.results,
    totalVotes: voteData.totalVotes,
    turnoutPercentage: voteData.turnoutPercentage,
    lastUpdated: new Date()
  });
};

// Emit election status change
const emitElectionStatusChange = (election) => {
  if (!io) return;
  
  io.to(`election_${election._id}`).emit('election_status_changed', {
    electionId: election._id,
    title: election.title,
    newStatus: election.status,
    timestamp: new Date()
  });
  
  // Notify all admin users
  io.to('role_admin').emit('election_status_changed', {
    electionId: election._id,
    title: election.title,
    newStatus: election.status,
    timestamp: new Date()
  });
};

// Emit candidate approval notification
const emitCandidateApproved = (candidateData) => {
  if (!io) return;
  
  // Notify the candidate
  io.to(`user_${candidateData.userId._id}`).emit('candidate_approved', {
    candidateId: candidateData._id,
    electionTitle: candidateData.electionId.title,
    position: candidateData.position,
    timestamp: new Date()
  });
  
  // Notify election participants
  io.to(`election_${candidateData.electionId._id}`).emit('new_candidate_approved', {
    candidateId: candidateData._id,
    candidateName: candidateData.userId.name,
    position: candidateData.position,
    electionId: candidateData.electionId._id,
    timestamp: new Date()
  });
};

// Emit turnout milestone notifications
const emitTurnoutMilestone = (electionId, milestone, currentTurnout) => {
  if (!io) return;
  
  io.to(`election_${electionId}`).emit('turnout_milestone', {
    electionId,
    milestone,
    currentTurnout,
    timestamp: new Date()
  });
};

// Emit voting history update to user
const emitVotingHistoryUpdate = (userId, historyData) => {
  if (!io) return;
  
  io.to(`user_${userId}`).emit('voting_history_updated', {
    userId,
    history: historyData,
    timestamp: new Date()
  });
};

// Emit voting statistics update to user
const emitVotingStatsUpdate = (userId, statsData) => {
  if (!io) return;
  
  io.to(`user_${userId}`).emit('voting_stats_updated', {
    userId,
    stats: statsData,
    timestamp: new Date()
  });
};

// Emit global voting statistics update
const emitGlobalVotingUpdate = (globalStats) => {
  if (!io) return;
  
  io.emit('global_voting_update', {
    globalStats,
    timestamp: new Date()
  });
};

// Emit live election statistics update
const emitLiveElectionStats = (electionId, liveStats) => {
  if (!io) return;
  
  // Emit to election room
  io.to(`election_${electionId}`).emit('live_election_stats', {
    electionId,
    stats: liveStats,
    timestamp: new Date()
  });
  
  // Emit to live results subscribers (admins)
  io.to(`live_results_${electionId}`).emit('live_election_stats_detailed', {
    electionId,
    stats: liveStats,
    timestamp: new Date()
  });
};

// Get connected users count
const getConnectedUsersCount = () => {
  return io ? io.sockets.sockets.size : 0;
};

// Get users in election room
const getElectionRoomUsers = (electionId) => {
  if (!io) return 0;
  const room = io.sockets.adapter.rooms.get(`election_${electionId}`);
  return room ? room.size : 0;
};

module.exports = {
  initializeSocket,
  emitVoteCast,
  emitElectionStatusChange,
  emitCandidateApproved,
  emitTurnoutMilestone,
  emitVotingHistoryUpdate,
  emitVotingStatsUpdate,
  emitGlobalVotingUpdate,
  emitLiveElectionStats,
  getConnectedUsersCount,
  getElectionRoomUsers
};
