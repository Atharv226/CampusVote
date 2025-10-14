require('dotenv').config();

console.log('🔧 Server Environment Check');
console.log('===========================');

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 20) + '...' : 'NOT SET');
console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);

// Test JWT verification with the actual environment secret
const jwt = require('jsonwebtoken');
const FRESH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjhlYmE4ZTVmMWQ3NzFjOTc2ZWI0ZTIxIiwicm9sZSI6InZvdGVyIn0sImlhdCI6MTc2MDI3NDczMywiZXhwIjoxNzYwMzYxMTMzfQ.TLNUKpHCXgrOOp3ALuuUA5TGCnjjdZsx8Tdves1AMds';

console.log('\\n🔐 Testing JWT verification with environment secret...');
try {
    const verified = jwt.verify(FRESH_TOKEN, process.env.JWT_SECRET);
    console.log('✅ Token verified successfully!');
    console.log('Payload:', JSON.stringify(verified, null, 2));
} catch (error) {
    console.log('❌ JWT verification failed:', error.message);
    
    // Try to find what the token was actually signed with
    console.log('\\nLet\'s try different variations:');
    const variations = [
        process.env.JWT_SECRET,
        process.env.JWT_SECRET?.trim(),
        'your-super-secret-jwt-key-here-change-this-in-production',
        'campusvote_super_secret_key_2024_secure_token',
    ];
    
    for (const secret of variations) {
        if (!secret) continue;
        try {
            jwt.verify(FRESH_TOKEN, secret);
            console.log(`✅ Found working secret: ${secret.substring(0, 15)}...`);
            break;
        } catch (e) {
            console.log(`❌ ${secret.substring(0, 15)}...: ${e.message}`);
        }
    }
}