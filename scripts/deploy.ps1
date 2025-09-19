#!/usr/bin/env pwsh
# AWS Deployment Script for MediaSoup Video Call Application

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("staging", "production")]
    [string]$Environment,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [string]$StackName = "mediasoup-$Environment",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipInfrastructure,
    
    [Parameter(Mandatory=$false)]
    [switch]$DeployOnly
)

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Blue

# Check AWS CLI
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Error "AWS CLI is not installed. Please install it first."
    exit 1
}

# Check Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not installed. Please install it first."
    exit 1
}

# Check if logged into AWS
try {
    aws sts get-caller-identity | Out-Null
} catch {
    Write-Error "Not logged into AWS. Please run 'aws configure' first."
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green

# Set environment variables
$env:AWS_DEFAULT_REGION = $Region
$repositoryPrefix = "mediasoup-$Environment"

Write-Host "🚀 Starting deployment for $Environment environment..." -ForegroundColor Yellow

if (-not $SkipInfrastructure) {
    Write-Host "📦 Deploying infrastructure..." -ForegroundColor Blue
    
    # Deploy CloudFormation stack
    aws cloudformation deploy `
        --template-file aws/cloudformation/infrastructure.yml `
        --stack-name $StackName `
        --parameter-overrides `
            Environment=$Environment `
            InstanceType=t3.medium `
        --capabilities CAPABILITY_IAM `
        --region $Region
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Infrastructure deployment failed"
        exit 1
    }
    
    Write-Host "✅ Infrastructure deployed successfully" -ForegroundColor Green
}

if (-not $DeployOnly) {
    Write-Host "🏗️ Building and pushing Docker images..." -ForegroundColor Blue
    
    # Get ECR login
    $ecrLoginCommand = aws ecr get-login-password --region $Region
    $ecrLoginCommand | docker login --username AWS --password-stdin "$((aws sts get-caller-identity --query Account --output text)).dkr.ecr.$Region.amazonaws.com"
    
    # Build and push backend image
    Write-Host "Building backend image..." -ForegroundColor Cyan
    $backendRepo = "$repositoryPrefix-backend"
    $backendUri = "$((aws sts get-caller-identity --query Account --output text)).dkr.ecr.$Region.amazonaws.com/$backendRepo"
    
    docker build -t "$backendUri`:latest" -f videocallbackend/Dockerfile.prod videocallbackend/
    docker push "$backendUri`:latest"
    
    # Build and push frontend image
    Write-Host "Building frontend image..." -ForegroundColor Cyan
    $frontendRepo = "$repositoryPrefix-frontend"
    $frontendUri = "$((aws sts get-caller-identity --query Account --output text)).dkr.ecr.$Region.amazonaws.com/$frontendRepo"
    
    docker build -t "$frontendUri`:latest" -f videocall/Dockerfile.prod videocall/
    docker push "$frontendUri`:latest"
    
    Write-Host "✅ Docker images built and pushed successfully" -ForegroundColor Green
}

Write-Host "🔧 Deploying ECS services..." -ForegroundColor Blue

# Update ECS services (this would be handled by GitHub Actions in practice)
Write-Host "Service deployment is handled by GitHub Actions CI/CD pipeline" -ForegroundColor Yellow
Write-Host "Push your code to the '$Environment' branch to trigger deployment" -ForegroundColor Yellow

Write-Host ""
Write-Host "🎉 Deployment process completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Set up your GitHub secrets for AWS credentials" -ForegroundColor White
Write-Host "2. Configure your domain and SSL certificate" -ForegroundColor White
Write-Host "3. Update environment variables in AWS Parameter Store" -ForegroundColor White
Write-Host "4. Push to the '$Environment' branch to trigger CI/CD" -ForegroundColor White
Write-Host ""

# Output useful information
try {
    $loadBalancerUrl = aws cloudformation describe-stacks --stack-name $StackName --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerURL'].OutputValue" --output text --region $Region
    if ($loadBalancerUrl) {
        Write-Host "🌐 Load Balancer URL: $loadBalancerUrl" -ForegroundColor Blue
    }
} catch {
    Write-Host "⚠️ Could not retrieve Load Balancer URL" -ForegroundColor Yellow
}