# Connection Reset Issue - Troubleshooting Report

**Date:** December 2, 2025
**Issue:** ERR_CONNECTION_RESET when accessing backend

---

## Summary

The backend v11 is deployed successfully on AWS ECS and all logs show the server is running correctly with all 32 admin endpoints registered. However, both curl and the frontend application receive "Connection reset by peer" errors when trying to access the backend.

---

## Current Status

**Backend URL:** `http://44.195.82.28:8080`
**Deployment:** v11 (task definition: zamgas-task:11)
**ECS Status:** RUNNING
**Container Status:** RUNNING (no crashes or restarts)

---

## Issue Details

### Symptoms

1. TCP handshake completes successfully (connection established)
2. HTTP request is sent
3. Connection immediately resets
4. Server logs show NO incoming requests
5. Issue persists across multiple task deployments
6. Same issue from both curl and frontend

### Curl Output
```bash
$ curl -v http://44.195.82.28:8080/providers
* Connected to 44.195.82.28 (44.195.82.28) port 8080
> GET /providers HTTP/1.1
> Host: 44.195.82.28:8080
...
* Request completely sent off
* Recv failure: Connection reset by peer
curl: (56) Recv failure: Connection reset by peer
```

### What We've Verified

✅ Server is running and healthy
✅ CloudWatch logs show all 32 endpoints registered
✅ Server listening on :8080
✅ Port mapping: 8080:8080 (correct)
✅ Security group allows port 8080 from 0.0.0.0/0
✅ Network ACLs allow all traffic
✅ VPC route table has Internet Gateway
✅ Public IP assigned (assignPublicIp: ENABLED)
✅ Subnet is public with IGW route
✅ No container crashes or restarts
✅ Tried fresh deployment (same issue)

### What's NOT Working

❌ TCP connection resets after handshake
❌ Server receives NO requests (no logs)
❌ Same issue from multiple networks (local machine, frontend)
❌ Both IPs exhibit same behavior:
   - 13.220.34.135 (first deployment)
   - 44.195.82.28 (redeployment)

---

## Possible Causes

### 1. Network/ISP Level Blocking

**Likelihood:** High

The fact that:
- Connection establishes (TCP works)
- Then immediately resets
- Server shows no logs
- Same pattern with Neon database connections locally

This suggests network-level interference, possibly:
- ISP blocking certain AWS IP ranges
- Regional network routing issues
- Corporate firewall/proxy
- VPN or network security software

**Test:** Try accessing from:
- Different network (mobile hotspot)
- Different device
- VPN to different region
- Browser directly (not frontend app)

### 2. AWS ECS/Fargate Networking Issue

**Likelihood:** Medium

There might be an issue with:
- ECS task networking in awsvpc mode
- Fargate platform version compatibility
- ENI configuration
- Task execution role permissions

**Test:**
- Check if other ECS tasks in same region work
- Try deploying in different AWS region
- Use EC2 instance instead of Fargate

### 3. Application Configuration

**Likelihood:** Low

While server logs show it's listening, there might be:
- Application crash on first request (though no error logs)
- CORS or middleware issue rejecting connections
- Gin framework configuration problem

**Test:**
- Add more verbose logging to main.go
- Test with health check endpoint
- Deploy a simple "hello world" Go server to isolate

### 4. Docker Container Issue

**Likelihood:** Very Low

The container might have:
- Incorrect network configuration
- User permission issues (running as non-root)
- Missing dependencies

---

## Recommended Next Steps

### Immediate Actions

1. **Try Different Network**
   ```bash
   # Connect to mobile hotspot and try:
   curl http://44.195.82.28:8080/providers
   ```

2. **Test from Browser**
   Open browser and go to: `http://44.195.82.28:8080/providers`
   (Bypass frontend app)

3. **Try Different Region**
   Consider deploying to us-west-2 or eu-west-1 to rule out regional issues

### Investigation Steps

4. **Enable CloudWatch Container Insights**
   - Get detailed networking metrics
   - Check for packet drops or errors

