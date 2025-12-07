# Production Setup Guide

## Backend Deployment (AWS ECS)

### Current Production Environment

| Property    | Value                                                      |
|-------------|------------------------------------------------------------|
| **Service** | zamgas-service                                             |
| **Cluster** | zamgas-cluster                                             |
| **Public IP** | 44.195.43.147                                            |
| **Port**    | 8080                                                       |
| **Region**  | us-east-1                                                  |
| **Image**   | 296093722884.dkr.ecr.eu-west-2.amazonaws.com/zamgas:latest |
| **Status**  | ✅ Running                                                  |

### API Endpoints

**Base URL:** `http://44.195.43.147:8080`

- Authentication: `/auth/signup`, `/auth/signin`
- Providers: `/providers`
- Orders: `/user/orders`, `/provider/orders`
- Inventory: `/provider/inventory`

## Frontend Deployment

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd frontend
   vercel
   ```

3. **Configure Environment:**
   - In Vercel dashboard, go to Project Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL` = `http://44.195.43.147:8080`

4. **Redeploy:**
   ```bash
   vercel --prod
   ```

### Deploy to Netlify

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and Deploy:**
   ```bash
   cd frontend
   npm run build
   netlify deploy --prod
   ```

3. **Environment Variables:**
   - In Netlify dashboard, go to Site Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL` = `http://44.195.43.147:8080`

### Manual Deployment

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm run start
   ```

## Testing Production API

### Test Backend Connection

```bash
# Health check
curl http://44.195.43.147:8080/

# Test signup
curl -X POST http://44.195.43.147:8080/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "phone_number": "+260977123456",
    "user_type": "customer",
    "expoPushToken": "test-token"
  }'

# Test providers endpoint
curl http://44.195.43.147:8080/providers
```

### Test Frontend

1. **Start development server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open browser:**
   ```
   http://localhost:3000
   ```

3. **Test flow:**
   - Click "Get Started"
   - Create a customer account
   - Browse providers
   - Place an order
   - Check order history

## Environment Configuration

### Production (.env.production)
```env
NEXT_PUBLIC_API_URL=http://44.195.43.147:8080
```

### Development (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Example (.env.local.example)
```env
# Production server (deployed on AWS ECS)
NEXT_PUBLIC_API_URL=http://44.195.43.147:8080

# For local development, use:
# NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Monitoring

### Backend Logs
```bash
# View ECS logs
aws logs tail /ecs/zamgas --follow --region us-east-1

# Check service status
aws ecs describe-services \
  --cluster zamgas-cluster \
  --services zamgas-service \
  --region us-east-1
```

### Frontend Monitoring

- **Vercel:** Built-in analytics and monitoring
- **Netlify:** Analytics dashboard
- **Custom:** Use services like Sentry, LogRocket

## Troubleshooting

### CORS Issues

If you encounter CORS errors, the backend already has CORS enabled for all origins:

```go
// In cmd/server/main.go
router.Use(cors.New(cors.Config{
  AllowOrigins:     []string{"*"},
  AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
  AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
  ExposeHeaders:    []string{"Content-Length"},
  AllowCredentials: true,
  MaxAge:           12 * time.Hour,
}))
```

### API Connection Errors

1. **Check backend is running:**
   ```bash
   curl http://44.195.43.147:8080/
   ```

2. **Verify environment variable:**
   ```bash
   echo $NEXT_PUBLIC_API_URL
   ```

3. **Check browser console** for detailed error messages

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

## Security Notes

1. **HTTPS:** For production, use HTTPS with SSL/TLS
2. **Domain:** Point a custom domain to the IP address
3. **Secrets:** Never commit `.env.local` or `.env.production` files
4. **API Keys:** Store sensitive keys in environment variables

## Cost Optimization

Current setup is **FREE** under AWS Free Tier:

- ECS Fargate: 750 vCPU-hrs/month free
- ECR Storage: 500 MB free
- Data Transfer: 1 GB/month free
- Neon PostgreSQL: Free tier

## Next Steps

1. ✅ Backend deployed and running
2. ✅ Frontend configured for production API
3. ⏳ Deploy frontend to Vercel/Netlify
4. ⏳ Configure custom domain
5. ⏳ Add SSL/TLS certificate
6. ⏳ Set up monitoring and alerts

## Support

For issues or questions:
- Check application logs in AWS CloudWatch
- Verify environment variables
- Test API endpoints manually
- Check CORS configuration
