# CampusVote Automated Vercel Deployment Script
# Run this script to deploy your CampusVote application to Vercel

Write-Host "🚀 CampusVote Automated Deployment to Vercel" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Green

# Check if Vercel CLI is installed
Write-Host "📦 Checking Vercel CLI installation..." -ForegroundColor Blue
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Check if user is logged in to Vercel
Write-Host "🔐 Checking Vercel authentication..." -ForegroundColor Blue
$loginStatus = vercel whoami 2>&1
if ($loginStatus -match "Error") {
    Write-Host "Please log in to Vercel..." -ForegroundColor Yellow
    vercel login
}

# Deploy to Vercel
Write-Host "🚀 Starting deployment to Vercel..." -ForegroundColor Green
Write-Host "Note: You'll need to configure environment variables in Vercel dashboard" -ForegroundColor Yellow

# Deploy with environment variables prompt
Write-Host "`nEnvironment variables needed:" -ForegroundColor Cyan
Write-Host "1. MONGODB_URI - Your MongoDB Atlas connection string" -ForegroundColor Yellow
Write-Host "2. EMAIL_PASSWORD - Your Gmail app password" -ForegroundColor Yellow
Write-Host "3. JWT_SECRET - Already set in .env file" -ForegroundColor Yellow

$deploy = Read-Host "`nProceed with deployment? (y/N)"

if ($deploy -eq "y" -or $deploy -eq "Y") {
    Write-Host "Deploying CampusVote to Vercel..." -ForegroundColor Green
    vercel --prod
    
    Write-Host "`n✅ Deployment initiated!" -ForegroundColor Green
    Write-Host "🌐 Your app will be available at the URL shown above" -ForegroundColor Green
    Write-Host "⚙️  Don't forget to set environment variables in Vercel dashboard!" -ForegroundColor Yellow
    
    # Open Vercel dashboard
    $openDashboard = Read-Host "`nOpen Vercel dashboard to configure environment variables? (y/N)"
    if ($openDashboard -eq "y" -or $openDashboard -eq "Y") {
        Start-Process "https://vercel.com/dashboard"
    }
} else {
    Write-Host "Deployment cancelled." -ForegroundColor Red
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Set up MongoDB Atlas database" -ForegroundColor White
Write-Host "2. Configure Gmail App Password" -ForegroundColor White  
Write-Host "3. Add environment variables in Vercel dashboard" -ForegroundColor White
Write-Host "4. Test your deployed application" -ForegroundColor White