# F&B ERP System - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Supabase project connected
- Node.js 18+ installed
- npm/pnpm package manager

### Step 1: Set Up Database

**IMPORTANT:** Before running the application, you must create the database schema.

1. Go to your **Supabase Project Dashboard**
2. Navigate to **SQL Editor** → **+ New Query**
3. Copy the entire content of `/scripts/fnb-schema-combined.sql`
4. Paste it into the SQL editor and click **Run**

Alternatively, execute the scripts in order:
```bash
scripts/01_users.sql
scripts/02_products.sql
scripts/03_ingredients.sql
scripts/04_inventory.sql
scripts/05_production.sql
scripts/06_sales.sql
scripts/07_forecasting.sql
scripts/08_supplier_compliance.sql
```

### Step 2: Create Test Users

In Supabase, create users in the **Auth** section with these emails:
- `admin@test.com` (password: test123)
- `manager@test.com` (password: test123)
- `staff@test.com` (password: test123)

Then update their roles in the `user_profiles` table:

```sql
INSERT INTO user_profiles (id, full_name, email, role) VALUES
('user-id-1', 'Admin User', 'admin@test.com', 'admin'),
('user-id-2', 'Production Manager', 'manager@test.com', 'production_manager'),
('user-id-3', 'Kitchen Staff', 'staff@test.com', 'kitchen_staff');
```

### Step 3: Install Dependencies

```bash
npm install
# or
pnpm install
```

### Step 4: Environment Variables

Verify these are set in your project settings (they should be auto-configured if Supabase is connected):

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 5: Run the Application

```bash
npm run dev
# or
pnpm dev
```

The application will be available at `http://localhost:3000/auth/login`

## 📋 Module Overview

### Dashboard (`/dashboard`)
- Real-time KPI cards (products, ingredients, orders, expiring stock, pending production)
- Expiry alerts
- Upcoming production schedule
- Demand forecast vs actual sales chart

### Recipes (`/recipes`)
- View all recipes with versions
- Recipe ingredients and yield management
- Production time tracking

### Inventory (`/inventory`)
- Batch-level ingredient tracking
- Expiry date management with color-coded alerts
- Storage location management
- Quantity and unit tracking

### Production (`/production`)
- Production batch scheduling
- Status tracking (planned → in progress → QC → completed → packaged)
- Yield comparison (planned vs actual)
- Production date and expiry tracking

### Sales (`/sales`)
- Sales order management
- Customer type classification (retail, wholesale, catering, direct)
- Order fulfillment tracking
- Delivery date scheduling

### Forecasting (`/forecasting`)
- Demand prediction charts
- Weekly forecast vs actual sales
- Product-level forecast analysis
- Forecast accuracy metrics and confidence levels

### Suppliers (`/suppliers`)
- Supplier information and contact management
- Performance tracking (on-time delivery, quality score)
- Temperature control capabilities
- Lead time and MOQ management

## 🔐 Role-Based Access Control

### Admin
- Full access to all modules
- User and supplier management
- Recipe creation and editing
- System configuration

### Production Manager
- Access to recipes, inventory, production
- Sales order management
- Supplier management
- Cannot manage users

### Kitchen Staff
- View-only access to recipes and inventory
- Can log food safety checks
- Can update production batch status
- Cannot create or modify recipes

## 📊 Key Features

✅ **Batch-Level Inventory** - Full tracking with FIFO support
✅ **Expiry Management** - Automatic alerts for perishables
✅ **Recipe Versioning** - Track formula changes
✅ **Production Scheduling** - Plan and track batches
✅ **Demand Forecasting** - Predict future sales
✅ **Supplier Performance** - Monitor quality and delivery
✅ **Food Safety Compliance** - Temperature and humidity logging
✅ **Sales Fulfillment** - Complete order tracking

## 🛠️ Database Schema

Core tables in Supabase:
- `user_profiles` - User accounts with roles
- `finished_products` - Menu items/products
- `recipes` - Product formulations with versions
- `ingredients` - Raw materials
- `recipe_ingredients` - Ingredient mappings with wastage factors
- `suppliers` - Supplier information
- `inventory_batches` - Batch-level ingredient tracking
- `production_batches` - Production batch management
- `sales_orders` - Customer orders
- `demand_forecasts` - Predicted demand
- `ingredient_costs` - Ingredient pricing by supplier
- `supplier_performance` - Supplier metrics
- `food_safety_logs` - Compliance and quality checks

## 🐛 Troubleshooting

### "Cannot find database connection"
- Verify Supabase is connected in project settings
- Check that SQL schema has been created (see Step 1)

### "Authentication failed"
- Verify user exists in Supabase Auth
- Check that user_profiles record exists with matching email
- Confirm user role is set correctly

### "Tables don't exist"
- Execute the database migration script in Supabase SQL Editor
- Verify all 13 tables are created using the Tables tab

## 📚 Additional Resources

- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Detailed database setup instructions
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

## 🎯 Next Steps

1. Create sample data (products, ingredients, suppliers)
2. Schedule production batches
3. Create sales orders
4. View demand forecasts
5. Monitor supplier performance

Enjoy your F&B ERP system!
