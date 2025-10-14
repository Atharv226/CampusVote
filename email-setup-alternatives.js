// Alternative Email Service Configurations for CampusVote
// Choose the service that works best for you

const emailConfigurations = {
    
    // Option 1: Gmail (requires App Password)
    gmail: {
        service: 'gmail',
        auth: {
            user: 'atharvthakare011@gmail.com',
            pass: 'your-16-character-app-password' // Get from Google App Passwords
        }
    },

    // Option 2: SendGrid (Recommended - Easier Setup)
    sendgrid: {
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
            user: 'apikey',
            pass: 'your-sendgrid-api-key' // Get from SendGrid dashboard
        }
    },

    // Option 3: Outlook/Hotmail (Easier than Gmail)
    outlook: {
        service: 'hotmail',
        auth: {
            user: 'your-outlook-email@outlook.com',
            pass: 'your-outlook-password' // Regular password works
        }
    },

    // Option 4: Yahoo Mail
    yahoo: {
        service: 'yahoo',
        auth: {
            user: 'your-yahoo-email@yahoo.com',
            pass: 'your-app-password' // Yahoo App Password
        }
    },

    // Option 5: Custom SMTP (Any provider)
    custom: {
        host: 'smtp.your-provider.com',
        port: 587,
        secure: false,
        auth: {
            user: 'your-email@domain.com',
            pass: 'your-password'
        }
    }
};

// Test Email Function
const nodemailer = require('nodemailer');

async function testEmailService(config, testEmail = 'atharvthakare011@gmail.com') {
    try {
        console.log('🧪 Testing email service...'.blue);
        
        const transporter = nodemailer.createTransporter(config);
        
        // Verify connection
        await transporter.verify();
        console.log('✅ Email service connection successful!'.green);
        
        // Send test email
        const info = await transporter.sendMail({
            from: config.auth.user,
            to: testEmail,
            subject: 'CampusVote Email Test ✅',
            html: `
                <h2>🎉 Email Service Working!</h2>
                <p>Your CampusVote application can now send emails.</p>
                <p><strong>Service:</strong> ${config.service || config.host}</p>
                <p><strong>From:</strong> ${config.auth.user}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <hr>
                <p><em>This is an automated test from your CampusVote deployment.</em></p>
            `
        });
        
        console.log('✅ Test email sent successfully!'.green);
        console.log(`📧 Message ID: ${info.messageId}`.yellow);
        
        return true;
    } catch (error) {
        console.error('❌ Email service test failed:'.red);
        console.error(error.message.red);
        return false;
    }
}

// Quick Setup Functions
const emailSetups = {
    
    // SendGrid Setup (Recommended)
    async setupSendGrid() {
        console.log('📧 SendGrid Setup Instructions:'.cyan.bold);
        console.log('1. Go to: https://sendgrid.com');
        console.log('2. Sign up for free account');
        console.log('3. Go to Settings → API Keys');
        console.log('4. Create new API key with "Mail Send" permissions');
        console.log('5. Copy the API key');
        console.log('\n🔧 Update your .env file:'.yellow);
        console.log('EMAIL_SERVICE=sendgrid');
        console.log('EMAIL_SENDGRID_API_KEY=your-api-key-here');
        console.log('EMAIL_USER=noreply@yourdomain.com'); // Can be any email
    },

    // Outlook Setup
    async setupOutlook() {
        console.log('📧 Outlook Setup Instructions:'.cyan.bold);
        console.log('1. Create Outlook account: https://outlook.com');
        console.log('2. Use regular username/password (no app password needed)');
        console.log('\n🔧 Update your .env file:'.yellow);
        console.log('EMAIL_SERVICE=hotmail');
        console.log('EMAIL_USER=your-email@outlook.com');
        console.log('EMAIL_PASSWORD=your-outlook-password');
    },

    // Gmail Setup (Current)
    async setupGmail() {
        console.log('📧 Gmail App Password Instructions:'.cyan.bold);
        console.log('1. Go to: https://myaccount.google.com/apppasswords');
        console.log('2. Select "Other (custom name)"');
        console.log('3. Enter "CampusVote"');
        console.log('4. Copy 16-character password');
        console.log('\n🔧 Update your .env file:'.yellow);
        console.log('EMAIL_SERVICE=gmail');
        console.log('EMAIL_USER=atharvthakare011@gmail.com');
        console.log('EMAIL_PASSWORD=16-character-app-password');
    }
};

// Export for use in main application
module.exports = { emailConfigurations, testEmailService, emailSetups };

// Command line usage
if (require.main === module) {
    const colors = require('colors');
    
    console.log('🔧 CampusVote Email Service Setup'.cyan.bold);
    console.log('Choose your preferred email service:\n'.yellow);
    
    console.log('1. SendGrid (Recommended) - Free, reliable, easy setup'.green);
    console.log('2. Outlook - Simple setup, no app passwords needed'.blue);
    console.log('3. Gmail - Requires app password setup'.yellow);
    
    const service = process.argv[2];
    
    switch(service) {
        case 'sendgrid':
            emailSetups.setupSendGrid();
            break;
        case 'outlook':
            emailSetups.setupOutlook();
            break;
        case 'gmail':
            emailSetups.setupGmail();
            break;
        default:
            console.log('\nUsage:'.cyan);
            console.log('node email-setup-alternatives.js sendgrid'.green);
            console.log('node email-setup-alternatives.js outlook'.blue);
            console.log('node email-setup-alternatives.js gmail'.yellow);
    }
}