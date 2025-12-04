const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createUsers() {
    const uri = 'mongodb+srv://Atharv:Atharv22678@cluster0.c8ria3e.mongodb.net/campusvote?retryWrites=true&w=majority';
    
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    try {
        const client = new MongoClient(uri);
        await client.connect();
        console.log('✅ Connected to Atlas');
        
        const db = client.db('campusvote');
        const usersCollection = db.collection('users');
        
        // Check if admin user exists
        const existingAdmin = await usersCollection.findOne({ email: 'admin@campusvote.edu' });
        if (existingAdmin) {
            console.log('✅ Admin user already exists');
            await client.close();
            return;
        }
        
        console.log('👤 Creating admin user...');
        
        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const adminUser = {
            name: 'System Administrator',
            email: 'admin@campusvote.edu',
            password: hashedPassword,
            role: 'admin',
            isEmailVerified: true,
            studentId: 'ADMIN001',
            department: 'Administration',
            yearOfStudy: '4',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await usersCollection.insertOne(adminUser);
        console.log('✅ Admin user created successfully!');
        
        // Also create a test student
        const studentPassword = await bcrypt.hash('student123', 10);
        const studentUser = {
            name: 'Test Student',
            email: 'student@campusvote.edu',
            password: studentPassword,
            role: 'student',
            isEmailVerified: true,
            studentId: 'STU001',
            department: 'Computer Science',
            yearOfStudy: '3',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await usersCollection.insertOne(studentUser);
        console.log('✅ Student user created successfully!');
        
        console.log('');
        console.log('🎉 Database initialized with users:');
        console.log('   Admin: admin@campusvote.edu / admin123');
        console.log('   Student: student@campusvote.edu / student123');
        
        await client.close();
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

createUsers();