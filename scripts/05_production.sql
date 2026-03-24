-- Production batches
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

-- Production batch ingredients
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

-- Waste logs
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

-- Enable RLS
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_batch_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "All authenticated users can view production_batches" ON production_batches
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can manage production_batches" ON production_batches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'production_manager')
    )
  );

CREATE POLICY "Kitchen staff can update production_batches status" ON production_batches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('kitchen_staff', 'admin', 'production_manager')
    )
  );

CREATE INDEX idx_production_batches_product ON production_batches(finished_product_id);
CREATE INDEX idx_production_batches_status ON production_batches(status);
CREATE INDEX idx_production_batch_ingredients_batch ON production_batch_ingredients(production_batch_id);
CREATE INDEX idx_waste_logs_batch ON waste_logs(production_batch_id);
