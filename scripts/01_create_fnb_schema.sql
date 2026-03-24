-- F&B ERP System Database Schema
-- Phase 1: Core tables for food & beverage production

-- ============================================================================
-- 1. USERS AND ROLES (managed by Supabase Auth)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'production_manager', 'kitchen_staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. PRODUCTS & RECIPES
-- ============================================================================

CREATE TABLE IF NOT EXISTS finished_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  selling_price_per_unit DECIMAL(10, 2),
  yield_per_batch DECIMAL(10, 2) NOT NULL,
  unit_of_measure TEXT DEFAULT 'kg',
  shelf_life_days INTEGER,
  storage_temperature_min DECIMAL(5, 1),
  storage_temperature_max DECIMAL(5, 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finished_product_id UUID NOT NULL REFERENCES finished_products(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  yield DECIMAL(10, 2) NOT NULL,
  production_time_minutes INTEGER,
  instructions TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (finished_product_id, version)
);

CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  supplier_id UUID,
  unit_of_measure TEXT NOT NULL,
  shelf_life_days INTEGER,
  storage_temperature_min DECIMAL(5, 1),
  storage_temperature_max DECIMAL(5, 1),
  reorder_point DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity_needed DECIMAL(10, 3) NOT NULL,
  unit_of_measure TEXT NOT NULL,
  wastage_factor DECIMAL(5, 2) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (recipe_id, ingredient_id)
);

-- ============================================================================
-- 3. INVENTORY & BATCHES
-- ============================================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  product_categories TEXT,
  certifications TEXT,
  lead_time_days INTEGER,
  temperature_controlled BOOLEAN DEFAULT FALSE,
  minimum_order_qty DECIMAL(10, 2),
  payment_terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingredient_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  unit_cost DECIMAL(10, 4) NOT NULL,
  minimum_order_qty DECIMAL(10, 2),
  lead_time_days INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (ingredient_id, supplier_id)
);

CREATE TABLE IF NOT EXISTS inventory_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  quantity DECIMAL(10, 3) NOT NULL,
  quantity_used DECIMAL(10, 3) DEFAULT 0,
  unit_of_measure TEXT NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  received_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  storage_location TEXT,
  storage_temperature DECIMAL(5, 1),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'used', 'expired', 'discarded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS temperature_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_batch_id UUID NOT NULL REFERENCES inventory_batches(id) ON DELETE CASCADE,
  temperature DECIMAL(5, 1) NOT NULL,
  humidity DECIMAL(5, 1),
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recorded_by UUID REFERENCES user_profiles(id)
);

-- ============================================================================
-- 4. PRODUCTION
-- ============================================================================

CREATE TABLE IF NOT EXISTS production_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finished_product_id UUID NOT NULL REFERENCES finished_products(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL UNIQUE,
  recipe_version INTEGER NOT NULL,
  quantity_planned DECIMAL(10, 2) NOT NULL,
  quantity_produced DECIMAL(10, 2),
  actual_yield DECIMAL(10, 2),
  production_date DATE,
  expiry_date DATE,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_production', 'quality_check', 'completed', 'packaged')),
  qc_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_batch_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_batch_id UUID NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  inventory_batch_id UUID REFERENCES inventory_batches(id),
  quantity_needed DECIMAL(10, 3) NOT NULL,
  quantity_used DECIMAL(10, 3),
  unit_of_measure TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS waste_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_batch_id UUID REFERENCES production_batches(id),
  ingredient_batch_id UUID REFERENCES inventory_batches(id),
  quantity DECIMAL(10, 3) NOT NULL,
  unit_of_measure TEXT NOT NULL,
  reason TEXT CHECK (reason IN ('spoilage', 'prep_loss', 'quality', 'expired', 'contamination', 'other')),
  cost DECIMAL(10, 2),
  notes TEXT,
  recorded_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. SALES & ORDERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_type TEXT CHECK (customer_type IN ('retail', 'wholesale', 'catering', 'direct')),
  order_date DATE NOT NULL,
  delivery_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'picked', 'packaged', 'shipped', 'delivered', 'cancelled')),
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  finished_product_id UUID NOT NULL REFERENCES finished_products(id),
  production_batch_id UUID REFERENCES production_batches(id),
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. FORECASTING & DEMAND
-- ============================================================================

CREATE TABLE IF NOT EXISTS sales_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finished_product_id UUID NOT NULL REFERENCES finished_products(id),
  sale_date DATE NOT NULL,
  quantity_sold DECIMAL(10, 2) NOT NULL,
  customer_type TEXT,
  revenue DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS demand_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finished_product_id UUID NOT NULL REFERENCES finished_products(id),
  forecast_date DATE NOT NULL,
  period TEXT DEFAULT 'week' CHECK (period IN ('day', 'week', 'month')),
  predicted_demand DECIMAL(10, 2) NOT NULL,
  confidence_level DECIMAL(3, 2) DEFAULT 0.80,
  forecast_basis TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (finished_product_id, forecast_date, period)
);

-- ============================================================================
-- 7. SUPPLIER PERFORMANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS supplier_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  evaluation_period TEXT DEFAULT 'monthly',
  on_time_delivery_rate DECIMAL(5, 2),
  quality_score DECIMAL(5, 2),
  price_variance DECIMAL(5, 2),
  temperature_compliance BOOLEAN,
  last_audit_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (supplier_id, created_at::date)
);

-- ============================================================================
-- 8. FOOD SAFETY & COMPLIANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS food_safety_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
  check_type TEXT CHECK (check_type IN ('temperature', 'hygiene', 'contamination', 'packaging', 'labeling', 'expiry')),
  temperature DECIMAL(5, 1),
  humidity DECIMAL(5, 1),
  status TEXT CHECK (status IN ('pass', 'fail', 'warning')),
  notes TEXT,
  recorded_by UUID REFERENCES user_profiles(id),
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 9. PURCHASE ORDERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  quantity DECIMAL(10, 2) NOT NULL,
  unit_cost DECIMAL(10, 4),
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_recipes_finished_product ON recipes(finished_product_id);
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_inventory_batches_ingredient ON inventory_batches(ingredient_id);
CREATE INDEX idx_inventory_batches_expiry ON inventory_batches(expiry_date);
CREATE INDEX idx_inventory_batches_status ON inventory_batches(status);
CREATE INDEX idx_production_batches_product ON production_batches(finished_product_id);
CREATE INDEX idx_production_batches_status ON production_batches(status);
CREATE INDEX idx_sales_orders_date ON sales_orders(order_date);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_sales_history_date ON sales_history(sale_date);
CREATE INDEX idx_sales_history_product ON sales_history(finished_product_id);
CREATE INDEX idx_demand_forecasts_product ON demand_forecasts(finished_product_id);
CREATE INDEX idx_demand_forecasts_date ON demand_forecasts(forecast_date);
CREATE INDEX idx_food_safety_logs_batch ON food_safety_logs(batch_id);
CREATE INDEX idx_temperature_logs_batch ON temperature_logs(inventory_batch_id);
