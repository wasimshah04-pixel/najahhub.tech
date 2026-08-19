$ErrorActionPreference = "Stop"

$projectRoot = $PSScriptRoot
$deployDir   = Join-Path $projectRoot "..\sanhi-deploy"
$zipOutput   = Join-Path $projectRoot "..\sanhi-shop-cpanel.zip"

Write-Host ""
Write-Host "  SANHI Shop - cPanel Deployment Builder" -ForegroundColor Cyan
Write-Host ""

# Clean previous deploy
if (Test-Path $deployDir) { Remove-Item $deployDir -Recurse -Force }
if (Test-Path $zipOutput) { Remove-Item $zipOutput -Force }
New-Item -ItemType Directory -Path $deployDir -Force | Out-Null

# Copy server entry point
Write-Host "  [1/7] Copying server.js..." -ForegroundColor Yellow
Copy-Item "$projectRoot\server.js" "$deployDir\server.js"

# Copy server backend directory
Write-Host "  [2/7] Copying server directory..." -ForegroundColor Yellow
Copy-Item "$projectRoot\server" "$deployDir\server" -Recurse

# Copy dist built frontend
Write-Host "  [3/7] Copying dist directory..." -ForegroundColor Yellow
Copy-Item "$projectRoot\dist" "$deployDir\dist" -Recurse

# Copy storage with product images
Write-Host "  [4/7] Copying storage directory..." -ForegroundColor Yellow
Copy-Item "$projectRoot\storage" "$deployDir\storage" -Recurse

# Copy database
Write-Host "  [5/7] Copying database directory..." -ForegroundColor Yellow
Copy-Item "$projectRoot\database" "$deployDir\database" -Recurse

# Create production package.json
Write-Host "  [6/7] Creating package.json..." -ForegroundColor Yellow
$pkgContent = '{
  "name": "sanhi-shop",
  "version": "1.0.0",
  "description": "SANHI Premium Clothing E-Commerce Platform",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "NODE_ENV=production node server.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "better-sqlite3": "^11.3.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.4.0",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.5",
    "dotenv": "^16.4.5",
    "uuid": "^9.0.1",
    "cookie-parser": "^1.4.6",
    "compression": "^1.7.4"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}'
[System.IO.File]::WriteAllText("$deployDir\package.json", $pkgContent)

# Create .env
$envContent = 'PORT=5000
NODE_ENV=production
JWT_SECRET=CHANGE-THIS-TO-A-STRONG-SECRET-KEY
SESSION_SECRET=CHANGE-THIS-TO-A-STRONG-SESSION-SECRET

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe@123'
[System.IO.File]::WriteAllText("$deployDir\.env", $envContent)

# Create README
Write-Host "  [7/7] Creating README..." -ForegroundColor Yellow
$readmeContent = '# SANHI Shop - cPanel Deployment

## Quick Setup

1. Upload this ZIP to cPanel File Manager
2. Extract into your application directory
3. In cPanel Setup Node.js App - set startup file to server.js
4. Click Run NPM Install
5. Edit .env file - change JWT_SECRET and SESSION_SECRET
6. Start App

## Admin Panel

URL: yourdomain.com/admin
Default: admin@example.com / ChangeMe@123'
[System.IO.File]::WriteAllText("$deployDir\README.md", $readmeContent)

# Create ZIP
Write-Host ""
Write-Host "  Creating ZIP archive..." -ForegroundColor Cyan
Compress-Archive -Path "$deployDir\*" -DestinationPath $zipOutput -Force

# Summary
$zipSize = [math]::Round(((Get-Item $zipOutput).Length / 1MB), 2)
Write-Host ""
Write-Host "  Deployment ZIP created!" -ForegroundColor Green
Write-Host "  Location: $zipOutput" -ForegroundColor White
Write-Host "  Size: $zipSize MB" -ForegroundColor White
Write-Host "  Entry point: server.js" -ForegroundColor White
Write-Host ""
