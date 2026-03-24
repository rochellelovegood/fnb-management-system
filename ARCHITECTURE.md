# F&B ERP System - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │   Login      │  │  Dashboard   │  │   Core Modules           │ │
│  │   Page       │  │              │  │  ┌────────────────────┐  │ │
│  │              │  │  • KPIs      │  │  │ Recipes            │  │ │
│  │ /auth/login  │  │  • Alerts    │  │  │ Inventory          │  │ │
│  │              │  │  • Charts    │  │  │ Production         │  │ │
│  │              │  │  • Schedule  │  │  │ Sales Orders       │  │ │
│  └──────────────┘  └──────────────┘  │  │ Forecasting        │  │ │
│                                       │  │ Suppliers          │  │ │
│                                       └────────────────────┘  │ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Navigation Component (Role-Based Menu Filtering)            │  │
│  │  • Admin: Full Access                                        │  │
│  │  • Production Manager: Prod, Inventory, Sales, Suppliers   │  │
│  │  • Kitchen Staff: View-Only + Status Updates               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└────────────────────────┬──────────────────────────────────────────┘
                         │
                         │ HTTP/HTTPS
                         │
┌────────────────────────▼──────────────────────────────────────────┐
│              APPLICATION LAYER (Next.js 16)                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Auth Context Provider                                     │ │
│  │  • Manages session state                                  │ │
│  │  • Fetches user profile with role                         │ │
│  │  • Handles sign-in/sign-out                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Page Components (/app/(app)/[module]/page.tsx)            │ │
│  │  • Fetch module-specific data                             │ │
│  │  • Manage loading states                                  │ │
│  │  • Render lists and forms                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  UI Component Library (shadcn/ui)                          │ │
│  │  • Cards, Forms, Buttons, Inputs                          │ │
│  │  • Alerts, Dropdowns, Dialogs                             │ │
│  │  • Responsive & Accessible                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         │ Supabase Client SDK
                         │
┌────────────────────────▼──────────────────────────────────────────┐
│                    DATA ACCESS LAYER                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Supabase Client (lib/supabase.ts)                      │   │
│  │  • Initialize with NEXT_PUBLIC_SUPABASE_URL/KEY        │   │
│  │  • Handle authentication                               │   │
│  │  • Execute database queries                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         │ PostgreSQL Protocol
                         │
┌────────────────────────▼──────────────────────────────────────────┐
│                    DATABASE LAYER (Supabase)                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Core Tables                                             │  │
│  │  ┌──────────────────┐  ┌────────────────────────────┐  │  │
│  │  │ User Management  │  │ Product Management        │  │  │
│  │  ├──────────────────┤  ├────────────────────────────┤  │  │
│  │  │ user_profiles    │  │ finished_products         │  │  │
│  │  │ (role-based)     │  │ recipes                   │  │  │
│  │  │                  │  │ recipe_ingredients        │  │  │
│  │  │                  │  │ ingredients               │  │  │
│  │  └──────────────────┘  └────────────────────────────┘  │  │
│  │                                                         │  │
│  │  ┌──────────────────┐  ┌────────────────────────────┐  │  │
│  │  │ Inventory & Prod │  │ Sales & Forecasting      │  │  │
│  │  ├──────────────────┤  ├────────────────────────────┤  │  │
│  │  │ inventory_batches│  │ sales_orders              │  │  │
│  │  │ (batch tracking) │  │ demand_forecasts          │  │  │
│  │  │ production_batch │  │ ingredient_costs          │  │  │
│  │  │                  │  │                           │  │  │
│  │  └──────────────────┘  └────────────────────────────┘  │  │
│  │                                                         │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ Supplier & Compliance                           │  │  │
│  │  ├──────────────────────────────────────────────────┤  │  │
│  │  │ suppliers                                        │  │  │
│  │  │ supplier_performance (on-time, quality, cost)   │  │  │
│  │  │ food_safety_logs (temp, humidity, QC checks)    │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Indexes & Constraints                                   │  │
│  │  • Expiry date index for fast lookups                   │  │
│  │  • Product FK index for joins                           │  │
│  │  • Status index for filtering                           │  │
│  │  • Foreign key constraints for data integrity           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Row-Level Security (RLS) Policies                       │  │
│  │  • Admin: Full access to all tables                      │  │
│  │  • Production Manager: Access to production data         │  │
│  │  • Kitchen Staff: Read-only with status update access    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Authentication Flow

