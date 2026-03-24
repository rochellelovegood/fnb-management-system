-- Suppliers (needed before ingredients)
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

-- Ingredients
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

-- Recipe ingredients
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

-- Ingredient costs
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

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_costs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "All authenticated users can view suppliers" ON suppliers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can manage suppliers" ON suppliers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'production_manager')
    )
  );

CREATE POLICY "All authenticated users can view ingredients" ON ingredients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can manage ingredients" ON ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'production_manager')
    )
  );

CREATE POLICY "All authenticated users can view recipe_ingredients" ON recipe_ingredients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can manage recipe_ingredients" ON recipe_ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'production_manager')
    )
  );

CREATE INDEX idx_ingredients_code ON ingredients(code);
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_suppliers_code ON suppliers(code);
