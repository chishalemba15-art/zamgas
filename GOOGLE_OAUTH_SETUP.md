# Google OAuth Setup Guide for Local Supabase

This guide shows you how to set up and integrate Google OAuth with your LPG Delivery System using local Supabase.

## Prerequisites

✅ **Already Completed:**
- Local Supabase Docker setup running
- Google OAuth credentials created
- Supabase `.env` updated with Google credentials
- Server `.env` pointing to local Supabase

**Credentials Summary:**
- Client ID: `798671276391-l1v422su0s5keml18aela3c9meigao20.apps.googleusercontent.com`
- Project ID: `lpg-gas-finder`
- Supabase URL: `http://localhost:8000`

## Step 1: Add Google OAuth Routes to Main Server

Update your `/cmd/server/main.go` to include the Google OAuth routes:

```go
// Initialize Google OAuth Service
googleOAuthService := auth.NewGoogleOAuthService(pgPool, userService, authService)

// Add Google OAuth routes
authGroup := router.Group("/auth")
{
    // Existing auth routes...
    authGroup.POST("/signup", handleSignUp(authService))
    authGroup.POST("/signin", handleSignIn(authService))

    // New Google OAuth routes
    authGroup.GET("/google/init", googleOAuthService.HandleGoogleAuthInit())
    authGroup.POST("/google/callback", googleOAuthService.HandleSupabaseCallback())
    authGroup.POST("/google/exchange", googleOAuthService.HandleExchangeSupabaseToken())
    authGroup.POST("/google/signup", googleOAuthService.HandleGoogleSignUp())
    authGroup.POST("/google/verify", googleOAuthService.HandleVerifyGoogleToken())
    authGroup.GET("/google/info", googleOAuthService.HandleGoogleAuthInfo())
}
```

## Step 2: Frontend Integration (Web/Mobile)

### For Web Frontend

```javascript
// 1. Get the Google Auth URL
const response = await fetch('http://localhost:8080/auth/google/init?redirect_url=http://localhost:3000/auth/callback');
const data = await response.json();
window.location.href = data.auth_url;

// 2. After redirect from Google, Supabase will redirect to your callback
// Handle the callback at http://localhost:3000/auth/callback
const handleGoogleCallback = async () => {
    // Get the access token from the URL or Supabase session
    const supabaseSession = JSON.parse(localStorage.getItem('sb-gxcqcwbdgucgrwanwccb-auth-token'));

    const response = await fetch('http://localhost:8080/auth/google/exchange', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            access_token: supabaseSession.access_token,
            user_type: 'customer' // or 'provider'
        })
    });

    const data = await response.json();
    // Save the token and user data
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
};
```

### For React Native / Expo (Mobile)

```javascript
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest, ResponseType } from 'expo-auth-session';

export default function GoogleAuthScreen() {
  const discovery = {
    authorizationEndpoint: 'http://localhost:8000/auth/v1/authorize',
    tokenEndpoint: 'http://localhost:8000/auth/v1/token',
  };

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: '798671276391-l1v422su0s5keml18aela3c9meigao20.apps.googleusercontent.com',
      scopes: ['openid', 'profile', 'email'],
      redirectUrl: useURL(),
      responseType: ResponseType.Code,
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      // Exchange code for token via your backend
      exchangeCodeForToken(code);
    }
  }, [response]);

  return (
    <Button
      disabled={!request}
      title="Sign in with Google"
      onPress={() => promptAsync()}
    />
  );
}
```

## Step 3: API Endpoint Reference

### Get Google Auth URL
```bash
GET /auth/google/init?redirect_url=YOUR_CALLBACK_URL

Response:
{
  "auth_url": "http://localhost:8000/auth/v1/authorize?provider=google&redirect_to=...",
  "message": "Redirect to this URL to authenticate with Google"
}
```

### Exchange Supabase Token for App JWT
```bash
POST /auth/google/exchange
Content-Type: application/json

{
  "access_token": "supabase_session_token",
  "user_type": "customer"
}

Response:
{
  "message": "Successfully authenticated with Google",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "user_type": "customer"
  },
  "token": "your_app_jwt_token"
}
```

### Sign Up with Google
```bash
POST /auth/google/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "User Name",
  "picture": "https://...",
  "user_type": "customer"
}

Response:
{
  "message": "Successfully signed up with Google",
  "user": {...},
  "token": "jwt_token"
}
```

### Verify Google Token
```bash
POST /auth/google/verify
Content-Type: application/json

{
  "access_token": "google_access_token"
}

Response:
{
  "token": "app_jwt_token",
  "message": "Token verified successfully"
}
```

