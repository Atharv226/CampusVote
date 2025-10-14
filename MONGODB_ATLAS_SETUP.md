# 🗄️ MongoDB Atlas Setup Guide for CampusVote

**Account:** atharvthakare011@gmail.com  
**Project:** CampusVote Deployment

## 📋 Step-by-Step Setup

### Step 1: Create MongoDB Atlas Account
1. **Visit:** https://www.mongodb.com/atlas
2. **Sign up** with your email: `atharvthakare011@gmail.com`
3. **Choose:** "Learn MongoDB" if prompted about your goal
4. **Select:** Free tier (M0 Sandbox - 512 MB)

### Step 2: Create Project and Cluster
1. **Create New Project:**
   - Project Name: `CampusVote`
   - Skip adding members for now

2. **Build a Database:**
   - Choose **FREE** (M0 Sandbox)
   - Cloud Provider: **AWS** (recommended)
   - Region: Choose closest to you (e.g., `us-east-1` for US East Coast)
   - Cluster Name: `campusvote-cluster`
   - Click **"Create Cluster"** (takes 3-5 minutes)

### Step 3: Create Database User
1. **Go to:** Database Access (left sidebar)
2. **Click:** "Add New Database User"
3. **Authentication Method:** Password
4. **Username:** `campusvote-admin`
5. **Password:** Generate a secure password (save this!)
   - Suggested: Use MongoDB's "Autogenerate Secure Password" 
   - **Save this password securely!**
6. **Database User Privileges:** "Read and write to any database"
7. **Click:** "Add User"

### Step 4: Configure Network Access
1. **Go to:** Network Access (left sidebar)  
2. **Click:** "Add IP Address"
3. **For deployment, choose:** "Allow access from anywhere (0.0.0.0/0)"
   - This allows your deployment platform to connect
   - For production, you can restrict this later to specific IPs
4. **Comment:** "Deployment access"
5. **Click:** "Confirm"

### Step 5: Get Connection String
1. **Go to:** Database (left sidebar)
2. **Click:** "Connect" button on your cluster
3. **Choose:** "Connect your application"
4. **Driver:** Node.js, Version: 4.1 or later
5. **Copy the connection string:** It should look like:
   ```
   mongodb+srv://campusvote-admin:<password>@campusvote-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 6: Update Connection String
Replace `<password>` with your actual database user password and add the database name:
```
mongodb+srv://campusvote-admin:YOUR_ACTUAL_PASSWORD@campusvote-cluster.xxxxx.mongodb.net/campusvote?retryWrites=true&w=majority
```

## 🧪 Test Your Connection

After setting up MongoDB Atlas, test your connection:

1. **Update the connection string** in the command below:
```powershell
node test-mongodb-connection.js "mongodb+srv://campusvote-admin:YOUR_PASSWORD@campusvote-cluster.xxxxx.mongodb.net/campusvote"
```

2. **Run the test:**
```powershell
node test-mongodb-connection.js "YOUR_FULL_CONNECTION_STRING_HERE"
```

If successful, you should see:
- ✅ Successfully connected to MongoDB Atlas!
- ✅ Test document created
- ✅ Test document retrieved successfully
- ✅ Test document cleaned up
- 📊 Database Information
- 🎉 MongoDB Atlas is ready for CampusVote deployment!

## 🔧 Update Environment Files

1. **Copy your connection string** from the test
2. **Update both environment files:**

   **For root `.env`:**
   ```env
   MONGODB_URI=mongodb+srv://campusvote-admin:YOUR_PASSWORD@campusvote-cluster.xxxxx.mongodb.net/campusvote?retryWrites=true&w=majority
   ```

   **For `server/.env`:**
   ```env
   MONGODB_URI=mongodb+srv://campusvote-admin:YOUR_PASSWORD@campusvote-cluster.xxxxx.mongodb.net/campusvote?retryWrites=true&w=majority
   ```

## 🚀 Deploy with MongoDB Atlas

When deploying to Vercel, Render, or other platforms, add this environment variable:

**Environment Variable Name:** `MONGODB_URI`  
**Value:** Your full connection string with password

## 📊 Database Collections

Your CampusVote app will automatically create these collections:
- `users` - Voter and admin accounts
- `candidates` - Candidate information
- `elections` - Election configurations  
- `votes` - Voting records (encrypted)
- `booths` - Voting booth assignments
- `otps` - OTP verification codes

## 🔒 Security Best Practices

1. **Never commit connection strings** to Git (already in .gitignore)
2. **Use environment variables** for all credentials
3. **Regularly rotate database passwords**
4. **Monitor database access** in Atlas dashboard
5. **Set up alerts** for unusual activity

## 💡 Troubleshooting

### Common Issues:

1. **"Connection refused"**
   - Check if IP is whitelisted (0.0.0.0/0 for deployment)
   - Verify username/password in connection string

2. **"Authentication failed"**
   - Double-check database user credentials
   - Ensure user has "Read and write" permissions

3. **"Timeout"**
   - Check internet connection
   - Verify cluster is running (green status in Atlas)

4. **"Database name not found"**
   - MongoDB Atlas creates databases automatically on first write
   - This is normal and expected

### Getting Help:
- Check Atlas dashboard for cluster status
- Review MongoDB Atlas documentation
- Contact MongoDB support if needed

## 📈 Monitoring Your Database

After deployment:
1. **Monitor usage** in MongoDB Atlas dashboard
2. **Set up alerts** for high usage or errors
3. **Review performance** metrics regularly
4. **Plan for scaling** if usage grows beyond free tier

---

**🎉 Your MongoDB Atlas database is now ready for CampusVote deployment!**

Next steps:
1. Test the connection with the provided script
2. Deploy your application to Vercel/Render
3. Configure email service for OTP verification
4. Test the full application functionality