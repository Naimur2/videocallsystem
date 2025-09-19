# MediaSoup Video Call - Main Setup Script
# Consolidated Docker-based setup and management

param(
    [switch]$Build,
    [switch]$Clean,
    [string]$CloudflareUrl = ""
)

Write-Host "=== MediaSoup Video Call - Setup ===" -ForegroundColor Green

# Clean previous setup if requested
if ($Clean) {
    Write-Host "Cleaning previous setup..." -ForegroundColor Yellow
    docker-compose down --volumes --remove-orphans 2>$null
    docker system prune -f
}

# Check Docker availability
Write-Host "Checking Docker..." -ForegroundColor Cyan
try {
    docker version | Out-Null
    Write-Host "Docker is ready" -ForegroundColor Green
} catch {
    Write-Host "Docker not available. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Build services if requested
if ($Build) {
    Write-Host "Building Docker images..." -ForegroundColor Cyan
    docker-compose build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "Build completed" -ForegroundColor Green
}

# Start services
Write-Host "Starting MediaSoup services..." -ForegroundColor Green
docker-compose up -d

# Wait for services
Write-Host "Waiting for services to initialize..."
Start-Sleep -Seconds 15

# Check service health
Write-Host "Checking service status..." -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "Setup completed!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Backend: http://localhost:3001" -ForegroundColor White

if ($CloudflareUrl) {
    Write-Host "Public URL: $CloudflareUrl" -ForegroundColor Magenta
} else {
    Write-Host ""
    Write-Host "To add Cloudflare tunnel:" -ForegroundColor Yellow
    Write-Host "  .\start.ps1 cloudflare -Start" -ForegroundColor White
}
