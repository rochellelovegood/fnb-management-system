# F&B ERP System - Food & Beverage Production Management

A comprehensive, production-ready Enterprise Resource Planning (ERP) system built specifically for Food & Beverage manufacturing. Manage recipes, ingredients, production batches, inventory, sales orders, demand forecasting, and supplier relationships in one integrated platform.

## 🎯 Key Features

✅ **Recipe Management** - Create and version recipes with ingredient proportions and yield tracking  
✅ **Batch Inventory** - Track ingredients at batch level with FIFO and expiry management  
✅ **Production Scheduling** - Plan and monitor production batches with quality checkpoints  
✅ **Demand Forecasting** - Predict sales with trend analysis and confidence levels  
✅ **Sales Management** - Manage customer orders with fulfillment tracking  
✅ **Supplier Management** - Monitor supplier performance and quality metrics  
✅ **Food Safety Compliance** - Log temperature, humidity, and quality checks  
✅ **Role-Based Access** - Admin, Production Manager, and Kitchen Staff roles  

## 🚀 Quick Start

### 1. Database Setup (CRITICAL - Do This First!)
```bash
# Go to Supabase Dashboard → SQL Editor
# Copy and paste: scripts/fnb-schema-combined.sql
# Click Run
```

### 2. Install & Run
```bash
npm install
npm run dev
```

### 3. Access Application
- **URL:** http://localhost:3000/auth/login
- **Test User:** admin@test.com / test123

See [QUICKSTART.md](./QUICKSTART.md) for detailed setup instructions.

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Step-by-step setup guide with sample data
- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Database creation and schema details
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Complete feature overview and architecture
- **[DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md)** - Code patterns, APIs, and troubleshooting

## 📋 Module Overview

### Dashboard (`/dashboard`)
Real-time KPI overview with:
- Product and ingredient counts
- Active orders tracking
- Expiring inventory alerts
- Production schedule preview
- Demand forecast vs actual chart

### Recipes (`/recipes`)
Recipe management with:
- Recipe versioning
- Ingredient requirements
- Yield and production time tracking
- Multi-product support

### Inventory (`/inventory`)
Batch-level inventory tracking:
- Expiry date alerts (14-day window)
- FIFO-ready batch structure
- Storage location management
- Supplier batch associations

### Production (`/production`)
Production batch scheduling:
- Status pipeline (planned → completed → packaged)
- Production date scheduling
- Yield comparison (planned vs actual)
- QC notes and quality tracking

### Sales (`/sales`)
Sales order management:
- Customer type classification (retail/wholesale/catering/direct)
- Order fulfillment tracking
- Delivery scheduling
- Order history

### Forecasting (`/forecasting`)
Demand prediction and analysis:
- Weekly forecast charts
- Product-level forecasts
- Forecast accuracy metrics
- Confidence level tracking

### Suppliers (`/suppliers`)
Supplier relationship management:
- Performance tracking (delivery, quality)
- Lead time and MOQ management
- Temperature control capabilities
- Contact information

## 🏗️ Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS v4
- **UI Components:** shadcn/ui with Radix UI
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Charts:** Recharts
- **Icons:** Lucide React
- **Deployment:** Vercel-ready

## 🗄️ Database Schema

13 core tables:
- `user_profiles` - User accounts with role-based access
- `finished_products` - Menu items/final products
- `recipes` - Product formulations with versions
- `ingredients` - Raw materials
- `recipe_ingredients` - Ingredient mappings with wastage factors
- `suppliers` - Supplier information
- `inventory_batches` - Batch-level ingredient inventory
- `production_batches` - Production batch tracking
- `sales_orders` - Customer orders
- `demand_forecasts` - Predicted demand
- `ingredient_costs` - Multi-supplier pricing
- `supplier_performance` - Quality and delivery metrics
- `food_safety_logs` - Compliance logging

## 🔐 Role-Based Access Control

### Admin
- Full access to all modules and settings
- User management
- System configuration

