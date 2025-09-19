# MediaSoup Video Call - Multi-Repository Management Guide

## Current Repository Structure

You have **4 separate Git repositories** within your project:

```
mediasoup-video-call/          # Main project (newly initialized)
├── videocall/                 # Frontend: https://github.com/Naimur2/videocall.git
├── videocallbackend/          # Backend: https://github.com/Naimur2/videocallbackend.git  
├── VideoCallApp/              # Mobile: https://github.com/Naimur2/VideoCallApp.git
└── mediasoup-demo/            # Reference: https://github.com/versatica/mediasoup-demo.git
```

## 🎯 Recommended Approach: Unified Main Repository

The best solution is to create a **main repository** that orchestrates everything while preserving the individual repositories for component-specific development.

### Option 1: Main Repository + Individual Repos (Recommended)

**Benefits:**
- ✅ Single source of truth for CI/CD and deployment
- ✅ Preserves individual repositories for development
- ✅ Clean separation of concerns
- ✅ Easy to manage dependencies and versions

**Setup:**
```powershell
# 1. Set up main repository remote (replace with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/mediasoup-video-call.git

# 2. Create initial commit with infrastructure
git add .github/ aws/ scripts/ docs/ *.yml *.md .env.example .gitignore
git commit -m "feat: production-ready MediaSoup video call platform

- Complete AWS deployment infrastructure
- GitHub Actions CI/CD pipeline  
- Docker production orchestration
- Comprehensive documentation
- Multi-repository management"

# 3. Push main repository
git push -u origin main
```

### Option 2: Convert to Git Submodules

**Benefits:**
- ✅ True monorepo with version pinning
- ✅ Atomic commits across all components
- ✅ Simplified CI/CD pipeline

**Setup:**
```powershell
# Backup current state
.\scripts\repo-manager.ps1 -Action clean -Backup

# Remove nested .git directories and add as submodules
Remove-Item videocall\.git -Recurse -Force
Remove-Item videocallbackend\.git -Recurse -Force
Remove-Item VideoCallApp\.git -Recurse -Force

git submodule add https://github.com/Naimur2/videocall.git videocall
git submodule add https://github.com/Naimur2/videocallbackend.git videocallbackend
git submodule add https://github.com/Naimur2/VideoCallApp.git VideoCallApp

git commit -m "refactor: convert to submodules for unified repository management"
```

## 🚀 Updated CI/CD Pipeline

Your GitHub Actions workflow is already configured to handle this structure! The `deploy.yml` will:

1. **Clone main repository** with all configuration
2. **Build each component** from their respective directories
3. **Deploy unified application** to AWS ECS

### Main Repository Contents

```
mediasoup-video-call/          # Main orchestration repository
├── .github/workflows/         # CI/CD pipeline
├── aws/cloudformation/        # Infrastructure as Code
├── scripts/                   # Deployment and management scripts
├── docs/                      # Documentation
├── docker-compose.prod.yml    # Production container orchestration
├── .env.example              # Environment template
├── README.md                 # Project overview
└── [component-directories]/   # Individual app repositories
```

## 🛠️ Development Workflow

### For Main Repository (Infrastructure & Deployment)
```bash
git clone https://github.com/YOUR-USERNAME/mediasoup-video-call.git
cd mediasoup-video-call

# Make infrastructure changes
# Edit .github/workflows/deploy.yml, aws/cloudformation/, etc.
git add .
git commit -m "feat: update deployment configuration"
git push origin main
```

### For Individual Components
```bash
# Frontend development
cd videocall
git checkout -b feature/new-ui-component
# Make changes...
git commit -m "feat: add new video controls"
git push origin feature/new-ui-component

# Backend development  
cd ../videocallbackend
git checkout -b feature/mediasoup-upgrade
# Make changes...
git commit -m "feat: upgrade MediaSoup to v3.14"
git push origin feature/mediasoup-upgrade
```

## 📦 Deployment Process

### 1. Component Updates
When you update individual components, the main repository CI/CD will automatically:
- Pull latest code from each repository
- Build Docker images
- Deploy to AWS ECS

### 2. Infrastructure Updates
When you update the main repository:
- GitHub Actions triggers
- Runs tests and security scans
- Updates AWS infrastructure if needed
- Deploys updated application stack

## 🔧 Management Commands

### Repository Status
```powershell
# Check all repository status
foreach ($repo in @(".", "videocall", "videocallbackend", "VideoCallApp")) {
    Write-Host "`n=== $repo ===" -ForegroundColor Yellow
    Push-Location $repo
    git status --short
    git log --oneline -3
    Pop-Location
}
```

### Sync All Repositories
```powershell
# Update all repositories to latest
foreach ($repo in @("videocall", "videocallbackend", "VideoCallApp")) {
    Write-Host "`nUpdating $repo..." -ForegroundColor Green
    Push-Location $repo
    git fetch origin
    git pull origin main
    Pop-Location
}
```

### Clean Development Environment
```powershell
# Clean all build artifacts
foreach ($repo in @("videocall", "videocallbackend", "VideoCallApp")) {
    Push-Location $repo
    if (Test-Path "node_modules") { Remove-Item "node_modules" -Recurse -Force }
    if (Test-Path "dist") { Remove-Item "dist" -Recurse -Force }
    if (Test-Path ".next") { Remove-Item ".next" -Recurse -Force }
    Pop-Location
}
```

## 🎯 Next Steps

1. **Choose your approach**: Main repository + individual repos (recommended) or submodules
2. **Set up main repository remote**: Create GitHub repository and configure origin
3. **Update component repositories**: Ensure they're up to date and properly configured
4. **Test CI/CD pipeline**: Push changes and verify deployment works
5. **Document team workflow**: Share this guide with your development team

## 🔍 Benefits of This Structure

### ✅ Development Benefits
- **Independent development**: Teams can work on components separately
- **Version control**: Each component has its own release cycle
- **Code ownership**: Clear responsibility boundaries
- **Easy testing**: Component-specific test suites

### ✅ Deployment Benefits  
- **Unified deployment**: Single CI/CD pipeline for entire platform
- **Infrastructure consistency**: Shared AWS resources and configuration
- **Environment management**: Consistent environment variables and secrets
- **Monitoring**: Centralized logging and metrics

### ✅ Maintenance Benefits
- **Dependency management**: Clear dependency relationships
- **Security scanning**: Comprehensive vulnerability assessment
- **Documentation**: Single source of truth for deployment and architecture
- **Backup and recovery**: Simplified disaster recovery procedures

---

**🎉 Your multi-repository structure is now optimized for both development flexibility and production deployment!**