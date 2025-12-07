# ZamGas LPG Delivery System - AWS Deployment Guide

This guide walks you through deploying the ZamGas LPG delivery system to AWS using Docker and ECR.

## Prerequisites

Before deploying, ensure you have:

1. **AWS CLI** installed and configured
   ```bash
   aws --version
   aws configure  # Set up your AWS credentials
   ```

2. **Docker** installed and running
   ```bash
   docker --version
   docker info  # Verify Docker daemon is running
   ```

3. **AWS ECR Repository** created
   - Repository name: `zamgas`
   - Region: `eu-north-1`
   - Account ID: `296093722884`

## Quick Start

### Option 1: Using the Deployment Script (Recommended)

1. **Make the script executable:**
   ```bash
   chmod +x deploy-aws.sh
   ```

2. **Run the deployment:**
   ```bash
   # Deploy with 'latest' tag
   ./deploy-aws.sh

   # Deploy with custom tag (e.g., version number)
   ./deploy-aws.sh v1.0.0
   ```

The script will automatically:
- Authenticate with AWS ECR
- Build the Docker image
- Tag the image correctly
- Push to your ECR repository

### Option 2: Manual Deployment

If you prefer to run commands manually:

1. **Authenticate with AWS ECR:**
   ```bash
   aws ecr get-login-password --region eu-north-1 | \
     docker login --username AWS --password-stdin \
     296093722884.dkr.ecr.eu-north-1.amazonaws.com
   ```

2. **Build the Docker image:**
   ```bash
   docker build -t zamgas .
   ```

3. **Tag the image:**
   ```bash
   docker tag zamgas:latest \
     296093722884.dkr.ecr.eu-north-1.amazonaws.com/zamgas:latest
   ```

4. **Push to ECR:**
   ```bash
   docker push 296093722884.dkr.ecr.eu-north-1.amazonaws.com/zamgas:latest
   ```

## Environment Configuration

### Setting up Production Environment Variables

1. **Copy the production environment template:**
   ```bash
   cp .env.production.example .env.production
   ```

2. **Edit `.env.production` with your actual values:**
   - Update `DATABASE_URL` with your Neon connection string
   - Set a secure `JWT_SECRET` (use `openssl rand -base64 64`)
   - Configure Twilio credentials for SMS
   - Add PawaPay production API credentials
   - Update Google OAuth credentials

3. **Never commit `.env.production` to Git!** (already in .gitignore)

### Environment Variables for AWS Deployment

When deploying to AWS (ECS, Elastic Beanstalk, etc.), set these environment variables:

**Required:**
- `DATABASE_URL` - Neon PostgreSQL connection string
- `JWT_SECRET` - Secure random string for JWT tokens
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Twilio phone number
- `PAWAPAY_API_URL` - PawaPay API endpoint
- `PAWAPAY_API_TOKEN` - PawaPay API token

**Optional:**
- `PORT` - Server port (default: 8080)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- `GOOGLE_REDIRECT_URL` - OAuth callback URL

## Docker Image Details

The Dockerfile uses multi-stage builds for:
- **Smaller image size** (~20MB final image)
- **Better security** (runs as non-root user)
- **Production optimized** (stripped binaries)
- **Neon compatibility** (includes CA certificates for SSL)

### Key Features:
- Built with Go 1.24
- Platform: `linux/amd64`
- Health check endpoint configured
- Non-root user execution
- Timezone support (UTC default)

## Deployment to AWS Services

### AWS ECS (Elastic Container Service)

1. **Create a task definition:**
   ```json
   {
     "family": "zamgas-task",
     "containerDefinitions": [
       {
         "name": "zamgas-container",
         "image": "296093722884.dkr.ecr.eu-north-1.amazonaws.com/zamgas:latest",
         "portMappings": [
           {
             "containerPort": 8080,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "DATABASE_URL",
             "value": "your-neon-connection-string"
           },
           {
             "name": "PORT",
             "value": "8080"
           }
         ],
         "secrets": [
           {
             "name": "JWT_SECRET",
             "valueFrom": "arn:aws:secretsmanager:region:account:secret:jwt-secret"
           }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/zamgas",
             "awslogs-region": "eu-north-1",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ],
     "requiresCompatibilities": ["FARGATE"],
     "networkMode": "awsvpc",
     "cpu": "256",
     "memory": "512"
   }
   ```

