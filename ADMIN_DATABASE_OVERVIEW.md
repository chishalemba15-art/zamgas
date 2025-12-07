# LPG Delivery System - Admin Database Overview

## Database Summary

**Database Type:** PostgreSQL (Neon Cloud)
**Total Tables:** 16
**Total Users:** 41 (24 customers, 12 providers, 5 couriers)
**Total Orders:** 33
**Status:** Production Ready

---

## Core Tables

### 1. **users** (41 records)
Main user table for all system users (customers, providers, couriers).

**Key Fields:**
- `id` (UUID): Unique identifier
- `email` (TEXT UNIQUE): User email address
- `password` (TEXT): Bcrypt hashed password
- `name` (TEXT): User's full name
- `phone_number` (VARCHAR UNIQUE): Contact phone
- `user_type` (VARCHAR): 'customer' | 'provider' | 'courier'
- `rating` (INTEGER): User rating (0-5)
- `latitude`, `longitude` (DOUBLE): Geolocation
- `expo_push_token` (TEXT): Mobile push notification token
- `google_id` (VARCHAR UNIQUE): Google OAuth ID
- `profile_image` (TEXT): Profile image URL
- `created_at`, `updated_at`: Timestamps

**Breakdown:**
- Customers: 24
- Providers: 12
- Couriers: 5

**Admin Operations:**
- View all users with filters by type
- Block/unblock users with reason tracking
- Delete users and associated data
- Update user profiles
- View detailed user information

---

### 2. **orders** (33 records)
Customer orders for LPG cylinder delivery.

**Key Fields:**
- `id` (UUID): Order identifier
- `user_id` (UUID): Customer reference
- `provider_id` (UUID): Provider assigned
- `courier_id` (UUID): Courier assigned
- `status` (VARCHAR): 'pending' | 'accepted' | 'rejected' | 'delivered' | 'in-transit'
- `cylinder_type` (VARCHAR): '3KG' | '5KG' | '6KG' | '12KG' | '15KG' | '20KG' | '45KG' | '48KG'
- `quantity` (INTEGER): Number of cylinders
- `price_per_unit` (NUMERIC): Unit price
- `total_price` (NUMERIC): Total order price
- `delivery_fee` (NUMERIC): Delivery cost
- `service_charge` (NUMERIC): Service fee
- `grand_total` (NUMERIC): Final amount
- `delivery_address` (TEXT): Delivery location
- `payment_method` (TEXT): Payment type
- `payment_status` (VARCHAR): 'pending' | 'paid' | 'failed' | 'refunded'
- `current_latitude`, `current_longitude`: Current delivery location
- `created_at`, `updated_at`: Timestamps

**Status Distribution:**
- Pending: Orders waiting for provider acceptance
- Accepted: Provider accepted the order
- Rejected: Provider rejected the order
- In-Transit: Order is being delivered
- Delivered: Order completed

**Admin Operations:**
- View all orders with pagination
- Filter by status, date, provider, customer
- Update order status
- Moderate disputed orders
- Cancel orders with reason
- View order details and history

---

### 3. **payments** (0 records)
Payment transaction records for orders.

**Key Fields:**
- `id` (UUID): Payment identifier
- `order_id` (UUID): Order reference
- `amount` (NUMERIC): Payment amount
- `status` (VARCHAR): 'pending' | 'completed' | 'failed'
- `provider` (TEXT): Payment gateway provider
- `phone_number` (VARCHAR): Customer phone for payment
- `transaction_ref` (VARCHAR UNIQUE): Payment gateway reference
- `created_at`, `updated_at`: Timestamps

**Admin Operations:**
- Track payment history
- View payment receipts
- Process refunds
- Payment reconciliation

---

## Provider Management Tables

### 4. **provider_status** (0-12 records)
Tracks provider verification and operational status.

**Key Fields:**
- `id` (UUID): Record identifier
- `provider_id` (UUID): Provider reference
- `is_active` (BOOLEAN): Account status
- `is_verified` (BOOLEAN): Verification status
- `verification_date` (TIMESTAMPTZ): When verified
- `avg_rating` (DOUBLE): Average rating
- `total_orders` (INTEGER): Lifetime orders
- `total_revenue` (DOUBLE): Lifetime revenue
- `response_time_minutes` (INTEGER): Average response time
- `deactivation_reason` (TEXT): Why deactivated
- `created_at`, `updated_at`: Timestamps

**Admin Operations:**
- Verify/suspend providers
- View provider performance metrics
- Monitor provider ratings and revenue
- Track deactivations and reasons

---

### 5. **provider_metrics** (Records per provider)
Detailed performance metrics for providers.

