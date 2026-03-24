-- Inventory batches
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

-- Temperature logs
CREATE TABLE IF NOT EXISTS temperature_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_batch_id UUID NOT NULL REFERENCES inventory_batches(id) ON DELETE CASCADE,
  temperature DECIMAL(5, 1) NOT NULL,
  humidity DECIMAL(5, 1),
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recorded_by UUID REFERENCES user_profiles(id)
);

-- Enable RLS
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE temperature_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "All authenticated users can view inventory_batches" ON inventory_batches
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can manage inventory_batches" ON inventory_batches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'production_manager')
    )
  );

CREATE POLICY "Kitchen staff can view inventory_batches" ON inventory_batches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('kitchen_staff', 'admin', 'production_manager')
    )
  );

CREATE INDEX idx_inventory_batches_ingredient ON inventory_batches(ingredient_id);
CREATE INDEX idx_inventory_batches_expiry ON inventory_batches(expiry_date);
CREATE INDEX idx_inventory_batches_status ON inventory_batches(status);
CREATE INDEX idx_temperature_logs_batch ON temperature_logs(inventory_batch_id);
