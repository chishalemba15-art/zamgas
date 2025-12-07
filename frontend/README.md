# ZamGas Frontend - LPG Delivery System

Modern, mobile-friendly Next.js application for the ZamGas LPG delivery platform.

## 🌐 Live Production

**Backend API:** http://44.195.43.147:8080
**Status:** ✅ Running on AWS ECS (Fargate)
**Region:** us-east-1
**Database:** Neon PostgreSQL

## Features

### Customer Features
- 📱 **Modern Mobile UI** - Responsive design optimized for all devices
- 🔐 **Secure Authentication** - Email/password signup and signin
- 🏪 **Browse Providers** - View all available LPG providers
- 📍 **Location-based** - Find nearest providers
- 🛒 **Easy Ordering** - Place orders with live pricing
- 📦 **Order Tracking** - Track order status and delivery
- 💳 **Multiple Payment** - Cash and mobile money options

### Provider Features
- 📊 **Dashboard Overview** - View order statistics
- 📝 **Order Management** - Accept/reject orders
- 📦 **Inventory Control** - Manage cylinder stock and pricing
- 💰 **Pricing Control** - Set refill and buy prices
- 📈 **Real-time Updates** - Live order notifications

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Color Theme

Professional LPG industry color scheme:

- **Brand Blue** (`#0284c7`) - Primary actions and trust
- **Accent Orange** (`#f59e0b`) - CTAs and highlights
- **Success Green** (`#22c55e`) - Confirmations
- **Danger Red** (`#ef4444`) - Alerts and errors
- **Neutral Gray** - Content and backgrounds

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   │   ├── signin/        # Sign in page
│   │   └── signup/        # Sign up page
│   ├── customer/          # Customer pages
│   │   ├── dashboard/     # Order placement
│   │   └── orders/        # Order history
│   ├── provider/          # Provider pages
│   │   ├── dashboard/     # Statistics
│   │   ├── orders/        # Order management
│   │   └── inventory/     # Stock management
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # Reusable components
│   ├── ui/                # UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── Select.tsx
│   └── Layout/            # Layout components
│       └── DashboardLayout.tsx
├── lib/                   # Utilities
│   ├── api.ts             # API client & types
│   └── utils.ts           # Helper functions
├── store/                 # State management
│   └── authStore.ts       # Auth state (Zustand)
└── tailwind.config.ts     # Tailwind configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API (Production: http://44.195.43.147:8080 or Local: http://localhost:8080)

### Installation

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment:**

   **Option A: Use Production Backend (Recommended for testing)**
   ```bash
   # The app is pre-configured to use the production API
   # Just install and run!
   npm run dev
   ```

   **Option B: Use Local Backend**
   ```bash
   # Create local environment file
   cp .env.local.example .env.local

   # Edit .env.local and set:
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   ```
   http://localhost:3000
   ```

### Quick Test with Production API

The frontend is configured to connect to the live production backend by default:

```bash
cd frontend
npm install
npm run dev
# Visit http://localhost:3000
# Create an account and start ordering!
```

## Available Scripts

```bash
# Development
npm run dev        # Start dev server (http://localhost:3000)

# Production
npm run build      # Build for production
npm run start      # Start production server

# Code Quality
npm run lint       # Run ESLint
```

## API Integration

The frontend integrates with the backend API via Axios:

### API Client (`lib/api.ts`)

```typescript
import { authAPI, userAPI, providerAPI, orderAPI, inventoryAPI } from '@/lib/api'

// Example usage
const providers = await providerAPI.getAll()
const order = await orderAPI.create({...})
```

### API Endpoints

- **Auth**: `/auth/signup`, `/auth/signin`, `/auth/signout`
- **User**: `/user/profile`, `/user/orders`
- **Provider**: `/providers`, `/provider/orders`, `/provider/inventory`
- **Orders**: `/user/orders/create`, `/provider/orders/:id/accept`
- **Inventory**: `/provider/inventory`, `/provider/inventory/stock`

## Component Library

### Button
```tsx
<Button variant="primary" size="lg">
  Click Me
</Button>
```

Variants: `primary`, `secondary`, `accent`, `danger`, `success`, `outline`, `ghost`

### Input
```tsx
<Input
  label="Email"
  type="email"
  placeholder="your@email.com"
  error={errors.email}
/>
```

### Card
```tsx
<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>Actions</CardFooter>
</Card>
```

### Badge
```tsx
<Badge variant="success">Active</Badge>
```

Variants: `primary`, `success`, `danger`, `warning`, `neutral`

## Authentication Flow

1. User signs up/signs in
2. JWT token stored in localStorage
3. Token added to all API requests via interceptor
4. Protected routes check auth state
5. Auto-redirect on 401 errors

## Responsive Design

### Mobile-First Approach
- All components designed for mobile first
- Progressive enhancement for larger screens
- Bottom navigation on mobile
- Sticky top nav on desktop

### Breakpoints
- `sm`: 640px (Tablets)
- `md`: 768px (Small laptops)
- `lg`: 1024px (Desktops)
- `xl`: 1280px (Large screens)

## State Management

Using **Zustand** for lightweight state management:

```typescript
// Auth store
const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore()

// Set auth
setAuth(user, token)

// Clear auth (logout)
clearAuth()
```

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Environment Variables (Production)

Set in your deployment platform:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

## Best Practices

1. **TypeScript** - Full type safety
2. **Component Reusability** - DRY principle
3. **Error Handling** - Toast notifications
4. **Loading States** - Skeleton screens
5. **Mobile Optimization** - Touch-friendly
6. **Accessibility** - ARIA labels
7. **Performance** - Code splitting

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### API Connection Errors
- Verify backend is running on port 8080
- Check CORS settings in backend
- Confirm `NEXT_PUBLIC_API_URL` is set correctly

### Build Errors
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Token Issues
- Clear localStorage
- Sign in again
- Check token expiration in backend

## Contributing

1. Follow TypeScript best practices
2. Use existing component patterns
3. Maintain mobile-first design
4. Add toast notifications for user feedback
5. Test on mobile devices

## License

This project is part of the ZamGas LPG Delivery System.

## Support

For issues or questions, please check the main project README or contact the development team.
