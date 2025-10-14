const mongoose = require('mongoose');

const electionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Election title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Election description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  status: {
    type: String,
    enum: ['draft', 'upcoming', 'active', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  positions: [{
    type: String,
    required: true,
    enum: ['President', 'Vice President', 'Secretary', 'Treasurer', 'General Secretary', 'Cultural Secretary', 'Sports Secretary']
  }],
  allowedBranches: [{
    type: String,
    enum: ['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Chemical', 'Biotechnology', 'Information Technology']
  }],
  allowedYears: [{
    type: Number,
    min: 1,
    max: 4
  }],
  totalVoters: {
    type: Number,
    default: 0
  },
  totalVotesCast: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Custom validation for date range
electionSchema.pre('save', function(next) {
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    const error = new Error('End date must be after start date');
    error.name = 'ValidationError';
    return next(error);
  }
  
  // Validate that at least one position is selected
  if (!this.positions || this.positions.length === 0) {
    const error = new Error('At least one position must be selected');
    error.name = 'ValidationError';
    return next(error);
  }
  
  next();
});

// Index for efficient queries
electionSchema.index({ status: 1, startDate: 1, endDate: 1 });
// Separate indexes for array fields (can't compound index parallel arrays)
electionSchema.index({ allowedBranches: 1 });
electionSchema.index({ allowedYears: 1 });

// Virtual for checking if election is currently active
electionSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && now >= this.startDate && now <= this.endDate;
});

// Method to update election status based on dates
electionSchema.methods.updateStatus = function() {
  const now = new Date();
  
  if (now < this.startDate) {
    this.status = 'upcoming';
  } else if (now >= this.startDate && now <= this.endDate) {
    this.status = 'active';
  } else {
    this.status = 'completed';
  }
  
  return this.save();
};

module.exports = mongoose.model('Election', electionSchema);
