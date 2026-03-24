-- F&B ERP System - Complete Database Schema
-- This file contains all tables needed for the Food & Beverage production ERP system

-- ============================================
-- 1. USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'production_manager', 'kitchen_staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. FINISHED PRODUCTS TABLE
-- ============================================
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

CREATE INDEX idx_finished_products_sku ON finished_products(sku);
CREATE INDEX idx_finished_products_category ON finished_products(category);

-- ============================================
-- 3. RECIPES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finished_product_id UUID NOT NULL REFERENCES finished_products(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  yield DECIMAL(10, 2) NOT NULL,
  production_time_minutes INTEGER,
  instructions TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (finished_product_id, version)
);

CREATE INDEX idx_recipes_product ON recipes(finished_product_id);

-- ============================================
-- 4. SUPPLIERS TABLE
-- ============================================
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
  lead_time_days INTEGER DEFAULT 2,
  temperature_controlled BOOLEAN DEFAULT FALSE,
  minimum_order_qty DECIMAL(10, 2),
  payment_terms TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_suppliers_code ON suppliers(code);
CREATE INDEX idx_suppliers_active ON suppliers(is_active);

-- ============================================
-- 5. INGREDIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  supplier_id UUID REFERENCES suppliers(id),
  unit_of_measure TEXT NOT NULL,
  shelf_life_days INTEGER,
  storage_temperature_min DECIMAL(5, 1),
  storage_temperature_max DECIMAL(5, 1),
  reorder_point DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ingredients_code ON ingredients(code);
CREATE INDEX idx_ingredients_supplier ON ingredients(supplier_id);

-- ============================================
-- 6. RECIPE INGREDIENTS TABLE
-- ============================================
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

CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);

-- ============================================
-- 7. INGREDIENT COSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ingredient_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  unit_cost DECIMAL(10, 4) NOT NULL,
  currency TEXT DEFAULT 'USD',
  effective_date DATE DEFAULT CURRENT_DATE,
  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (ingredient_id, supplier_id, effective_date)
);

CREATE INDEX idx_ingredient_costs_ingredient ON ingredient_costs(ingredient_id);

-- ============================================
-- 8. INVENTORY BATCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  batch_number TEXT NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  quantity DECIMAL(10, 2) NOT NULL,
  unit_of_measure TEXT NOT NULL,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  storage_location TEXT,
  storage_temperature DECIMAL(5, 1),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (ingredient_id, batch_number)
);

CREATE INDEX idx_inventory_batches_ingredient ON inventory_batches(ingredient_id);
CREATE INDEX idx_inventory_batches_expiry ON inventory_batches(expiry_date);
CREATE INDEX idx_inventory_batches_location ON inventory_batches(storage_location);

-- ============================================
-- 9. INVENTORY MOVEMENT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES inventory_batches(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('receipt', 'usage', 'waste', 'adjustment')),
  quantity DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  reference_type TEXT,
  reference_id UUID,
  recorded_by UUID REFERENCES user_profiles(id),
  movement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inventory_movements_batch ON inventory_movements(batch_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type);

-- ============================================
-- 10. PRODUCTION BATCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS production_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finished_product_id UUID NOT NULL REFERENCES finished_products(id),
  batch_number TEXT NOT NULL,
  recipe_version INTEGER NOT NULL,
  planned_quantity DECIMAL(10, 2) NOT NULL,
  actual_quantity_produced DECIMAL(10, 2),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_production', 'qc_check', 'completed', 'packaged', 'cancelled')),
  production_date DATE,
  expiry_date DATE,
  qc_notes TEXT,
  qc_passed BOOLEAN,
  produced_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (finished_product_id, batch_number)
);

CREATE INDEX idx_production_batches_product ON production_batches(finished_product_id);
CREATE INDEX idx_production_batches_status ON production_batches(status);
CREATE INDEX idx_production_batches_date ON production_batches(production_date);

-- ============================================
-- 11. TEMPERATURE LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS temperature_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES production_batches(id),
  inventory_batch_id UUID REFERENCES inventory_batches(id),
  temperature DECIMAL(5, 1) NOT NULL,
  humidity DECIMAL(5, 2),
  recorded_by UUID REFERENCES user_profiles(id),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  location TEXT,
  notes TEXT
);

CREATE INDEX idx_temperature_logs_batch ON temperature_logs(batch_id);
CREATE INDEX idx_temperature_logs_inventory ON temperature_logs(inventory_batch_id);

-- ============================================
-- 12. FOOD SAFETY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS food_safety_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_batch_id UUID REFERENCES production_batches(id),
  check_type TEXT NOT NULL CHECK (check_type IN ('temperature', 'hygiene', 'ingredient_check', 'final_inspection')),
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'requires_action')),
  inspector_id UUID REFERENCES user_profiles(id),
  notes TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_food_safety_logs_batch ON food_safety_logs(production_batch_id);

-- ============================================
-- 13. SALES ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_type TEXT CHECK (customer_type IN ('retail', 'wholesale', 'catering', 'direct')),
  order_date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'picked', 'packaged', 'shipped', 'delivered', 'cancelled')),
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sales_orders_number ON sales_orders(order_number);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_sales_orders_date ON sales_orders(order_date);

-- ============================================
-- 14. SALES ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  finished_product_id UUID NOT NULL REFERENCES finished_products(id),
  production_batch_id UUID REFERENCES production_batches(id),
  quantity_ordered DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sales_order_items_order ON sales_order_items(sales_order_id);

-- ============================================
-- 15. DEMAND FORECASTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS demand_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finished_product_id UUID NOT NULL REFERENCES finished_products(id),
  forecast_date DATE NOT NULL,
  period TEXT DEFAULT 'week' CHECK (period IN ('day', 'week', 'month')),
  predicted_demand DECIMAL(10, 2) NOT NULL,
  actual_demand DECIMAL(10, 2),
  confidence_level DECIMAL(3, 2) DEFAULT 0.80,
  forecast_basis TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (finished_product_id, forecast_date, period)
);

CREATE INDEX idx_demand_forecasts_product ON demand_forecasts(finished_product_id);
CREATE INDEX idx_demand_forecasts_date ON demand_forecasts(forecast_date);

-- ============================================
-- 16. SUPPLIER PERFORMANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS supplier_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  on_time_delivery_rate DECIMAL(5, 2) DEFAULT 0,
  quality_score DECIMAL(5, 2) DEFAULT 0,
  price_variance_percent DECIMAL(5, 2) DEFAULT 0,
  temperature_control_compliance BOOLEAN DEFAULT TRUE,
  last_audit_date DATE,
  last_evaluation_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (supplier_id)
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- User Profiles RLS
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Finished Products - Readable by all authenticated users
ALTER TABLE finished_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated users can read products" ON finished_products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can modify products" ON finished_products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Recipes - Readable by production staff, modifiable by managers/admins
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated users can read recipes" ON recipes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Production managers and admins can modify recipes" ON recipes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'production_manager')
    )
  );

-- Inventory Batches - Readable by all, modifiable by managers/admins
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated users can read inventory" ON inventory_batches
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Production managers and admins can modify inventory" ON inventory_batches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'production_manager')
    )
  );

-- Production Batches - Readable by all, modifiable by managers/admins
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated users can read production batches" ON production_batches
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Production managers and admins can modify batches" ON production_batches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'production_manager')
    )
  );

-- Sales Orders - Readable by all, modifiable by managers/admins
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated users can read sales orders" ON sales_orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Sales managers and admins can modify orders" ON sales_orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'production_manager')
    )
  );

-- Create indexes for faster queries
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
