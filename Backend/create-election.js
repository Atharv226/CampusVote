require('dotenv').config();
const mongoose = require('mongoose');
const Election = require('./server/models/Election');
const User = require('./server/models/User');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    // First, create an admin user if none exists
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      adminUser = new User({
        name: 'Admin User',
        rollNo: 'ADMIN001',
        email: 'admin@example.com',
        password: 'password123', // This would normally be hashed
        branch: 'Computer Science',
        year: 4,
        studentId: 'ADMIN001',
        role: 'admin'
      });
      
      // Save directly to database to bypass password hashing middleware if any
      await User.collection.insertOne(adminUser);
      console.log('Admin user created');
    }
    
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + 1);
    
    // Create election with admin user as creator
    const newElection = new Election({
      title: 'Student Council Election 2024',
      description: 'Vote for your student council representatives',
      status: 'active',
      startDate: now,
      endDate: endDate,
      allowedBranches: ['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Chemical', 'Biotechnology', 'Information Technology'],
      allowedYears: [1, 2, 3, 4],
      positions: ['President', 'Vice President', 'Secretary', 'Treasurer'],
      createdBy: adminUser._id
    });
    
    await newElection.save();
    console.log('Active election created successfully:', newElection);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });