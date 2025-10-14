const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    enum: [
      'President',
      'Vice President',
      'Secretary',
      'Treasurer',
      'General Secretary',
      'Cultural Secretary',
      'Sports Secretary'
    ]
  },
  manifesto: {
    type: String,
    required: [true, 'Manifesto is required'],
    maxlength: [2000, 'Manifesto cannot exceed 2000 characters']
  },
  experience: {
    type: String,
    maxlength: [1000, 'Experience cannot exceed 1000 characters']
  },
  goals: {
    type: String,
    maxlength: [1000, 'Goals cannot exceed 1000 characters']
  },
  contactPhone: {
    type: String,
    required: [true, 'Contact phone is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  socialMedia: {
    linkedin: String,
    twitter: String,
    instagram: String
  },
  photoUrl: {
    type: String,
    required: [true, 'Profile photo is required']
  },
  idProofUrl: {
    type: String,
    required: [true, 'ID proof is required']
  },
  manifestoFileUrl: String,
  achievements: [{
    title: String,
    description: String,
    year: Number
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
candidateSchema.index({ electionId: 1, position: 1 });
candidateSchema.index({ userId: 1, electionId: 1 }, { unique: true });

module.exports = mongoose.model('Candidate', candidateSchema);
