#!/bin/bash

# AWS Deployment Script for Admin Endpoints
# Run this after starting Docker Desktop

set -e  # Exit on error

echo "🚀 Starting AWS Deployment Process..."
echo ""

# Step 1: Build Docker Image
echo "📦 Step 1/5: Building Docker image for linux/amd64..."
docker build --platform linux/amd64 \
  -t 296093722884.dkr.ecr.us-east-1.amazonaws.com/lpg-delivery-backend:v11 \
  -t 296093722884.dkr.ecr.us-east-1.amazonaws.com/lpg-delivery-backend:latest \
  .

echo "✅ Docker image built successfully!"
echo ""

# Step 2: Login to ECR
echo "🔐 Step 2/5: Logging into AWS ECR..."
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  296093722884.dkr.ecr.us-east-1.amazonaws.com

echo "✅ Logged into ECR successfully!"
echo ""

# Step 3: Push images
echo "⬆️  Step 3/5: Pushing images to ECR..."
echo "  → Pushing v11 tag..."
docker push 296093722884.dkr.ecr.us-east-1.amazonaws.com/lpg-delivery-backend:v11

echo "  → Pushing latest tag..."
docker push 296093722884.dkr.ecr.us-east-1.amazonaws.com/lpg-delivery-backend:latest

echo "✅ Images pushed successfully!"
echo ""

# Step 4: Update ECS task definition
echo "📝 Step 4/5: Registering new ECS task definition..."

# Get the current task definition
TASK_DEF=$(aws ecs describe-task-definition \
  --task-definition zamgas-task \
  --region us-east-1 \
  --query 'taskDefinition' \
  --output json)

# Update the image to v11
NEW_TASK_DEF=$(echo $TASK_DEF | jq --arg IMAGE "296093722884.dkr.ecr.us-east-1.amazonaws.com/lpg-delivery-backend:v11" \
  'del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy) |
   .containerDefinitions[0].image = $IMAGE')

# Register the new task definition
NEW_REVISION=$(echo $NEW_TASK_DEF | aws ecs register-task-definition \
  --cli-input-json file:///dev/stdin \
  --region us-east-1 \
  --query 'taskDefinition.revision' \
  --output text)

echo "✅ New task definition registered: zamgas-task:$NEW_REVISION"
echo ""

# Step 5: Update ECS service
echo "🔄 Step 5/5: Updating ECS service with new task definition..."
aws ecs update-service \
  --cluster zamgas-cluster \
  --service zamgas-service \
  --task-definition zamgas-task:$NEW_REVISION \
  --force-new-deployment \
  --region us-east-1 \
  --output json > /dev/null

echo "✅ ECS service updated! New deployment started."
echo ""

# Wait for deployment
echo "⏳ Waiting for deployment to complete..."
echo "   This may take 2-3 minutes..."

# Wait for service to stabilize
aws ecs wait services-stable \
  --cluster zamgas-cluster \
  --services zamgas-service \
  --region us-east-1

echo "✅ Deployment completed successfully!"
echo ""

# Get the new public IP
echo "🔍 Getting new task information..."
TASK_ARN=$(aws ecs list-tasks \
  --cluster zamgas-cluster \
  --service-name zamgas-service \
  --desired-status RUNNING \
  --region us-east-1 \
  --query 'taskArns[0]' \
  --output text)

TASK_DETAILS=$(aws ecs describe-tasks \
  --cluster zamgas-cluster \
  --tasks $TASK_ARN \
  --region us-east-1 \
  --query 'tasks[0]' \
  --output json)

ENI_ID=$(echo $TASK_DETAILS | jq -r '.attachments[0].details[] | select(.name=="networkInterfaceId").value')
PUBLIC_IP=$(aws ec2 describe-network-interfaces \
  --network-interface-ids $ENI_ID \
  --region us-east-1 \
  --query 'NetworkInterfaces[0].Association.PublicIp' \
  --output text)

echo ""
echo "=========================================="
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "=========================================="
echo ""
echo "Backend URL: http://$PUBLIC_IP:8080"
echo "Task Definition: zamgas-task:$NEW_REVISION"
echo "Task ARN: $TASK_ARN"
echo ""
echo "📋 Test Admin Endpoints:"
echo "  Dashboard Stats:  curl http://$PUBLIC_IP:8080/admin/dashboard/stats"
echo "  Users List:       curl http://$PUBLIC_IP:8080/admin/users"
echo "  Providers List:   curl http://$PUBLIC_IP:8080/admin/providers"
echo "  Orders List:      curl http://$PUBLIC_IP:8080/admin/orders"
echo ""
echo "🌐 Update Frontend:"
echo "  Update frontend/.env.production with:"
echo "  NEXT_PUBLIC_API_URL=http://$PUBLIC_IP:8080"
echo ""
echo "=========================================="