5. **Add Application Logging**
   - Add middleware to log all incoming connections
   - Add logging before Gin starts listening

6. **Try Simple Test Server**
   Deploy a minimal Go HTTP server to isolate the issue:
   ```go
   package main
   import (
       "fmt"
       "net/http"
   )
   func main() {
       http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
           fmt.Fprintf(w, "Hello!")
       })
       http.ListenAndServe(":8080", nil)
   }
   ```

### Alternative Solutions

7. **Use Application Load Balancer**
   - Create an ALB in front of ECS
   - ALB might handle connections better
   - Provides better debugging with access logs

8. **Use CloudFlare Tunnel**
   - Set up a CloudFlare tunnel to the backend
   - Bypass potential ISP/network issues
   - Get HTTPS for free

9. **Deploy to Different Platform**
   - Try AWS App Runner instead of ECS
   - Try AWS Elastic Beanstalk
   - Try deploying to Render or Railway

---

## Environment Files Updated

Both frontend env files have been updated with the new IP:

**frontend/.env.production:**
```env
NEXT_PUBLIC_API_URL=http://44.195.82.28:8080
```

**frontend/.env.local:**
```env
NEXT_PUBLIC_API_URL=http://44.195.82.28:8080
```

---

## Admin Endpoints Deployed

All 32 admin endpoints are deployed and ready:

### Dashboard & Analytics
- GET /admin/dashboard/stats
- GET /admin/analytics/revenue
- GET /admin/analytics/orders
- GET /admin/analytics/user-growth

### Users Management
- GET /admin/users
- GET /admin/users/:id
- PUT /admin/users/:id
- PUT /admin/users/:id/block
- PUT /admin/users/:id/unblock
- DELETE /admin/users/:id

### Providers Management
- GET /admin/providers
- GET /admin/providers/:id
- PUT /admin/providers/:id
- PUT /admin/providers/:id/status
- PUT /admin/providers/:id/verify
- PUT /admin/providers/:id/suspend

### Couriers Management
- GET /admin/couriers
- GET /admin/couriers/:id
- PUT /admin/couriers/:id/status
- PUT /admin/couriers/:id/suspend

### Orders Management
- GET /admin/orders
- GET /admin/orders/:id
- PUT /admin/orders/:id/status
- PUT /admin/orders/:id/moderate
- PUT /admin/orders/:id/cancel

### Settings & Reports
- GET /admin/settings
- PUT /admin/settings
- GET /admin/reports
- GET /admin/disputes
- PUT /admin/disputes/:id/resolve
- GET /admin/export/:type
- GET /admin/logs/audit

---

## Quick Commands

### Check Backend Status
```bash
aws ecs describe-services \
  --cluster zamgas-cluster \
  --services zamgas-service \
  --region us-east-1 \
  --query 'services[0].{status:status,runningCount:runningCount}'
```

### Get Current Public IP
```bash
TASK_ARN=$(aws ecs list-tasks --cluster zamgas-cluster --service-name zamgas-service --desired-status RUNNING --region us-east-1 --query 'taskArns[0]' --output text)
ENI_ID=$(aws ecs describe-tasks --cluster zamgas-cluster --tasks $TASK_ARN --region us-east-1 --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text)
aws ec2 describe-network-interfaces --network-interface-ids $ENI_ID --region us-east-1 --query 'NetworkInterfaces[0].Association.PublicIp' --output text
```

### View CloudWatch Logs
```bash
aws logs tail /ecs/zamgas --follow --region us-east-1
```

### Test Connectivity
```bash
curl -v http://44.195.82.28:8080/providers
```

---

## Conclusion

The backend is deployed and running correctly from a server perspective. The issue appears to be network-related, occurring between the client and the AWS infrastructure. The most likely cause is ISP-level blocking or regional network routing issues.

**Recommended immediate action:** Try accessing the backend from a different network (mobile hotspot) to confirm if it's a network-specific issue.

If the issue persists across all networks, consider deploying an Application Load Balancer or trying a different AWS service like App Runner for better connection handling.
