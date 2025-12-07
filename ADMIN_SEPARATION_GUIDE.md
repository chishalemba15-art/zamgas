# Admin User Separation Implementation Guide

**Date:** December 2, 2025
**Purpose:** Separate admin users from regular users (providers, customers, couriers)

---

## Overview

This guide implements a complete separation between admin users and regular platform users:
- **Admin users** → stored in `admin_users` table, separate authentication
- **Regular users** → stored in `users` table (providers, customers, couriers)

---

## What's Been Created

### 1. Database Migration
**File:** `separate_admin_migration.sql`
- Creates standalone `admin_users` table
- Creates `admin_activity_log` for audit trail
- Drops old `admin_users` table that referenced `users`
- Includes default super admin user

### 2. Admin Auth Service
**File:** `internal/admin/auth_service.go`
- `AdminSignIn()` - separate admin login
- `GenerateAdminToken()` - creates JWT with "type": "admin"
- `ValidateAdminToken()` - validates admin-only tokens
- `GetAdminByEmail()` - retrieves admin by email
- `GetAdminByID()` - retrieves admin by ID
- `LogAdminActivity()` - logs admin actions

### 3. Admin Auth Handlers
**File:** `cmd/server/admin_auth_handlers.go`
- `handleAdminLogin()` - POST `/admin/login` endpoint
- `adminAuthMiddleware()` - protects admin routes
- `handleGetAdminInfo()` - GET `/admin/me` endpoint

### 4. Admin Seed Script
**File:** `cmd/seed/seed_admin.go`
- Seeds initial admin user: admin@lpgfinder.com / admin123

---

## Implementation Steps

### Step 1: Deploy the Migration to Neon

```bash
# Connect to Neon database
PGPASSWORD=npg_EzOo3S0rwNpT psql \\
  -h ep-shy-lake-a-adm3ldex-pooler.us-east-1.aws.neon.tech \\
  -U neondb_owner \\
  -d neondb \\
  -f separate_admin_migration.sql
```

### Step 2: Update main.go

Add the admin auth service and update routes:

```go
// In cmd/server/main.go

// Add after creating other services:
adminAuthService := admin.NewAdminAuthService(pool, jwtSecret)

// Add admin login endpoint (NO middleware - it's for logging in):
router.POST("/admin/login", handleAdminLogin(adminAuthService))

// Add admin info endpoint (with middleware):
router.GET("/admin/me", adminAuthMiddleware(adminAuthService), handleGetAdminInfo(adminAuthService))

// Update ALL admin routes to use the new middleware:
adminRoutes := router.Group("/admin", adminAuthMiddleware(adminAuthService))
{
    // All your existing admin routes here...
    adminRoutes.GET("/dashboard/stats", ...)
    adminRoutes.GET("/users", ...)
    // etc.
}
```

### Step 3: Run the Seed Script

```bash
cd /path/to/server
go run ./cmd/seed/main.go
```

This will create the admin user in both tables (old and new).

### Step 4: Build and Test Locally

```bash
# Build
go build -o server ./cmd/server

# Run
DATABASE_URL="postgresql://..." ./server
```

### Step 5: Test Admin Login

```bash
# Test admin login (separate endpoint)
curl -X POST http://localhost:8080/admin/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@lpgfinder.com","password":"admin123"}'

# Should return admin token with "type": "admin" in JWT claims
```

### Step 6: Update Frontend Admin Login

Update `frontend/lib/api.ts`:

```typescript
// Change admin login endpoint
export const adminAPI = {
  // OLD: POST /auth/signin
  // NEW: POST /admin/login
  login: async (email: string, password: string) => {
    const response = await api.post('/admin/login', { email, password })
    return response.data
  },

  // Get admin info
  getMe: async () => {
    const response = await api.get('/admin/me')
    return response.data.admin
  },

  // ... rest of admin endpoints
}
```

### Step 7: Deploy to AWS

```bash
# Build Docker image
docker build --platform linux/amd64 \\
  -t 296093722884.dkr.ecr.us-east-1.amazonaws.com/lpg-delivery-backend:v12 \\
  -t 296093722884.dkr.ecr.us-east-1.amazonaws.com/lpg-delivery-backend:latest \\
  .

# Login to ECR
aws ecr get-login-password --region us-east-1 | \\
  docker login --username AWS --password-stdin \\
  296093722884.dkr.ecr.us-east-1.amazonaws.com

# Push
docker push 296093722884.dkr.ecr.us-east-1.amazonaws.com/lpg-delivery-backend:v12
docker push 296093722884.dkr.ecr.us-east-1.amazonaws.com/lpg-delivery-backend:latest

# Update ECS
aws ecs update-service \\
  --cluster zamgas-cluster \\
  --service zamgas-service \\
  --force-new-deployment \\
  --region us-east-1
```

---

## API Changes

### Admin Authentication

**OLD Endpoint:**
```
POST /auth/signin
Body: {"email": "admin@lpgfinder.com", "password": "admin123"}
Returns: User token (stored in users table)
```

**NEW Endpoint:**
```
POST /admin/login
Body: {"email": "admin@lpgfinder.com", "password": "admin123"}
Returns: Admin token (from admin_users table)

Response:
{
  "token": "eyJhbGc...",
  "admin": {
    "id": "a0000000-0000-0000-0000-000000000001",
    "email": "admin@lpgfinder.com",
    "name": "Admin User",
    "admin_role": "super_admin",
    "permissions": ["*"]
  }
}
```

### Admin Info Endpoint (NEW)

