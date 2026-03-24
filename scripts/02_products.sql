-- Finished products
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

-- Recipes
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

-- Enable RLS
ALTER TABLE finished_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for finished_products
CREATE POLICY "All authenticated users can view products" ON finished_products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can update products" ON finished_products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'production_manager')
    )
  );

-- RLS Policies for recipes
CREATE POLICY "All authenticated users can view recipes" ON recipes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can manage recipes" ON recipes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'production_manager')
    )
  );

CREATE INDEX idx_recipes_finished_product ON recipes(finished_product_id);
CREATE INDEX idx_finished_products_sku ON finished_products(sku);
