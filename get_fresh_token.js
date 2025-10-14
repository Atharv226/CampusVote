const http = require('http');

function login() {
    return new Promise((resolve, reject) => {
        // Using the test user credentials - adjust as needed
        const loginData = JSON.stringify({
            email: 'voter@test.com', // Adjust to your test user email
            password: 'password123'   // Adjust to your test user password
        });
        
        console.log('Attempting to login to get fresh token...');
        
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(loginData)
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('\nLogin Response:');
                console.log('Status:', res.statusCode);
                console.log('Body:', data);
                
                if (res.statusCode === 200) {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.token) {
                            console.log('\n✅ Login successful!');
                            console.log('New token:', parsed.token);
                            console.log('\nToken info:');
                            // Decode the JWT payload (without verification)
                            const payload = JSON.parse(Buffer.from(parsed.token.split('.')[1], 'base64').toString());
                            console.log('User ID:', payload.user.id);
                            console.log('Expires:', new Date(payload.exp * 1000));
                            resolve(parsed.token);
                        } else {
                            console.log('❌ No token in response');
                            reject(new Error('No token received'));
                        }
                    } catch (e) {
                        console.log('❌ Invalid JSON response:', data);
                        reject(new Error('Invalid response format'));
                    }
                } else {
                    console.log('❌ Login failed with status:', res.statusCode);
                    try {
                        const parsed = JSON.parse(data);
                        reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
                    } catch (e) {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                }
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ Request error:', error.message);
            reject(error);
        });
        
        req.write(loginData);
        req.end();
    });
}

// Test with voting after getting fresh token
function testVoteWithFreshToken(token) {
    return new Promise((resolve, reject) => {
        const voteData = JSON.stringify({
            electionId: '68eb8eeeef13a7b7be3fad3d',
            candidateId: '68eb922d3abd044bda8a9618',
            position: 'Secretary'
        });
        
        console.log('\n--- Testing vote with fresh token ---');
        console.log('Vote payload:', voteData);
        
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/voting/cast-vote',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token,
                'Content-Length': Buffer.byteLength(voteData)
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('\nVote Response:');
                console.log('Status:', res.statusCode);
                console.log('Body:', data);
                
                if (res.statusCode === 200) {
                    console.log('\n✅ Vote successful!');
                    resolve(JSON.parse(data));
                } else {
                    console.log('\n❌ Vote failed with status:', res.statusCode);
                    try {
                        const parsed = JSON.parse(data);
                        reject(new Error(`Vote failed: ${JSON.stringify(parsed)}`));
                    } catch (e) {
                        reject(new Error(`Vote failed: ${data}`));
                    }
                }
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ Vote request error:', error.message);
            reject(error);
        });
        
        req.write(voteData);
        req.end();
    });
}

// Run the complete test
async function runCompleteTest() {
    try {
        const token = await login();
        await testVoteWithFreshToken(token);
        console.log('\n🎉 Complete test successful!');
        process.exit(0);
    } catch (error) {
        console.log('\n💥 Test failed:', error.message);
        process.exit(1);
    }
}

runCompleteTest();