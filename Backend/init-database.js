const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const colors = require('colors');

// Import models
const User = require('./server/models/User');
const Election = require('./server/models/Election');
const Booth = require('./server/models/Booth');
const Candidate = require('./server/models/Candidate');

// Database initialization script for CampusVote
async function initializeDatabase() {
    try {
        console.log('🚀 Initializing CampusVote Database...\n'.cyan.bold);

        // Get MongoDB URI from environment or argument
        const mongoURI = process.env.MONGODB_URI || process.argv[2];
        
        if (!mongoURI) {
            console.log('❌ Please provide MongoDB URI:'.red);
            console.log('node init-database.js "mongodb+srv://username:password@cluster.mongodb.net/campusvote"'.green);
            process.exit(1);
        }

        // Connect to MongoDB
        console.log('📡 Connecting to MongoDB...'.blue);
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB Atlas!'.green);

        // Clear existing data (optional - for fresh start)
        const clearData = process.argv.includes('--clear');
        if (clearData) {
            console.log('🧹 Clearing existing data...'.yellow);
            await Promise.all([
                User.deleteMany({}),
                Election.deleteMany({}),
                Booth.deleteMany({}),
                Candidate.deleteMany({})
            ]);
            console.log('✅ Data cleared'.green);
        }

        // Create Admin User
        console.log('👨‍💼 Creating admin user...'.blue);
        const adminExists = await User.findOne({ email: 'admin@campusvote.com' });
        
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 12);
            const adminUser = new User({
                name: 'Campus Admin',
                email: 'admin@campusvote.com',
                password: hashedPassword,
                studentId: 'ADMIN001',
                department: 'Administration',
                year: 4,
                role: 'admin',
                isApproved: true,
                isEmailVerified: true
            });
            await adminUser.save();
            console.log('✅ Admin user created:'.green);
            console.log(`   Email: admin@campusvote.com`.yellow);
            console.log(`   Password: admin123`.yellow);
            console.log(`   Role: admin`.yellow);
        } else {
            console.log('ℹ️  Admin user already exists'.blue);
        }

        // Create Sample Voter
        console.log('👨‍🎓 Creating sample voter...'.blue);
        const voterExists = await User.findOne({ email: 'voter@test.com' });
        
        if (!voterExists) {
            const hashedPassword = await bcrypt.hash('voter123', 12);
            const voterUser = new User({
                name: 'Test Voter',
                email: 'voter@test.com',
                password: hashedPassword,
                studentId: 'STU001',
                department: 'Computer Science',
                year: 3,
                role: 'voter',
                isApproved: true,
                isEmailVerified: true
            });
            await voterUser.save();
            console.log('✅ Sample voter created:'.green);
            console.log(`   Email: voter@test.com`.yellow);
            console.log(`   Password: voter123`.yellow);
            console.log(`   Role: voter`.yellow);
        } else {
            console.log('ℹ️  Sample voter already exists'.blue);
        }

        // Create Sample Booths
        console.log('🏢 Creating voting booths...'.blue);
        const boothExists = await Booth.findOne({});
        
        if (!boothExists) {
            const sampleBooths = [
                {
                    name: 'Main Auditorium',
                    building: 'Academic Block A',
                    room: 'Auditorium 1',
                    capacity: 200,
                    departments: ['Computer Science', 'Information Technology'],
                    years: [1, 2, 3, 4],
                    coordinates: { latitude: 19.0760, longitude: 72.8777 },
                    isActive: true
                },
                {
                    name: 'Library Hall',
                    building: 'Library Building',
                    room: 'Ground Floor',
                    capacity: 150,
                    departments: ['Mechanical', 'Civil', 'Electrical'],
                    years: [1, 2, 3, 4],
                    coordinates: { latitude: 19.0761, longitude: 72.8778 },
                    isActive: true
                },
                {
                    name: 'Conference Room',
                    building: 'Administrative Block',
                    room: 'Conference Room 1',
                    capacity: 100,
                    departments: ['Electronics', 'Instrumentation'],
                    years: [1, 2, 3, 4],
                    coordinates: { latitude: 19.0762, longitude: 72.8779 },
                    isActive: true
                }
            ];

            await Booth.insertMany(sampleBooths);
            console.log('✅ Sample booths created'.green);
            console.log(`   Created ${sampleBooths.length} voting booths`.yellow);
        } else {
            console.log('ℹ️  Booths already exist'.blue);
        }

        // Create Sample Election
        console.log('🗳️  Creating sample election...'.blue);
        const electionExists = await Election.findOne({});
        
        if (!electionExists) {
            const sampleElection = new Election({
                title: 'Student Council Elections 2024',
                description: 'Annual student council elections for academic year 2024-25',
                startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
                positions: [
                    {
                        title: 'President',
                        description: 'Lead the student council and represent students',
                        maxCandidates: 5
                    },
                    {
                        title: 'Vice President',
                        description: 'Assist the president and manage events',
                        maxCandidates: 3
                    },
                    {
                        title: 'Secretary',
                        description: 'Maintain records and communications',
                        maxCandidates: 3
                    }
                ],
                eligibleDepartments: ['Computer Science', 'Information Technology', 'Mechanical', 'Civil', 'Electrical'],
                eligibleYears: [2, 3, 4],
                isActive: true,
                createdBy: adminUser ? adminUser._id : null
            });
            
            await sampleElection.save();
            console.log('✅ Sample election created'.green);
            console.log(`   Title: ${sampleElection.title}`.yellow);
            console.log(`   Start Date: ${sampleElection.startDate.toLocaleDateString()}`.yellow);
            console.log(`   End Date: ${sampleElection.endDate.toLocaleDateString()}`.yellow);
        } else {
            console.log('ℹ️  Elections already exist'.blue);
        }

        // Database Statistics
        console.log('\n📊 Database Statistics:'.cyan.bold);
        const stats = await Promise.all([
            User.countDocuments(),
            Election.countDocuments(), 
            Booth.countDocuments(),
            Candidate.countDocuments()
        ]);

        console.log(`Users: ${stats[0]}`.yellow);
        console.log(`Elections: ${stats[1]}`.yellow);
        console.log(`Booths: ${stats[2]}`.yellow);
        console.log(`Candidates: ${stats[3]}`.yellow);

        console.log('\n🎉 Database initialization complete!'.green.bold);
        console.log('\n📋 Test Accounts Created:'.cyan);
        console.log('Admin: admin@campusvote.com / admin123'.yellow);
        console.log('Voter: voter@test.com / voter123'.yellow);
        
        console.log('\n🚀 Your CampusVote database is ready for production!'.green.bold);

    } catch (error) {
        console.error('❌ Database initialization failed:'.red);
        console.error(error.message.red);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB'.blue);
    }
}

// Handle command line arguments
if (process.argv.includes('--help')) {
    console.log('CampusVote Database Initialization Script'.cyan.bold);
    console.log('\nUsage:');
    console.log('node init-database.js "mongodb_uri" [options]'.green);
    console.log('\nOptions:');
    console.log('--clear    Clear existing data before initialization'.yellow);
    console.log('--help     Show this help message'.yellow);
    console.log('\nExample:');
    console.log('node init-database.js "mongodb+srv://user:pass@cluster.mongodb.net/campusvote" --clear'.green);
    process.exit(0);
}

// Run initialization
initializeDatabase();