### Get Google Auth Info
```bash
GET /auth/google/info

Response:
{
  "provider": "google",
  "supabase_url": "http://localhost:8000",
  "endpoints": {
    "init": "/auth/google/init",
    "callback": "/auth/google/callback",
    "signup": "/auth/google/signup",
    "verify": "/auth/google/verify"
  },
  "required_env_vars": [...]
}
```

## Step 4: Configure Google Redirect URIs

Add these to your Google OAuth application (in Google Cloud Console):

**Authorized redirect URIs:**
- `http://localhost:8000/auth/v1/callback` (Supabase callback)
- `http://localhost:3000/auth/callback` (Frontend callback - adjust port as needed)
- `http://localhost:8080` (Backend redirect)
- For mobile: `exp://your-expo-username/--/oauth-redirect`

## Step 5: Test the Integration

### Test 1: Get Auth URL
```bash
curl http://localhost:8080/auth/google/init?redirect_url=http://localhost:3000/auth/callback
```

### Test 2: Full Flow (Manual)
1. Get auth URL from endpoint
2. Copy the URL and open in browser
3. Sign in with Google
4. Capture the access token from the redirect
5. Exchange token for JWT:
```bash
curl -X POST http://localhost:8080/auth/google/exchange \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "your_supabase_access_token",
    "user_type": "customer"
  }'
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend/Mobile App                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │   1. Request auth URL from server     │
        └───────────────────────────────────────┘
                            │
                            ▼
    ┌─────────────────────────────────────────────────┐
    │  2. Backend returns Supabase Google OAuth URL   │
    │  3. User redirects to Google login              │
    │  4. Google redirects to Supabase callback       │
    └─────────────────────────────────────────────────┘
                            │
                            ▼
    ┌──────────────────────────────────────────────────┐
    │  5. Client captures Supabase session token       │
    │  6. Client sends token to backend exchange       │
    │     endpoint                                      │
    └──────────────────────────────────────────────────┘
                            │
                            ▼
    ┌──────────────────────────────────────────────────┐
    │  7. Backend exchanges Supabase token for JWT     │
    │  8. Creates/updates user in PostgreSQL           │
    │  9. Returns JWT token to client                  │
    └──────────────────────────────────────────────────┘
                            │
                            ▼
    ┌──────────────────────────────────────────────────┐
    │  10. Client stores JWT in localStorage/secure    │
    │      storage                                      │
    │  11. Client uses JWT for all subsequent          │
    │      authenticated requests                       │
    └──────────────────────────────────────────────────┘
```

## Key Features Implemented

✅ **Google OAuth Integration**
- Supabase Auth handles Google OAuth flow
- Local Supabase support
- Automatic user creation/lookup

✅ **User Type Support**
- Customer
- Provider
- Courier
- Configurable on sign-up

✅ **JWT Token Management**
- Generate app-specific JWT tokens
- Validate tokens in middleware
- 60-day expiration (configurable)

✅ **Session Management**
- Supabase session handling
- Token exchange mechanism
- Stateless JWT authentication

## Troubleshooting

### Issue: "GOOGLE_CLIENT_ID not configured"
**Solution:** Ensure Google OAuth credentials are set in your `.env`:
```bash
GOOGLE_CLIENT_ID=798671276391-l1v422su0s5keml18aela3c9meigao20.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### Issue: "Supabase URL not reachable"
**Solution:** Verify local Supabase is running:
```bash
docker ps | grep supabase
curl http://localhost:8000/auth/v1/health
```

### Issue: "Invalid redirect URI"
**Solution:** Ensure the redirect URI is registered in Google Console:
- Go to Google Cloud Console → APIs & Services → Credentials
- Edit the OAuth 2.0 application
- Add your redirect URIs

### Issue: User not created after Google sign-up
**Solution:** Check database connection and user service logs:
```bash
docker exec lpg_delivery_server-supabase-db-1 psql -U postgres -c "SELECT * FROM users LIMIT 5;"
```

## Environment Variables Summary

**Server `.env` (Server Code):**
```bash
SUPABASE_URL=http://localhost:8000
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:5432/postgres
```

**Supabase `.env` (Docker Config):**
```bash
GOOGLE_CLIENT_ID=798671276391-l1v422su0s5keml18aela3c9meigao20.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_PROJECT_ID=lpg-gas-finder
GOOGLE_PROJECT_NUMBER=798671276391
```

## Next Steps

1. **Add the Google OAuth routes** to your `main.go` (see Step 1)
2. **Test the endpoints** using the API reference (see Step 5)
3. **Implement frontend integration** for your web/mobile app
4. **Update authentication middleware** to work with Google auth
5. **Add user profile** verification after Google sign-up (optional)

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Self-Hosted Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
