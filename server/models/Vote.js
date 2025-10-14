const mongoose = require('mongoose');
const crypto = require('crypto');

const voteSchema = new mongoose.Schema({
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  voterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  position: {
    type: String,
    required: true,
    enum: ['President', 'Vice President', 'Secretary', 'Treasurer', 'General Secretary', 'Cultural Secretary', 'Sports Secretary']
  },
  // Encrypted vote hash for security
  voteHash: {
    type: String,
    required: false // Temporarily optional for debugging
  },
  // Timestamp when vote was cast
  castAt: {
    type: Date,
    default: Date.now
  },
  // IP address for audit purposes
  ipAddress: String,
  // User agent for audit purposes
  userAgent: String,
  // Verification token
  verificationToken: String,
  // Whether vote has been verified
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries and preventing duplicate votes
voteSchema.index({ electionId: 1, voterId: 1, position: 1 }, { unique: true });
voteSchema.index({ electionId: 1, candidateId: 1 });
voteSchema.index({ castAt: 1 });

// Method to generate vote hash
voteSchema.methods.generateVoteHash = function() {
  const data = `${this.electionId}${this.voterId}${this.candidateId}${this.position}${this.castAt}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Method to verify vote integrity
voteSchema.methods.verifyVote = function() {
  const expectedHash = this.generateVoteHash();
  return this.voteHash === expectedHash;
};

// Pre-save middleware to generate vote hash
voteSchema.pre('save', function(next) {
  if (this.isNew) {
    // Ensure castAt is set before generating hash
    if (!this.castAt) {
      this.castAt = new Date();
    }
    this.voteHash = this.generateVoteHash();
    this.verificationToken = crypto.randomBytes(32).toString('hex');
  }
  next();
});

module.exports = mongoose.model('Vote', voteSchema);