```
GET /admin/me
Header: Authorization: Bearer <admin-token>

Response:
{
  "admin": {
    "id": "...",
    "email": "admin@lpgfinder.com",
    "name": "Admin User",
    "admin_role": "super_admin",
    "permissions": ["*"],
    "last_login": "2025-12-02T10:30:00Z",
    "created_at": "2025-11-29T20:18:20Z"
  }
}
```

### Provider/Customer/Courier Login (UNCHANGED)

```
POST /auth/signin
Body: {"email": "provider@example.com", "password": "password123"}
Returns: User token (from users table)
```

---

## JWT Token Differences

### Admin Token
```json
{
  "admin_id": "a0000000-0000-0000-0000-000000000001",
  "role": "super_admin",
  "type": "admin",  // ← KEY DIFFERENCE
  "exp": 1670000000
}
```

### User Token
```json
{
  "user_id": "867df509-fe3d-4b31-bd7a-43e6220ef000",
  "exp": 1670000000
  // No "type" field
}
```

---

## Database Schema

### admin_users Table
```sql
CREATE TABLE admin_users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,  -- bcrypt hashed
    name TEXT NOT NULL,
    admin_role TEXT NOT NULL,  -- super_admin, manager, analyst, support
    permissions TEXT[],
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### admin_activity_log Table
```sql
CREATE TABLE admin_activity_log (
    id UUID PRIMARY KEY,
    admin_id UUID REFERENCES admin_users(id),
    action TEXT NOT NULL,
    resource_type TEXT,  -- 'user', 'provider', 'order', etc.
    resource_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Security Improvements

### Before
- ✗ Admin was just a user with `user_type = 'provider'`
- ✗ Admin could accidentally be treated as a regular provider
- ✗ No separation of concerns
- ✗ No dedicated admin audit log

### After
- ✅ Admin has separate table and authentication
- ✅ Admin tokens have `"type": "admin"` claim
- ✅ Clear separation between admin and platform users
- ✅ Dedicated admin activity logging
- ✅ Admin middleware specifically checks admin_users table
- ✅ Cannot confuse admin with provider/customer/courier

---

## Frontend Changes Needed

### 1. Update Admin Login Page
**File:** `frontend/app/admin/login/page.tsx`

Change the API endpoint:
```typescript
// OLD
const response = await api.post('/auth/signin', { email, password })

// NEW
const response = await api.post('/admin/login', { email, password })
```

### 2. Update Admin Store
**File:** `frontend/store/adminStore.ts`

Store admin-specific data:
```typescript
interface AdminState {
  admin: {
    id: string
    email: string
    name: string
    admin_role: string
    permissions: string[]
  } | null
  token: string | null
  // ...
}
```

### 3. Update Admin API Client
**File:** `frontend/lib/api.ts`

Add admin-specific endpoints:
```typescript
export const adminAPI = {
  login: (email: string, password: string) =>
    api.post('/admin/login', { email, password }),

  getMe: () =>
    api.get('/admin/me'),

  // All other admin endpoints stay the same
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  // ...
}
```

---

## Testing Checklist

### Backend
- [ ] Migration runs successfully on Neon
- [ ] Seed creates admin in admin_users table
- [ ] `POST /admin/login` returns admin token
- [ ] `GET /admin/me` returns admin info
- [ ] Admin token has `"type": "admin"` claim
- [ ] Admin middleware blocks user tokens
- [ ] Admin middleware allows admin tokens
- [ ] All admin endpoints require admin token
- [ ] Provider/customer login still works with `/auth/signin`

### Frontend
- [ ] Admin login page uses `/admin/login`
- [ ] Admin dashboard loads after login
- [ ] Admin token stored in localStorage
- [ ] Admin endpoints receive correct Authorization header
- [ ] Provider login still works (separate flow)
- [ ] Customer login still works (separate flow)

---

## Rollback Plan

If something goes wrong:

### 1. Revert Migration
```sql
DROP TABLE IF EXISTS admin_activity_log;
DROP TABLE IF EXISTS admin_users;

-- Recreate old admin_users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    admin_role TEXT,
    -- ...old schema
);
```

### 2. Revert Backend Code
- Remove `adminAuthService` from main.go
- Remove `/admin/login` endpoint
- Restore old admin middleware that checks users table

### 3. Revert Frontend
- Change back to `/auth/signin` for admin login

---

## Next Steps

After implementing this separation:

1. **Create Admin Management Pages:**
   - Providers management page
   - Customers management page
   - Couriers management page

2. **Add Admin Activity Logging:**
   - Log all admin actions automatically
   - Create admin activity dashboard

3. **Implement Role-Based Permissions:**
   - Super admin: full access
   - Manager: can't delete users
   - Analyst: read-only access
   - Support: limited access

4. **Add Admin Password Reset:**
   - Separate password reset flow for admins
   - Email-based verification

---

## Summary

**What Changed:**
- Admin users now in separate `admin_users` table
- Admin login at `/admin/login` (not `/auth/signin`)
- Admin tokens have `"type": "admin"` claim
- Admin middleware validates against `admin_users` table
- Clear separation between admin and platform users

**What Stayed the Same:**
- Provider/Customer/Courier login at `/auth/signin`
- All admin endpoint paths (`/admin/*`)
- Admin dashboard functionality
- Database queries for users, orders, etc.

**Benefits:**
- ✅ Better security
- ✅ Clear separation of concerns
- ✅ Audit trail for admin actions
- ✅ Can't confuse admin with regular users
- ✅ Easier to manage admin permissions

---

**Status:** Ready for implementation
**Next Action:** Run the migration on Neon database
