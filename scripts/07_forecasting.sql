-- Demand forecasts
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

-- Enable RLS
ALTER TABLE demand_forecasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "All authenticated users can view demand_forecasts" ON demand_forecasts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can manage demand_forecasts" ON demand_forecasts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'production_manager')
    )
  );

CREATE INDEX idx_demand_forecasts_product ON demand_forecasts(finished_product_id);
CREATE INDEX idx_demand_forecasts_date ON demand_forecasts(forecast_date);