```
User
  │
  ├─ Enter credentials
  │
  ▼
[Supabase Auth]
  │
  ├─ Validate email/password
  │
  ├─ Create session
  │
  ▼
[Auth Context]
  │
  ├─ Store session in state
  │
  ├─ Fetch user_profiles for role
  │
  ├─ Update auth context
  │
  ▼
[Protected Routes]
  │
  └─ Redirect to /dashboard
```

### Data Fetch Flow

```
Component mounts
  │
  ├─ useEffect hook triggers
  │
  ├─ Check auth status
  │
  ▼
[Supabase Query]
  │
  ├─ SELECT * FROM table
  │
  ├─ Apply filters/sorting
  │
  ├─ Join related tables
  │
  ▼
[Data Processing]
  │
  ├─ Transform API response
  │
  ├─ Format for display
  │
  ├─ Handle errors
  │
  ▼
[State Update]
  │
  ├─ setState(data)
  │
  ▼
[Component Render]
  │
  └─ Display data or error
```

### Production Planning Flow

```
Recipe Created
  │
  ├─ Define ingredients and proportions
  │
  ▼
Production Batch Scheduled
  │
  ├─ Select recipe
  │
  ├─ Set production date
  │
  ├─ Define quantity
  │
  ▼
[MRP Calculation] (Future)
  │
  ├─ Calculate ingredient needs
  │
  ├─ Account for wastage factors
  │
  ├─ Check inventory availability
  │
  ▼
Inventory Check
  │
  ├─ Verify batch availability
  │
  ├─ Prioritize expiring batches (FIFO)
  │
  ├─ Generate purchase orders if needed
  │
  ▼
Production Execution
  │
  ├─ Log actual yield
  │
  ├─ Record QC checks
  │
  ├─ Update batch status
  │
  ▼
Finished Product Ready
  │
  ├─ Calculate expiry date
  │
  ├─ Add to saleable inventory
  │
  └─ Available for sales orders
```

### Demand Forecasting Flow

```
Historical Sales Data
  │
  ├─ Fetch sales_orders history
  │
  ├─ Group by product and period
  │
  ▼
[Forecasting Algorithm] (Future)
  │
  ├─ Calculate moving average (3-month)
  │
  ├─ Detect trend (upward/downward)
  │
  ├─ Apply seasonal factors
  │
  ├─ Account for customer type patterns
  │
  ├─ Calculate confidence level
  │
  ▼
Generate Forecast
  │
  ├─ Store in demand_forecasts table
  │
  ├─ Compare with actual sales
  │
  ├─ Calculate variance/MAPE
  │
  ▼
Production Planning
  │
  ├─ Suggest batch quantities
  │
  ├─ Alert for high-demand items
  │
  ├─ Recommend early production
  │
  └─ Flag slow-moving products
```

## Module Dependencies

```
Dashboard
├── Depends on: user_profiles, finished_products, ingredients, 
│               sales_orders, production_batches, inventory_batches
└── Provides: Real-time KPI view

Recipes
├── Depends on: recipes, recipe_ingredients, finished_products, ingredients
└── Provides: Recipe management and versioning

Inventory
├── Depends on: inventory_batches, ingredients, suppliers
└── Provides: Batch tracking with expiry alerts

Production
├── Depends on: production_batches, recipes, finished_products, 
│               inventory_batches (for MRP)
└── Provides: Production scheduling and tracking

Sales
├── Depends on: sales_orders, finished_products, production_batches
└── Provides: Order fulfillment tracking

Forecasting
├── Depends on: demand_forecasts, sales_orders, finished_products
└── Provides: Demand prediction and analytics

Suppliers
├── Depends on: suppliers, supplier_performance, inventory_batches, 
│               ingredient_costs
└── Provides: Supplier management and performance tracking
```

