# MongoDB Connection String Fixer
# This script helps diagnose and fix MongoDB connection string issues

Write-Host "=== MongoDB Connection String Fixer ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "What type of MongoDB are you connecting to?" -ForegroundColor Yellow
Write-Host "1. Local MongoDB (running on your computer)"
Write-Host "2. MongoDB Atlas (cloud database)"
Write-Host ""

$choice = Read-Host "Enter your choice (1 or 2)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "=== Local MongoDB Connection ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "For local MongoDB, use this connection string in Compass:"
    Write-Host "mongodb://localhost:27017" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or use these individual fields:"
    Write-Host "- Hostname: localhost"
    Write-Host "- Port: 27017"
    Write-Host "- Authentication: None (unless you've set up authentication)"
    Write-Host "- SSL: Disabled"
} 
elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "=== MongoDB Atlas Connection ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "For MongoDB Atlas, you need a connection string like:"
    Write-Host "mongodb+srv://username:password@cluster.xxxxx.mongodb.net/database" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Let me help you build it correctly..."
    Write-Host ""
    
    $username = Read-Host "Enter your Atlas username"
    $password = Read-Host "Enter your Atlas password" -AsSecureString
    $cluster = Read-Host "Enter your cluster hostname (e.g., cluster0.xxxxx.mongodb.net)"
    $database = Read-Host "Enter database name (optional, press Enter to skip)"
    
    # Convert secure string and URL encode
    $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
    Add-Type -AssemblyName System.Web
    $encodedPassword = [System.Web.HttpUtility]::UrlEncode($plainPassword)
    
    if ([string]::IsNullOrEmpty($database)) {
        $connectionString = "mongodb+srv://$username:$encodedPassword@$cluster/"
    } else {
        $connectionString = "mongodb+srv://$username:$encodedPassword@$cluster/$database"
    }
    
    Write-Host ""
    Write-Host "=== Your Correct Connection String ===" -ForegroundColor Yellow
    Write-Host $connectionString
    Write-Host ""
    Write-Host "Copy this EXACT string into MongoDB Compass URI field"
    
    # Clear sensitive data
    $plainPassword = $null
    $encodedPassword = $null
}
else {
    Write-Host "Invalid choice. Please run the script again and choose 1 or 2." -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Common Issues and Solutions ===" -ForegroundColor Magenta
Write-Host "❌ DON'T mix formats: localhost:27017mongodb+srv: (WRONG)"
Write-Host "✅ Local: mongodb://localhost:27017 (CORRECT)"
Write-Host "✅ Atlas: mongodb+srv://user:pass@cluster.mongodb.net/ (CORRECT)"
Write-Host ""
Write-Host "If you're still having issues:"
Write-Host "1. Make sure you're not mixing local and cloud connection strings"
Write-Host "2. Copy the connection string carefully (no extra characters)"
Write-Host "3. Use individual fields in Compass instead of the URI"