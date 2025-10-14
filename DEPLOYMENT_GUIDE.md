# 🚀 CampusVote Deployment Guide

This guide will help you deploy your CampusVote application to production using various platforms.

## 📋 Prerequisites

Before deploying, ensure you have:

- [ ] MongoDB Atlas account (free tier available)
- [ ] Email service (Gmail App Password or SendGrid account)
- [ ] Git repository (GitHub, GitLab, or Bitbucket)
- [ ] Production domain name (optional but recommended)

## 🔧 Pre-Deployment Setup

### 1. Database Setup (MongoDB Atlas)

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free account and new cluster
   - Choose your preferred region
   - Create database user with username/password
   - Add your deployment platform's IP addresses to whitelist (or use 0.0.0.0/0 for all IPs)

2. **Get Connection String**
   - In Atlas dashboard, click "Connect"
   - Choose "Connect your application"
   - Copy the connection string: `mongodb+srv://username:password@cluster.mongodb.net/campusvote`

### 2. Email Service Setup

#### Option A: Gmail App Password
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → App passwords
   - Generate password for "Mail"
   - Use this 16-character password in your environment variables

#### Option B: SendGrid
1. Create SendGrid account
2. Generate API key
3. Use these environment variables:
   ```env
   EMAIL_SERVICE=sendgrid
   EMAIL_API_KEY=your-sendgrid-api-key
   ```

### 3. Environment Variables

Update your production environment variables using `.env.production` as a template:

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🌐 Deployment Options

Choose one of the following deployment methods:

---

## Option 1: Vercel (Recommended for Full-Stack)

### Advantages:
- ✅ Free tier available
- ✅ Easy GitHub integration
- ✅ Automatic deployments
- ✅ Built-in SSL
- ✅ Global CDN

### Steps:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect the configuration from `vercel.json`

3. **Set Environment Variables**
   In Vercel dashboard → Settings → Environment Variables, add:
   ```
   NODE_ENV=production
   MONGODB_URI=your-mongodb-atlas-connection-string
   JWT_SECRET=your-generated-jwt-secret
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   CLIENT_URL=https://your-vercel-app.vercel.app
   ```

4. **Redeploy**
   - Trigger a new deployment after adding environment variables

---

## Option 2: Render (Great for Separate Frontend/Backend)

### Backend Deployment:

1. **Deploy Backend to Render**
   - Go to [render.com](https://render.com)
   - Create new Web Service
   - Connect your repository
   - Use these settings:
     ```
     Build Command: cd server && npm install
     Start Command: cd server && npm start
     ```

2. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-jwt-secret
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   CLIENT_URL=https://your-frontend-url.com
   ```

### Frontend Deployment:

1. **Deploy Frontend to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop your `client/build` folder, or
   - Connect GitHub repository with these settings:
     ```
     Base directory: client
     Build command: npm run build
     Publish directory: client/build
     ```

2. **Update Netlify Configuration**
   - Update `client/netlify.toml` with your backend URL
   - Set environment variable: `REACT_APP_API_URL=https://your-backend-render-url.com`

---

## Option 3: Railway (Simple and Fast)

1. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Create new project from GitHub
   - Railway will auto-detect and deploy both frontend and backend

2. **Set Environment Variables**
   ```
   NODE_ENV=production
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-jwt-secret
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

---

## Option 4: Docker Deployment (Self-Hosted)

### Prerequisites:
- Docker and Docker Compose installed
- VPS or cloud server (DigitalOcean, AWS, etc.)

### Steps:

1. **Update docker-compose.yml**
   - Replace placeholder environment variables with actual values
   - Update MongoDB credentials

2. **Deploy with Docker**
   ```bash
   # Build and start containers
   docker-compose up -d --build

   # Check status
   docker-compose ps

   # View logs
   docker-compose logs -f backend
   ```

3. **Set up Nginx (Production)**
   ```bash
   # Install Nginx
   sudo apt update
   sudo apt install nginx

   # Configure reverse proxy
   sudo nano /etc/nginx/sites-available/campusvote
   ```

   Add configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           try_files $uri $uri/ @frontend;
       }

       location @frontend {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }

       location /api {
           proxy_pass http://localhost:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

4. **Enable and Start**
   ```bash
   sudo ln -s /etc/nginx/sites-available/campusvote /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```

---

## 🔒 Security Checklist

Before going live:

- [ ] Change default JWT secret to a strong, random string
- [ ] Use environment variables for all sensitive data
- [ ] Enable HTTPS (most platforms do this automatically)
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting
- [ ] Set up MongoDB authentication
- [ ] Review and remove any debug logs
- [ ] Test file upload functionality
- [ ] Verify email sending works

---

## 🧪 Testing Your Deployment

After deployment, test these key features:

1. **Authentication Flow**
   - User registration with OTP verification
   - Login/logout functionality
   - JWT token handling

2. **Voting System**
   - Candidate registration and approval
   - Vote casting and verification
   - Real-time results updates

3. **Admin Functions**
   - User management and approval
   - Election management
   - Results analytics

4. **File Uploads**
   - Profile pictures
   - Candidate documents
   - ID verification files

---

## 🐛 Troubleshooting

### Common Issues:

1. **MongoDB Connection Failed**
   - Check connection string format
   - Verify IP whitelist in Atlas
   - Ensure database user has proper permissions

2. **Email Not Sending**
   - Verify Gmail app password (not regular password)
   - Check email service configuration
   - Test with simple email sending script

3. **CORS Errors**
   - Update CLIENT_URL in backend environment
   - Check API endpoint URLs in frontend

4. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Clear node_modules and reinstall

### Logs and Debugging:

```bash
# Vercel
vercel logs

# Render
# Check logs in Render dashboard

# Docker
docker-compose logs -f backend
docker-compose logs -f nginx

# Railway
# Check logs in Railway dashboard
```

---

## 📈 Post-Deployment

1. **Monitor Performance**
   - Set up uptime monitoring
   - Monitor database performance
   - Track error rates

2. **Backup Strategy**
   - Set up automated MongoDB backups
   - Document restoration procedures

3. **Updates**
   - Set up CI/CD pipeline
   - Plan for zero-downtime deployments
   - Version control deployment configurations

---

## 🆘 Support

If you encounter issues:

1. Check the logs first
2. Verify all environment variables are set correctly
3. Test database connectivity
4. Ensure all services are running
5. Check platform-specific documentation

---

**Good luck with your deployment! 🎉**

Remember to always test in a staging environment before deploying to production.