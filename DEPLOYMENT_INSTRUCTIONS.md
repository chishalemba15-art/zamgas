# 🚀 Deployment Instructions - Admin Endpoints v11

**All admin endpoints are implemented and ready to deploy!**

---

## Prerequisites

✅ Docker Desktop installed and running
✅ AWS CLI configured
✅ Access to ECR and ECS (already configured)

---

## Quick Deploy (Automated Script)

### Step 1: Start Docker Desktop

Make sure Docker Desktop is running on your Mac.

### Step 2: Run the Deployment Script

```bash
cd /Users/yakumwamba/CodeWithYaku/School\ Project\ -\ CS/lpg_delivery/server
./DEPLOY_TO_AWS.sh
```

This script will:
1. ✅ Build Docker image for linux/amd64
2. ✅ Login to AWS ECR
3. ✅ Push image as v11 and latest
4. ✅ Register new ECS task definition
5. ✅ Deploy to ECS with zero downtime
6. ✅ Show you the new public IP

**Estimated time:** 5-8 minutes

---

## Manual Deployment (If Script Fails)

### Step 1: Build Docker Image

```bash
cd /Users/yakumwamba/CodeWithYaku/School\ Project\ -\ CS/lpg_delivery/server

docker build --platform linux/amd64 \
  -t 296093722884.dkr.ecr.us-east-1.amazonaws.com/lpg-delivery-backend:v11 \
  -t 296093722884.dkr.ecr.us-east-1.amazonaws.com/lpg-delivery-backend:latest \
  .
```

### Step 2: Login to ECR

```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  296093722884.dkr.ecr.us-east-1.amazonaws.com
```

### Step 3: Push Images

```bash
docker push 296093722884.dkr.ecr.us-east-1.amazonaws.com/lpg-delivery-backend:v11
docker push 296093722884.dkr.ecr.us-east-1.amazonaws.com/lpg-delivery-backend:latest
```

### Step 4: Update ECS Task Definition

```bash
# Get current task definition
aws ecs describe-task-definition \
  --task-definition zamgas-task \
  --region us-east-1 \
  --query 'taskDefinition' > task-def.json

# Edit task-def.json to change image to v11
# Then register new version:

aws ecs register-task-definition \
  --cli-input-json file://task-def.json \
  --region us-east-1
```

### Step 5: Update ECS Service

```bash
aws ecs update-service \
  --cluster zamgas-cluster \
  --service zamgas-service \
  --force-new-deployment \
  --region us-east-1
```

### Step 6: Get New Public IP

```bash
# Wait for deployment to complete (2-3 minutes)
aws ecs wait services-stable \
  --cluster zamgas-cluster \
  --services zamgas-service \
  --region us-east-1

# Get the running task
TASK_ARN=$(aws ecs list-tasks \
  --cluster zamgas-cluster \
  --service-name zamgas-service \
  --desired-status RUNNING \
  --region us-east-1 \
  --query 'taskArns[0]' \
  --output text)

# Get ENI ID
ENI_ID=$(aws ecs describe-tasks \
  --cluster zamgas-cluster \
  --tasks $TASK_ARN \
  --region us-east-1 \
  --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
  --output text)

# Get Public IP
PUBLIC_IP=$(aws ec2 describe-network-interfaces \
  --network-interface-ids $ENI_ID \
  --region us-east-1 \
  --query 'NetworkInterfaces[0].Association.PublicIp' \
  --output text)

echo "New Backend URL: http://$PUBLIC_IP:8080"
```

---

## Testing the Deployment

### Test 1: Health Check

```bash
curl http://<PUBLIC_IP>:8080/
```

Expected: Connection successful

### Test 2: Dashboard Stats (Requires Admin Token)

```bash
# First, login as admin to get token
curl -X POST http://<PUBLIC_IP>:8080/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lpgfinder.com",
    "password": "SecureAdminPass123!"
  }'

# Copy the token from response, then:
curl http://<PUBLIC_IP>:8080/admin/dashboard/stats \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Expected Response:
```json
{
  "totalUsers": 11,
  "activeOrders": 0,
  "totalRevenue": 0,
  "activeProviders": 10
}
```

### Test 3: List Users

```bash
curl http://<PUBLIC_IP>:8080/admin/users \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Expected: JSON array of users with pagination

### Test 4: List Providers

```bash
curl http://<PUBLIC_IP>:8080/admin/providers \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

Expected: JSON array of providers

---

## Update Frontend

Once deployment is successful, update the frontend:

### Option 1: For Production Build

```bash
cd frontend

# Update .env.production
echo "NEXT_PUBLIC_API_URL=http://<NEW_PUBLIC_IP>:8080" > .env.production

# Build and start
npm run build
npm start
```

### Option 2: For Development Testing

```bash
cd frontend

# Update .env.local
echo "NEXT_PUBLIC_API_URL=http://<NEW_PUBLIC_IP>:8080" > .env.local

# Start dev server
npm run dev
```

Then open: http://localhost:3000/admin

---

## What's Deployed in v11

✅ **Dashboard & Analytics**
- GET /admin/dashboard/stats
- GET /admin/analytics/revenue
- GET /admin/analytics/orders
- GET /admin/analytics/user-growth

✅ **Users Management**
- GET /admin/users (list with pagination)
- GET /admin/users/:id (details)
- PUT /admin/users/:id (update)
- PUT /admin/users/:id/block
- PUT /admin/users/:id/unblock
- DELETE /admin/users/:id

✅ **Providers Management**
- GET /admin/providers (list)
- GET /admin/providers/:id
- PUT /admin/providers/:id (update)
- PUT /admin/providers/:id/status
- PUT /admin/providers/:id/verify
- PUT /admin/providers/:id/suspend

✅ **Couriers Management**
- GET /admin/couriers (list)
- GET /admin/couriers/:id
- PUT /admin/couriers/:id/status
- PUT /admin/couriers/:id/suspend

✅ **Orders Management**
- GET /admin/orders (list)
- GET /admin/orders/:id
- PUT /admin/orders/:id/status
- PUT /admin/orders/:id/moderate
- PUT /admin/orders/:id/cancel

✅ **Settings & Reports**
- GET /admin/settings
- PUT /admin/settings
- GET /admin/reports
- GET /admin/disputes
- PUT /admin/disputes/:id/resolve
- GET /admin/export/:type
- GET /admin/logs/audit

---

## Troubleshooting

### Issue: Docker daemon not running
**Solution:** Start Docker Desktop application

### Issue: AWS credentials not found
**Solution:** Run `aws configure` and enter your credentials

### Issue: Image push fails
**Solution:**
```bash
# Re-authenticate with ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  296093722884.dkr.ecr.us-east-1.amazonaws.com
```

### Issue: ECS deployment stuck
**Solution:**
```bash
# Check service events
aws ecs describe-services \
  --cluster zamgas-cluster \
  --services zamgas-service \
  --region us-east-1 \
  --query 'services[0].events[0:5]'
```

---

## Rollback (If Needed)

If something goes wrong, rollback to previous version:

```bash
aws ecs update-service \
  --cluster zamgas-cluster \
  --service zamgas-service \
  --task-definition zamgas-task:10 \
  --force-new-deployment \
  --region us-east-1
```

---

## Next Steps After Deployment

1. ✅ Get the new public IP
2. ✅ Test admin endpoints with curl
3. ✅ Update frontend .env files
4. ✅ Test admin dashboard in browser
5. ✅ Verify all CRUD operations work
6. 🎉 Admin system is live!

---

**Questions or issues?** Check CloudWatch Logs:

```bash
aws logs tail /ecs/zamgas --follow --region us-east-1
```