2. **Create or update the service:**
   ```bash
   aws ecs create-service \
     --cluster zamgas-cluster \
     --service-name zamgas-service \
     --task-definition zamgas-task \
     --desired-count 1 \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
   ```

### AWS App Runner

```bash
aws apprunner create-service \
  --service-name zamgas-service \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "296093722884.dkr.ecr.eu-north-1.amazonaws.com/zamgas:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "8080",
        "RuntimeEnvironmentVariables": {
          "DATABASE_URL": "your-neon-connection-string",
          "JWT_SECRET": "your-jwt-secret"
        }
      }
    },
    "AutoDeploymentsEnabled": true
  }' \
  --instance-configuration '{
    "Cpu": "1024",
    "Memory": "2048"
  }'
```

### AWS Elastic Beanstalk

1. Create a `Dockerrun.aws.json`:
   ```json
   {
     "AWSEBDockerrunVersion": "1",
     "Image": {
       "Name": "296093722884.dkr.ecr.eu-north-1.amazonaws.com/zamgas:latest",
       "Update": "true"
     },
     "Ports": [
       {
         "ContainerPort": 8080
       }
     ]
   }
   ```

2. Deploy using EB CLI:
   ```bash
   eb init -p docker zamgas-app
   eb create zamgas-env
   eb deploy
   ```

## Monitoring and Logging

### Health Check
The application includes a health check endpoint:
- **Endpoint:** `http://localhost:8080/`
- **Interval:** 30 seconds
- **Timeout:** 3 seconds
- **Retries:** 3

### Viewing Logs

**Docker logs (local):**
```bash
docker logs <container-id>
```

**AWS CloudWatch (ECS):**
```bash
aws logs tail /ecs/zamgas --follow
```

## Troubleshooting

### Issue: Authentication Failed
**Solution:** Ensure AWS CLI is configured correctly
```bash
aws configure
aws ecr get-login-password --region eu-north-1
```

### Issue: Build Fails
**Solution:** Check Docker daemon is running and you have sufficient disk space
```bash
docker info
docker system df
```

### Issue: Push Fails
**Solution:** Verify ECR repository exists and you have permissions
```bash
aws ecr describe-repositories --repository-names zamgas --region eu-north-1
```

### Issue: Container Crashes on Startup
**Solution:** Check environment variables are set correctly
```bash
docker run --rm -it \
  -e DATABASE_URL="your-connection-string" \
  -e JWT_SECRET="your-secret" \
  zamgas:latest
```

## Security Best Practices

1. **Never commit secrets to Git**
   - Use AWS Secrets Manager or Parameter Store
   - Set environment variables at runtime

2. **Use specific image tags in production**
   ```bash
   ./deploy-aws.sh v1.2.3  # Not just 'latest'
   ```

3. **Regularly update dependencies**
   ```bash
   go get -u ./...
   go mod tidy
   ```

4. **Monitor for vulnerabilities**
   ```bash
   docker scan 296093722884.dkr.ecr.eu-north-1.amazonaws.com/zamgas:latest
   ```

## Rollback Strategy

If a deployment fails:

1. **Identify the last working image tag:**
   ```bash
   aws ecr list-images --repository-name zamgas --region eu-north-1
   ```

2. **Update ECS service to use previous version:**
   ```bash
   aws ecs update-service \
     --cluster zamgas-cluster \
     --service zamgas-service \
     --task-definition zamgas-task:PREVIOUS_REVISION
   ```

## Cost Optimization

- **ECR:** First 500MB storage is free, then $0.10/GB/month
- **ECS Fargate:** Pay for vCPU and memory resources used
- **Data Transfer:** First 1GB/month is free

**Tip:** Use AWS Cost Explorer to monitor your spending.

## Support

For issues or questions:
- Check application logs in CloudWatch
- Review Neon database connection status
- Verify all environment variables are set correctly

## Additional Resources

- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [Neon PostgreSQL Documentation](https://neon.tech/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
