const mongoose = require('mongoose');
const User = require('./models/User');
const Election = require('./models/Election');
const Candidate = require('./models/Candidate');
const Vote = require('./models/Vote');
require('dotenv').config();

async function cleanupDummyData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campusvote');
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Cleaning up dummy data...');
    
    // Remove test elections (keep admin user and a few test users)
    const testElections = await Election.find({
      $or: [
        { title: { $regex: /test/i } },
        { title: { $regex: /dummy/i } },
        { title: { $regex: /sample/i } },
        { title: { $regex: /^[a-z]$/ } }, // Single letter titles
        { title: { $regex: /^[mqw]+$/ } } // Repeated letters
      ]
    });
    
    console.log(`📋 Found ${testElections.length} test elections to remove`);
    
    // Remove related candidates and votes
    for (const election of testElections) {
      const candidates = await Candidate.find({ electionId: election._id });
      console.log(`👤 Removing ${candidates.length} candidates for election: ${election.title}`);
      
      const votes = await Vote.find({ electionId: election._id });
      console.log(`🗳️  Removing ${votes.length} votes for election: ${election.title}`);
      
      await Candidate.deleteMany({ electionId: election._id });
      await Vote.deleteMany({ electionId: election._id });
      await Election.deleteOne({ _id: election._id });
    }
    
    // Keep admin user but remove test voters (keep some for demo)
    const testUsers = await User.find({
      role: 'voter',
      $or: [
        { name: { $regex: /test/i } },
        { name: { $regex: /dummy/i } },
        { name: { $regex: /sample/i } },
      ]
    }).limit(10); // Only remove first 10 test users
    
    console.log(`👥 Removing ${testUsers.length} test users`);
    
    for (const user of testUsers) {
      // Remove their candidacies and votes
      await Candidate.deleteMany({ userId: user._id });
      await Vote.deleteMany({ voterId: user._id });
      await User.deleteOne({ _id: user._id });
    }
    
    // Final count
    const finalStats = {
      users: await User.countDocuments(),
      elections: await Election.countDocuments(),
      candidates: await Candidate.countDocuments(),
      votes: await Vote.countDocuments()
    };
    
    console.log('\n📊 Final Database Stats:');
    console.log(`👥 Users: ${finalStats.users}`);
    console.log(`📋 Elections: ${finalStats.elections}`);
    console.log(`👤 Candidates: ${finalStats.candidates}`);
    console.log(`🗳️  Votes: ${finalStats.votes}`);
    
    console.log('\n🎉 Cleanup completed successfully!');

  } catch (error) {
    console.error('💥 Cleanup failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📝 Disconnected from MongoDB');
  }
}

cleanupDummyData();