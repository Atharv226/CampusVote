const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Election = require('./models/Election');
const Candidate = require('./models/Candidate');
const Booth = require('./models/Booth');

async function connect() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusvote';
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
}

async function clear() {
  await Promise.all([
    User.deleteMany({}),
    Election.deleteMany({}),
    Candidate.deleteMany({}),
    Booth.deleteMany({})
  ]);
}

async function seed() {
  await connect();
  await clear();

  // Create admin user
  const admin = new User({
    name: 'Admin User',
    rollNo: 'ADMIN001',
    email: 'admin@campusvote.test',
    password: 'adminpass',
    branch: 'Computer Science',
    year: 4,
    studentId: 'S-ADMIN-001',
    role: 'admin',
    isVerified: true,
    isApproved: true
  });
  await admin.save();

  // Create voters
  const voter1 = new User({
    name: 'Alice Voter',
    rollNo: 'CS001',
    email: 'alice@example.com',
    password: 'password123',
    branch: 'Computer Science',
    year: 3,
    studentId: 'S-CS-001',
    role: 'voter',
    isVerified: true,
    isApproved: true
  });
  const voter2 = new User({
    name: 'Bob Voter',
    rollNo: 'CS002',
    email: 'bob@example.com',
    password: 'password123',
    branch: 'Computer Science',
    year: 3,
    studentId: 'S-CS-002',
    role: 'voter',
    isVerified: true,
    isApproved: true
  });
  await voter1.save();
  await voter2.save();

  // Create election
  const now = new Date();
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const election = new Election({
    title: 'Student Council 2025',
    description: 'Election for student council positions',
    startDate: now,
    endDate: end,
    status: 'active',
    positions: ['President', 'Secretary'],
    allowedBranches: ['Computer Science'],
    allowedYears: [3, 4],
    totalVoters: 2,
    createdBy: admin._id
  });
  await election.save();

  // Create booths
  const booth = new Booth({
    name: 'Main Hall Booth',
    location: { building: 'Main Hall', floor: 1, room: '101', coordinates: { latitude: 28.6139, longitude: 77.2090 } },
    capacity: 50,
    assignedBranches: ['Computer Science'],
    assignedYears: [3, 4],
    electionId: election._id,
    isActive: true
  });
  await booth.save();

  // Create candidates (linked to voters)
  const cand1 = new Candidate({
    userId: voter1._id,
    position: 'President',
    manifesto: 'Increase transparency and improve campus facilities.',
    contactPhone: '1234567890',
    photoUrl: 'https://placeholder.pics/svg/200/DEDEDE/555555/Profile%20Photo',
    idProofUrl: 'https://placeholder.pics/svg/200/DEDEDE/555555/ID%20Proof',
    achievements: [ { title: 'Club Lead', description: 'Lead coding club', year: 2024 } ],
    isApproved: true,
    electionId: election._id
  });
  const cand2 = new Candidate({
    userId: voter2._id,
    position: 'President',
    manifesto: 'Focus on student welfare and events.',
    contactPhone: '0987654321',
    photoUrl: 'https://placeholder.pics/svg/200/DEDEDE/555555/Profile%20Photo%202',
    idProofUrl: 'https://placeholder.pics/svg/200/DEDEDE/555555/ID%20Proof%202',
    achievements: [ { title: 'Event Head', description: 'Organized tech fest', year: 2024 } ],
    isApproved: true,
    electionId: election._id
  });
  await cand1.save();
  await cand2.save();

  console.log('Seed complete');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});


