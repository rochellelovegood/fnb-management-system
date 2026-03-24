-- Supplier performance
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

-- Food safety logs
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

-- Purchase orders
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

-- Enable RLS
ALTER TABLE supplier_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_safety_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "All authenticated users can view supplier_performance" ON supplier_performance
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can manage supplier_performance" ON supplier_performance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'production_manager')
    )
  );

CREATE POLICY "All authenticated users can view food_safety_logs" ON food_safety_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Kitchen staff can log food_safety_logs" ON food_safety_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Managers can manage purchase_orders" ON purchase_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'production_manager')
    )
  );

CREATE INDEX idx_supplier_performance_supplier ON supplier_performance(supplier_id);
CREATE INDEX idx_food_safety_logs_batch ON food_safety_logs(batch_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