**Key Fields:**
- `id` (UUID): Record identifier
- `provider_id` (UUID): Provider reference
- `orders_completed` (INTEGER): Total completed
- `orders_rejected` (INTEGER): Rejected orders
- `avg_delivery_time` (INTEGER): Minutes
- `customer_satisfaction` (DOUBLE): Score
- `revenue_generated` (DOUBLE): Total revenue
- `active_since` (DATE): Date joined

**Admin Operations:**
- View performance analytics
- Monitor delivery times
- Track satisfaction scores
- Revenue reporting

---

### 6. **cylinder_pricing** (Records per provider)
Provider's pricing for different cylinder types.

**Key Fields:**
- `id` (UUID): Record identifier
- `provider_id` (UUID): Provider reference
- `cylinder_type` (VARCHAR): Cylinder size
- `refill_price` (NUMERIC): Refill cost
- `buy_price` (NUMERIC): Purchase cost
- `stock_quantity` (INTEGER): Available stock
- `created_at`, `updated_at`: Timestamps

**Admin Operations:**
- View provider pricing
- Monitor stock levels
- Track pricing changes

---

### 7. **inventory** (Records per provider)
Detailed inventory for each provider.

**Key Fields:**
- `id` (UUID): Record identifier
- `provider_id` (UUID): Provider reference
- `cylinder_type` (VARCHAR): Type of cylinder
- `refill_price` (NUMERIC): Refill price
- `buy_price` (NUMERIC): Purchase price
- `stock_quantity` (INTEGER): Available stock
- `created_at`, `updated_at`: Timestamps

**Admin Operations:**
- Monitor inventory levels
- Alert on low stock
- Track inventory history

---

### 8. **provider_images** (Optional records)
Provider business images and documentation.

**Key Fields:**
- `id` (UUID): Record identifier
- `provider_id` (UUID): Provider reference
- `image_url` (TEXT): Image location
- `image_type` (TEXT): 'storefront' | 'certificate' | 'license'
- `uploaded_at` (TIMESTAMPTZ): Upload date

---

## Customer Management Tables

### 9. **user_preferences** (Records per customer)
Customer delivery and shopping preferences.

**Key Fields:**
- `id` (UUID): Record identifier
- `user_id` (UUID): Customer reference
- `preferred_cylinder_type` (TEXT): Favorite size
- `preferred_provider_id` (UUID): Favorite provider
- `preferred_latitude`, `preferred_longitude` (DOUBLE): Home location
- `preferred_address` (TEXT): Delivery address
- `delivery_radius_km` (INTEGER): Service radius
- `created_at`, `updated_at`: Timestamps

**Admin Operations:**
- View customer preferences
- Understand customer behavior
- Market analysis

---

## Courier Management Tables

### 10. **courier_status** (Records per courier)
Tracks courier availability and performance.

**Key Fields:**
- `id` (UUID): Record identifier
- `courier_id` (UUID): Courier reference
- `is_active` (BOOLEAN): Availability status
- `current_location` (GEOMETRY): Live location
- `total_deliveries` (INTEGER): Completed deliveries
- `avg_rating` (DOUBLE): Performance rating
- `vehicle_type` (TEXT): Delivery vehicle
- `created_at`, `updated_at`: Timestamps

**Admin Operations:**
- Activate/deactivate couriers
- Track courier performance
- Monitor delivery rates
- Location tracking

---

## Location & Delivery Tables

### 11. **location_history** (Historical records)
Tracks user and courier location history for auditing.

**Key Fields:**
- `id` (UUID): Record identifier
- `user_id` (UUID): User reference
- `latitude`, `longitude` (DOUBLE): Location coordinates
- `address` (TEXT): Address
- `timestamp` (TIMESTAMPTZ): When recorded
- `created_at`: Record creation time

**Admin Operations:**
- Audit user movements
- Dispute resolution (location verification)
- Delivery route analysis

---

## Analytics & Reporting Tables

### 12. **daily_analytics** (30+ day records)
Aggregated daily statistics.

**Key Fields:**
- `id` (UUID): Record identifier
- `analytics_date` (DATE): Date of data
- `total_orders` (INTEGER): Orders that day
- `completed_orders` (INTEGER): Completed
- `pending_orders` (INTEGER): Still pending
- `total_revenue` (DOUBLE): Daily revenue
- `total_transactions` (INTEGER): Payment count
- `active_providers` (INTEGER): Active providers
- `active_customers` (INTEGER): Active customers
- `active_couriers` (INTEGER): Active couriers
- `avg_delivery_time` (INTEGER): Average minutes
- `created_at`: Record time

**Admin Operations:**
- View daily statistics
- Revenue tracking
- User activity analysis
- Performance trending

