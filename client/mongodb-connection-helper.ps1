# MongoDB Atlas Connection Helper
# This script helps you create a properly formatted connection string

Write-Host "=== MongoDB Atlas Connection Helper ===" -ForegroundColor Cyan
Write-Host ""

# Get user input
$username = Read-Host "Enter your MongoDB Atlas username"
$password = Read-Host "Enter your MongoDB Atlas password" -AsSecureString
$cluster = Read-Host "Enter your cluster hostname (e.g., cluster0.xxxxx.mongodb.net)"
$database = Read-Host "Enter your database name (or press Enter for default)"

# Convert secure string to plain text and URL encode
$plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

# Load System.Web assembly for URL encoding
Add-Type -AssemblyName System.Web
$encodedPassword = [System.Web.HttpUtility]::UrlEncode($plainPassword)

# Build connection string
if ([string]::IsNullOrEmpty($database)) {
    $connectionString = "mongodb+srv://$username:$encodedPassword@$cluster/"
} else {
    $connectionString = "mongodb+srv://$username:$encodedPassword@$cluster/$database"
}

Write-Host ""
Write-Host "=== Connection Details ===" -ForegroundColor Green
Write-Host "Username: $username"
Write-Host "Cluster: $cluster"
Write-Host "Database: $(if($database){$database}else{'(default)'})"
Write-Host ""
Write-Host "=== Connection String ===" -ForegroundColor Yellow
Write-Host $connectionString
Write-Host ""
Write-Host "=== Instructions ===" -ForegroundColor Magenta
Write-Host "1. Copy the connection string above"
Write-Host "2. Open MongoDB Compass"
Write-Host "3. Paste it in the connection URI field"
Write-Host "4. Click 'Connect'"
Write-Host ""
Write-Host "=== Alternative: Use Individual Fields ===" -ForegroundColor Magenta
Write-Host "If the connection string doesn't work, use these individual fields in Compass:"
Write-Host "- Hostname: $cluster"
Write-Host "- Port: 27017"
Write-Host "- Authentication: Username/Password"
Write-Host "- Username: $username"
Write-Host "- Password: $plainPassword"
Write-Host "- Authentication Database: admin"
Write-Host "- SSL: Enabled"

# Clear sensitive data from memory
$plainPassword = $null
$encodedPassword = $null