### Production Manager
- Access to recipes, inventory, production, sales, suppliers
- Cannot manage users
- Full editing capabilities

### Kitchen Staff
- View recipes and inventory (read-only)
- Update production batch status
- Log food safety checks
- Cannot create or modify recipes/inventory

## 📊 Key Capabilities

### Inventory Management
- Batch-level tracking with batch numbers
- FIFO (First-In-First-Out) ready structure
- Expiry date management with automated alerts
- Multi-location storage support
- Supplier batch associations

### Production Planning
- Recipe-based production batching
- Automatic expiry date calculation
- Yield tracking (planned vs actual)
- Production status pipeline
- Quality checkpoint documentation

### Demand Forecasting
- Time-series analysis with trend detection
- Seasonal pattern support
- Confidence level tracking
- Actual vs forecasted comparison
- Product-level analytics

### Supplier Management
- Performance scorecards
- On-time delivery tracking
- Quality scoring
- Temperature control monitoring
- Multi-product supplier support

## 🛠️ Installation & Deployment

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account (free tier works)
- Vercel account (optional, for deployment)

### Local Development
```bash
git clone <repository>
cd v0-project
npm install
npm run dev
```

### Production Deployment
```bash
npm run build
npm start
# Or deploy to Vercel with: vercel deploy
```

## 📝 Setup Checklist

- [ ] Execute database schema in Supabase SQL Editor
- [ ] Create test users in Supabase Auth
- [ ] Update user_profiles table with roles
- [ ] Install npm dependencies
- [ ] Configure environment variables
- [ ] Run development server
- [ ] Test login with sample credentials
- [ ] Create sample data (products, recipes, suppliers)
- [ ] Verify dashboard displays data

## 🐛 Troubleshooting

### "Tables not found" error
- Execute `/scripts/fnb-schema-combined.sql` in Supabase SQL Editor
- Verify all 13 tables appear in Supabase Dashboard

### "Cannot authenticate"
- Verify user exists in Supabase Auth
- Check user_profiles table has matching email and role
- Confirm correct credentials are being used

### "Data not displaying"
- Verify database schema is created
- Check browser console for errors (F12)
- Confirm you have data in the database

See [QUICKSTART.md](./QUICKSTART.md) for more troubleshooting tips.

## 📈 Performance & Scalability

- Optimized database indexes on frequently queried columns
- Efficient pagination-ready query structure
- Supabase serverless auto-scaling
- Stateless frontend for horizontal scaling
- CDN-ready static assets

## 🚀 Future Enhancements

- [ ] MRP (Material Requirements Planning) algorithm
- [ ] Automatic purchase order generation
- [ ] Advanced inventory optimization
- [ ] Real-time notifications
- [ ] Mobile app (React Native)
- [ ] Advanced reporting and exports
- [ ] Multi-location warehouse support
- [ ] Integration with accounting systems

## 📞 Support & Documentation

**For Setup Issues:** See [QUICKSTART.md](./QUICKSTART.md)

**For Database Questions:** See [DATABASE_SETUP.md](./DATABASE_SETUP.md)

**For Architecture Details:** See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

**For Development:** See [DEVELOPER_REFERENCE.md](./DEVELOPER_REFERENCE.md)

## 📄 License

This project is built with v0.app for Vercel ecosystem.

## 🎯 Project Status

✅ **Complete & Ready for Production**

- All core modules implemented
- Database schema fully designed and tested
- Authentication and authorization working
- UI fully responsive and accessible
- Documentation comprehensive
- Ready for deployment

**Build Date:** March 24, 2026  
**Version:** 1.0.0  
**Status:** Production Ready

---

**Start your F&B ERP journey today!** 

1. Read [QUICKSTART.md](./QUICKSTART.md)
2. Set up the database
3. Create test users
4. Run `npm run dev`
5. Access `/auth/login`

Questions? Check the documentation files above or review the code comments in the implementation.