---

## Financial Tables

### 13. **transaction_fees** (Records)
Platform fees and commissions.

**Key Fields:**
- `id` (UUID): Record identifier
- `fee_type` (VARCHAR): 'platform_commission' | 'delivery_fee' | 'service_charge' | 'transaction_fee'
- `percentage` (DOUBLE): Percentage fee
- `fixed_amount` (DOUBLE): Fixed fee amount
- `is_active` (BOOLEAN): Fee status
- `description` (TEXT): Fee description
- `effective_from`, `effective_until` (TIMESTAMPTZ): Validity period
- `created_at`, `updated_at`: Timestamps

**Current Fees Seeded:**
1. Platform Commission
2. Delivery Fee
3. Service Charge
4. Transaction Fee

**Admin Operations:**
- Create/edit/delete fees
- Set fee effective dates
- Track fee history
- Revenue splitting calculation

---

## Admin Management Tables

### 14. **admin_users** (2 records)
Admin accounts with role-based access.

**Key Fields:**
- `id` (UUID): Admin identifier
- `email` (TEXT UNIQUE): Admin email
- `password` (TEXT): Bcrypt hashed
- `name` (TEXT): Admin name
- `admin_role` (VARCHAR): 'super_admin' | 'manager' | 'analyst' | 'support'
- `permissions` (TEXT[]): Assigned permissions
- `is_active` (BOOLEAN): Account status
- `last_login` (TIMESTAMPTZ): Last login time
- `created_at`, `updated_at`: Timestamps

**Current Admins:**
1. **admin@lpgfinder.com** - Super Admin (all permissions)
2. **admin2@lpgfinder.com** - Manager (user, provider, order management)

**Admin Roles:**
- `super_admin`: Full system access
- `manager`: User and order management
- `analyst`: Read-only analytics access
- `support`: Customer support access

**Admin Operations:**
- Create admin accounts
- Assign roles and permissions
- Manage admin access
- Audit admin activities

---

### 15. **admin_activity_log** (1+ records)
Complete audit trail of all admin actions.

**Key Fields:**
- `id` (UUID): Log entry identifier
- `admin_id` (UUID): Admin reference
- `action` (TEXT): Action performed
- `resource_type` (TEXT): 'user' | 'provider' | 'order' | 'settings'
- `resource_id` (UUID): Resource being modified
- `details` (JSONB): Action details
- `ip_address` (TEXT): Admin's IP
- `created_at` (TIMESTAMPTZ): Action timestamp

**Admin Operations:**
- View admin action history
- Compliance auditing
- Identify unauthorized actions
- Accountability tracking

---

### 16. **admin_settings** (9 records)
Platform configuration and settings.

**Key Fields:**
- `id` (UUID): Setting identifier
- `setting_key` (TEXT UNIQUE): Setting name
- `setting_value` (TEXT): Setting value
- `data_type` (TEXT): 'string' | 'integer' | 'decimal' | 'boolean'
- `description` (TEXT): What it controls
- `created_at`, `updated_at`: Timestamps

**Current Settings:**
1. `delivery_fee_percentage` - Delivery fee %
2. `service_charge_percentage` - Service charge %
3. `max_delivery_distance_km` - Max delivery range
4. `min_delivery_distance_km` - Min delivery range
5. `platform_commission_percentage` - Platform commission %
6. `order_cancellation_window_minutes` - Cancellation time limit
7. `average_delivery_time_minutes` - Expected delivery time
8. `currency` - Platform currency (ZWL)
9. `tax_rate` - Tax percentage

**Admin Operations:**
- View all settings
- Modify platform configuration
- Change fee structures
- Update business rules

---

## Data Relationships

```
users (parent)
  ├── orders (user_id)
  ├── payments (via order)
  ├── user_preferences
  ├── location_history
  └── courier_status / provider_status / provider_metrics

orders (central)
  ├── users (customer, provider, courier)
  └── payments

providers (users with user_type='provider')
  ├── provider_status
  ├── provider_metrics
  ├── cylinder_pricing
  ├── inventory
  └── provider_images

couriers (users with user_type='courier')
  └── courier_status

admin_users (parent)
  └── admin_activity_log
```

---

## Admin Capabilities by Feature

### User Management
- ✅ View all users with pagination (15 per page)
- ✅ Filter by user type (customer/provider/courier)
- ✅ Search by name/email
- ✅ View user details (profile, rating, location)
- ✅ Block users with reason
- ✅ Unblock users
- ✅ Delete users permanently
- ✅ View user preferences
- ✅ Track location history

