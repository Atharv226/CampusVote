const mongoose = require('mongoose');

const boothSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Booth name is required'],
    trim: true
  },
  location: {
    building: {
      type: String,
      required: [true, 'Building name is required']
    },
    floor: {
      type: Number,
      required: [true, 'Floor number is required']
    },
    room: {
      type: String,
      required: [true, 'Room number/name is required']
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  capacity: {
    type: Number,
    required: [true, 'Booth capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  assignedBranches: [{
    type: String,
    enum: ['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Chemical', 'Biotechnology', 'Information Technology']
  }],
  assignedYears: [{
    type: Number,
    min: 1,
    max: 4
  }],
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  currentOccupancy: {
    type: Number,
    default: 0
  },
  openingTime: {
    type: String,
    required: [true, 'Opening time is required'],
    default: '09:00'
  },
  closingTime: {
    type: String,
    required: [true, 'Closing time is required'],
    default: '17:00'
  },
  staffAssigned: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['supervisor', 'assistant'],
      default: 'assistant'
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries (can't compound index parallel arrays)
boothSchema.index({ electionId: 1 });
boothSchema.index({ assignedBranches: 1 });
boothSchema.index({ assignedYears: 1 });
boothSchema.index({ 'location.building': 1, 'location.floor': 1 });

// Virtual for checking if booth is available
boothSchema.virtual('isAvailable').get(function() {
  return this.isActive && this.currentOccupancy < this.capacity;
});

// Method to assign voter to booth
boothSchema.methods.assignVoter = function() {
  if (this.isAvailable) {
    this.currentOccupancy += 1;
    return this.save();
  }
  throw new Error('Booth is not available');
};

// Method to release booth slot
boothSchema.methods.releaseSlot = function() {
  if (this.currentOccupancy > 0) {
    this.currentOccupancy -= 1;
    return this.save();
  }
  throw new Error('No slots to release');
};

module.exports = mongoose.model('Booth', boothSchema);