## Security Architecture

```
┌─────────────────────────────────────┐
│      Supabase Auth (JWT)            │
│  • Email/Password authentication    │
│  • HTTP-only session cookies        │
│  • Automatic token refresh          │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│      Auth Context Provider          │
│  • Client-side session state        │
│  • User profile with role fetched   │
│  • Protected route checks           │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Row-Level Security (RLS)          │
│  • Policy enforcement on tables     │
│  • Role-based access control        │
│  • Data isolation by user           │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Database Access                    │
│  • Only authenticated requests      │
│  • Enforced permission checks       │
│  • Audit trails for compliance      │
└─────────────────────────────────────┘
```

## Deployment Architecture

```
GitHub Repository
    │
    ├─ Code (Next.js app)
    │
    ├─ Environment Variables
    │  ├─ NEXT_PUBLIC_SUPABASE_URL
    │  ├─ NEXT_PUBLIC_SUPABASE_ANON_KEY
    │  └─ SUPABASE_SERVICE_ROLE_KEY
    │
    ▼
Vercel Deployment
    │
    ├─ Build & Deploy
    │
    ├─ Edge Network (CDN)
    │
    ├─ Serverless Functions
    │
    ▼
Production Environment
    │
    ├─ Frontend: Vercel Hosted
    │
    ├─ Backend: Supabase Cloud
    │  ├─ PostgreSQL Database
    │  ├─ Authentication Service
    │  └─ Real-Time Subscriptions
    │
    ▼
User Access
    │
    └─ https://your-domain.com
```

## Technology Stack

```
Frontend
├─ Framework: Next.js 16 (App Router)
├─ UI Library: React 19
├─ Styling: Tailwind CSS v4
├─ Components: shadcn/ui (60+ components)
├─ Icons: Lucide React (300+ icons)
├─ Charts: Recharts (data visualization)
└─ Type Safety: TypeScript

Backend & Database
├─ Database: Supabase (PostgreSQL)
├─ Auth: Supabase Auth
├─ ORM: Direct SQL queries
├─ Real-time: Supabase subscriptions (ready)
└─ Server: Edge Functions (ready)

Deployment
├─ Hosting: Vercel
├─ CI/CD: Vercel Git Integration
├─ Monitoring: Vercel Analytics
├─ Domain: Custom domain supported
└─ SSL: Auto-managed HTTPS
```

## Scalability & Performance

### Database Optimization
- Indexes on frequently queried columns (expiry_date, status, product_id)
- Foreign key constraints ensure referential integrity
- Pagination-ready query structure

### Frontend Optimization
- Next.js static generation for pages
- Client-side caching with React Context
- Image optimization with Next.js Image
- Code splitting by route

### Infrastructure
- Supabase auto-scaling PostgreSQL
- Vercel Edge Network for global distribution
- Serverless Functions for API routes
- CDN-cached static assets

## Future Architecture Enhancements

```
Current (v1.0)
└─ Single region, synchronous operations

Planned (v2.0)
├─ Multi-region deployment
├─ Real-time notifications (WebSocket)
├─ API Rate Limiting
├─ Advanced caching layer (Redis)
└─ Async job processing (Queues)

Advanced (v3.0)
├─ Microservices architecture
├─ Event-driven data pipeline
├─ Machine learning forecasting
├─ Mobile app (React Native)
└─ Third-party integrations (accounting, logistics)
```

---

This architecture ensures scalability, security, and maintainability while keeping the system simple and understandable for developers.
