#!/bin/bash

# AWS ECR Deployment Script for ZamGas LPG Delivery System
# This script builds and pushes the Docker image to AWS ECR

set -e  # Exit on error

# Configuration
AWS_REGION="eu-north-1"
AWS_ACCOUNT_ID="296093722884"
ECR_REPOSITORY="zamgas"
IMAGE_TAG="${1:-latest}"  # Use first argument or default to 'latest'

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Print header
print_message "$BLUE" "=========================================="
print_message "$BLUE" "  ZamGas AWS ECR Deployment Script"
print_message "$BLUE" "=========================================="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_message "$RED" "❌ AWS CLI is not installed. Please install it first."
    echo "Visit: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_message "$RED" "❌ Docker is not installed. Please install it first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    print_message "$RED" "❌ Docker daemon is not running. Please start Docker."
    exit 1
fi

print_message "$GREEN" "✅ Prerequisites check passed"
echo ""

# Step 1: Authenticate with AWS ECR
print_message "$YELLOW" "🔐 Step 1: Authenticating with AWS ECR..."
aws ecr get-login-password --region ${AWS_REGION} | \
    docker login --username AWS --password-stdin \
    ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

if [ $? -eq 0 ]; then
    print_message "$GREEN" "✅ Successfully authenticated with AWS ECR"
else
    print_message "$RED" "❌ Failed to authenticate with AWS ECR"
    exit 1
fi
echo ""

# Step 2: Build Docker image
print_message "$YELLOW" "🔨 Step 2: Building Docker image..."
docker build --platform=linux/amd64 -t ${ECR_REPOSITORY}:${IMAGE_TAG} .

if [ $? -eq 0 ]; then
    print_message "$GREEN" "✅ Docker image built successfully"
else
    print_message "$RED" "❌ Failed to build Docker image"
    exit 1
fi
echo ""

# Step 3: Tag the image
print_message "$YELLOW" "🏷️  Step 3: Tagging Docker image..."
docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} \
    ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}

if [ $? -eq 0 ]; then
    print_message "$GREEN" "✅ Image tagged successfully"
else
    print_message "$RED" "❌ Failed to tag image"
    exit 1
fi
echo ""

# Step 4: Push to ECR
print_message "$YELLOW" "📤 Step 4: Pushing image to AWS ECR..."
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}

if [ $? -eq 0 ]; then
    print_message "$GREEN" "✅ Image pushed successfully to ECR"
else
    print_message "$RED" "❌ Failed to push image to ECR"
    exit 1
fi
echo ""

# Print summary
print_message "$BLUE" "=========================================="
print_message "$GREEN" "🎉 Deployment completed successfully!"
print_message "$BLUE" "=========================================="
echo ""
print_message "$BLUE" "Image Details:"
echo "  Repository: ${ECR_REPOSITORY}"
echo "  Tag: ${IMAGE_TAG}"
echo "  Full URI: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}"
echo ""
print_message "$YELLOW" "Next Steps:"
echo "  1. Update your ECS task definition or deployment configuration"
echo "  2. Deploy the new image to your environment"
echo "  3. Verify the deployment and check application logs"
echo ""