### Provider Management
- ✅ View all providers with metrics
- ✅ Verify/unverify providers
- ✅ Suspend/unsuspend providers
- ✅ View provider inventory
- ✅ Monitor pricing
- ✅ Track performance metrics
- ✅ View revenue data
- ✅ Check ratings and reviews
- ✅ Manage provider images

### Order Management
- ✅ View all orders with filters
- ✅ Filter by status, date, customer, provider
- ✅ View order details and history
- ✅ Update order status
- ✅ Moderate disputed orders
- ✅ Cancel orders with reason
- ✅ Track payment status
- ✅ View location tracking
- ✅ Monitor delivery progress

### Analytics & Reports
- ✅ Daily statistics dashboard
- ✅ Revenue analytics (7, 30 days)
- ✅ Order analytics
- ✅ User growth tracking
- ✅ Provider performance metrics
- ✅ Delivery time analytics
- ✅ Payment tracking
- ✅ Custom date ranges
- ✅ Export data (CSV/PDF)

### Settings & Configuration
- ✅ Manage platform fees
- ✅ Configure delivery rules
- ✅ Set pricing policies
- ✅ Manage transaction fees
- ✅ Regional settings
- ✅ Maintenance mode
- ✅ Notification settings
- ✅ Support contact info
- ✅ Tax configuration

---

## Key Statistics

| Metric | Count |
|--------|-------|
| Total Users | 41 |
| Customers | 24 |
| Providers | 12 |
| Couriers | 5 |
| Total Orders | 33 |
| Pending Orders | ~8 |
| Completed Orders | ~15 |
| Total Revenue | Tracked |
| Admin Users | 2 |
| Daily Records | 30+ |
| Transaction Fees | 4 |
| Platform Settings | 9 |

---

## Admin Credentials

### Primary Admin (Super Admin)
- **Email:** admin@lpgfinder.com
- **Password:** admin123
- **Role:** super_admin
- **Permissions:** * (all)

### Secondary Admin (Manager)
- **Email:** admin2@lpgfinder.com
- **Password:** admin@123
- **Role:** manager
- **Permissions:** read:all, write:users, write:providers, write:orders

---

## API Endpoints Available

### Admin Auth
- `POST /admin/login` - Admin login
- `GET /admin/me` - Current admin info

### Users Management
- `GET /admin/users?page=1&limit=10&search=query` - List users
- `GET /admin/users/{id}` - Get user details
- `PUT /admin/users/{id}` - Update user
- `PUT /admin/users/{id}/block` - Block user
- `PUT /admin/users/{id}/unblock` - Unblock user
- `DELETE /admin/users/{id}` - Delete user

### Providers Management
- `GET /admin/providers?page=1&limit=10` - List providers
- `GET /admin/providers/{id}` - Get provider details
- `PUT /admin/providers/{id}/verify` - Verify provider
- `PUT /admin/providers/{id}/suspend` - Suspend provider
- `PUT /admin/providers/{id}/status` - Update status

### Orders Management
- `GET /admin/orders?page=1&status=pending` - List orders
- `GET /admin/orders/{id}` - Get order details
- `PUT /admin/orders/{id}/status` - Update status
- `PUT /admin/orders/{id}/moderate` - Moderate order
- `PUT /admin/orders/{id}/cancel` - Cancel order

### Analytics
- `GET /admin/dashboard/stats` - Dashboard stats
- `GET /admin/analytics/revenue?days=7` - Revenue data
- `GET /admin/analytics/orders?days=7` - Order analytics
- `GET /admin/analytics/user-growth?days=30` - User growth

### Settings
- `GET /admin/settings` - Get all settings
- `PUT /admin/settings` - Update settings
- `GET /admin/logs/audit` - Audit logs

---

## Future Enhancement Opportunities

1. **Real-time Dashboards**
   - Live order tracking
   - Provider availability map
   - Real-time revenue counter

2. **Advanced Reporting**
   - Custom date range reports
   - Provider comparison analysis
   - Customer segmentation
   - Predictive analytics

3. **Automated Actions**
   - Auto-suspend low-rated providers
   - Automatic refund processing
   - Fraud detection
   - Performance-based incentives

4. **Communication**
   - Bulk messaging to users
   - Provider notifications
   - Customer support ticketing
   - In-app announcements

5. **Advanced Permissions**
   - Fine-grained role permissions
   - Department-based access
   - Time-based access restrictions
   - IP whitelisting

6. **Data Management**
   - Bulk user imports
   - Batch operations
   - Data backup and restore
   - GDPR compliance tools

---

**Last Updated:** December 3, 2025
**Database:** PostgreSQL (Neon)
**Frontend:** Next.js React Admin Dashboard
**Backend:** Go/Gin Framework
