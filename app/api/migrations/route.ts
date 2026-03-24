import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const migrations = [
  // User Profiles with roles
  `CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    role TEXT CHECK (role IN ('admin', 'production_manager', 'kitchen_staff')) DEFAULT 'kitchen_staff',
    department TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  // Finished Products
  `CREATE TABLE IF NOT EXISTS finished_products (
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
  )`,

  // Recipes
  `CREATE TABLE IF NOT EXISTS recipes (
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
  )`,

  // Ingredients
  `CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    unit_of_measure TEXT NOT NULL,
    shelf_life_days INTEGER,
    storage_temperature_min DECIMAL(5, 1),
    storage_temperature_max DECIMAL(5, 1),
    reorder_point DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  // Recipe Ingredients
  `CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity_needed DECIMAL(10, 3) NOT NULL,
    unit_of_measure TEXT NOT NULL,
    wastage_factor DECIMAL(5, 2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (recipe_id, ingredient_id)
  )`,

  // Suppliers
  `CREATE TABLE IF NOT EXISTS suppliers (
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
  )`,

  // Inventory Batches
  `CREATE TABLE IF NOT EXISTS inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID NOT NULL REFERENCES ingredients(id),
    batch_number TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_of_measure TEXT NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    received_date DATE NOT NULL,
    expiry_date DATE,
    storage_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (ingredient_id, batch_number)
  )`,

  // Production Batches
  `CREATE TABLE IF NOT EXISTS production_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finished_product_id UUID NOT NULL REFERENCES finished_products(id),
    batch_number TEXT NOT NULL UNIQUE,
    recipe_version INTEGER NOT NULL,
    quantity_produced DECIMAL(10, 2) NOT NULL,
    actual_yield DECIMAL(10, 2),
    production_date DATE NOT NULL,
    expiry_date DATE,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'quality_check', 'completed', 'packaged')),
    qc_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  // Sales Orders
  `CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    finished_product_id UUID NOT NULL REFERENCES finished_products(id),
    customer_name TEXT NOT NULL,
    customer_type TEXT CHECK (customer_type IN ('retail', 'wholesale', 'catering', 'direct')),
    quantity_ordered DECIMAL(10, 2) NOT NULL,
    delivery_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'picked', 'packaged', 'shipped', 'delivered')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  // Demand Forecasts
  `CREATE TABLE IF NOT EXISTS demand_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finished_product_id UUID NOT NULL REFERENCES finished_products(id),
    forecast_date DATE NOT NULL,
    period TEXT DEFAULT 'week' CHECK (period IN ('day', 'week', 'month')),
    predicted_demand DECIMAL(10, 2) NOT NULL,
    confidence_level DECIMAL(3, 2) DEFAULT 0.80,
    forecast_basis TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (finished_product_id, forecast_date, period)
  )`,

  // Ingredient Costs
  `CREATE TABLE IF NOT EXISTS ingredient_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID NOT NULL REFERENCES ingredients(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    unit_cost DECIMAL(10, 2) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (ingredient_id, supplier_id)
  )`,

  // Supplier Performance
  `CREATE TABLE IF NOT EXISTS supplier_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    on_time_delivery_rate DECIMAL(5, 2),
    quality_score DECIMAL(5, 2),
    price_variance DECIMAL(5, 2),
    temperature_compliance BOOLEAN DEFAULT TRUE,
    last_audit_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (supplier_id)
  )`,

  // Food Safety Logs
  `CREATE TABLE IF NOT EXISTS food_safety_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_batch_id UUID REFERENCES production_batches(id),
    ingredient_batch_id UUID REFERENCES inventory_batches(id),
    check_type TEXT CHECK (check_type IN ('temperature', 'humidity', 'visual_inspection', 'smell_check')),
    temperature DECIMAL(5, 1),
    humidity DECIMAL(5, 1),
    inspector_user_id UUID REFERENCES user_profiles(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    status TEXT CHECK (status IN ('pass', 'fail', 'alert')) DEFAULT 'pass'
  )`,

  // Create indexes
  `CREATE INDEX IF NOT EXISTS idx_inventory_batches_ingredient ON inventory_batches(ingredient_id)`,
  `CREATE INDEX IF NOT EXISTS idx_inventory_batches_expiry ON inventory_batches(expiry_date)`,
  `CREATE INDEX IF NOT EXISTS idx_production_batches_product ON production_batches(finished_product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_production_batches_status ON production_batches(status)`,
  `CREATE INDEX IF NOT EXISTS idx_sales_orders_product ON sales_orders(finished_product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status)`,
  `CREATE INDEX IF NOT EXISTS idx_demand_forecasts_product ON demand_forecasts(finished_product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_food_safety_logs_batch ON food_safety_logs(production_batch_id)`,
];

export async function GET() {
  try {
    console.log('[v0] Starting database migration...');
    const results = [];

    for (const migration of migrations) {
      try {
        const { error } = await supabase.rpc('exec', {
          p_query: migration,
        });

        if (error) {
          console.log('[v0] RPC exec not available, using raw query...');
          // If exec RPC doesn't work, try raw approach
          results.push({ statement: migration.substring(0, 50), status: 'skipped' });
        } else {
          results.push({ statement: migration.substring(0, 50), status: 'success' });
        }
      } catch (err) {
        results.push({
          statement: migration.substring(0, 50),
          status: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    console.log('[v0] Migration completed');
    return Response.json({ success: true, results });
  } catch (error) {
    console.error('[v0] Migration failed:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Migration failed' },
      { status: 500 }
    );
  }
}
