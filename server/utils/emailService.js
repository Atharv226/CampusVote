const nodemailer = require('nodemailer');

// Create transporter (you'll need to configure this with your email service)
const createTransporter = () => {
  // For development, you can use Gmail or other services
  // For production, consider using services like SendGrid, AWS SES, etc.
  
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Development: Use Gmail with app password or test account
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      }
    });
  }
};

// Send OTP email
const sendOTP = async (email, otp) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@campusvote.com',
      to: email,
      subject: 'CampusVote - Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">CampusVote</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">College Voting System</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Email Verification</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Thank you for registering with CampusVote! To complete your registration and verify your email address, 
              please use the following OTP (One-Time Password):
            </p>
            
            <div style="background: #fff; border: 2px solid #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 25px 0;">
              <h3 style="color: #667eea; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h3>
              <p style="color: #999; margin: 10px 0 0 0; font-size: 14px;">This OTP will expire in 10 minutes</p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Please enter this OTP in the CampusVote application to complete your registration.
            </p>
            
            <div style="background: #e8f4fd; border-left: 4px solid #667eea; padding: 15px; margin: 25px 0;">
              <p style="margin: 0; color: #333; font-size: 14px;">
                <strong>Security Note:</strong> Never share this OTP with anyone. CampusVote staff will never ask for your OTP.
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 0;">
              If you didn't register for CampusVote, please ignore this email.
            </p>
          </div>
          
          <div style="background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2024 CampusVote. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">This is an automated email, please do not reply.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return true;
    
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

// Send password reset email
const sendPasswordReset = async (email, resetToken) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@campusvote.com',
      to: email,
      subject: 'CampusVote - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">CampusVote</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              You requested to reset your password for your CampusVote account. Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            
            <p style="background: #f1f1f1; padding: 15px; border-radius: 5px; word-break: break-all; color: #333;">
              ${resetUrl}
            </p>
            
            <div style="background: #e8f4fd; border-left: 4px solid #667eea; padding: 15px; margin: 25px 0;">
              <p style="margin: 0; color: #333; font-size: 14px;">
                <strong>Security Note:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
              </p>
            </div>
          </div>
          
          <div style="background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2024 CampusVote. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;">This is an automated email, please do not reply.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return true;
    
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

module.exports = {
  sendOTP,
  sendPasswordReset
};
