# F&B ERP Database Setup Guide

## Important: Manual Database Creation Required

Due to script execution limitations in this environment, the database tables need to be created manually in your Supabase dashboard.

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **+ New Query**

### Step 2: Execute the Schema Migration
Copy the entire SQL schema from `/scripts/fnb-schema-combined.sql` and paste it into the SQL editor, then click **Run**.

Alternatively, you can execute the statements individually from the numbered scripts:
- `/scripts/01_users.sql` - User profiles with roles
- `/scripts/02_products.sql` - Finished products and recipes
- `/scripts/03_ingredients.sql` - Ingredients and recipe mappings
- `/scripts/04_inventory.sql` - Inventory batch tracking
- `/scripts/05_production.sql` - Production batch management
- `/scripts/06_sales.sql` - Sales order handling
- `/scripts/07_forecasting.sql` - Demand forecasting
- `/scripts/08_supplier_compliance.sql` - Suppliers and compliance tracking

### Step 3: Verify Tables Created
After running the SQL, verify all tables exist by checking the **Tables** section in your Supabase dashboard. You should see:
- user_profiles
- finished_products
- recipes
- ingredients
- recipe_ingredients
- suppliers
- inventory_batches
- production_batches
- sales_orders
- demand_forecasts
- ingredient_costs
- supplier_performance
- food_safety_logs

### Step 4: Set Up Row Level Security (RLS) Policies
Once tables are created, you'll need to enable RLS and create policies. A future migration will handle this automatically, but for now, RLS is disabled to allow the app to function.

### Step 5: Create Test Users
In the Supabase Auth section, create test users with different roles:
1. Admin user (email: admin@test.com)
2. Production Manager (email: manager@test.com)
3. Kitchen Staff (email: staff@test.com)

Then manually update their `user_profiles` records to assign roles.

## Database Schema Overview

### Core Tables
- **user_profiles**: User accounts with role-based access (admin, production_manager, kitchen_staff)
- **finished_products**: Menu items/products produced
- **recipes**: Recipes for finished products with versions
- **ingredients**: Raw materials and components
- **recipe_ingredients**: Mappings of ingredients to recipes with quantities

### Inventory & Production
- **inventory_batches**: Batch-level ingredient tracking with expiry dates
- **production_batches**: Production batch tracking with yield and QC data
- **ingredient_costs**: Ingredient costs by supplier
- **supplier_performance**: Supplier quality and delivery metrics

### Sales & Forecasting
- **sales_orders**: Customer orders with fulfillment tracking
- **demand_forecasts**: Predicted demand by product and time period

### Compliance & Safety
- **food_safety_logs**: Temperature, humidity, and quality checks
- **suppliers**: Supplier information with certifications and temperature control capabilities

## Key Features of the Schema

✅ **Batch Tracking**: Full batch-level inventory management with FIFO support
✅ **Expiry Management**: Automatic tracking of expiry dates with alerts
✅ **Recipe Versioning**: Support for recipe changes with version control
✅ **Yield Loss**: Wastage factors in recipes for accurate MRP
✅ **Food Safety**: Compliance logging for temperature and humidity
✅ **Supplier Integration**: Multi-supplier support with performance metrics
✅ **Role-Based Access**: User roles (admin, production_manager, kitchen_staff)

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

These should already be configured in your project if Supabase integration is active.
