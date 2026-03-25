-- Add scheduling columns to production_batches
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS scheduled_start_time TIMESTAMP;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS scheduled_end_time TIMESTAMP;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMP;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMP;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE production_batches ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

-- Create seasonal_factors table
CREATE TABLE IF NOT EXISTS seasonal_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finished_product_id UUID NOT NULL REFERENCES finished_products(id) ON DELETE CASCADE,
  season TEXT NOT NULL,
  multiplier DECIMAL(5, 2),
  start_date DATE,
  end_date DATE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create demand_events table
CREATE TABLE IF NOT EXISTS demand_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finished_product_id UUID NOT NULL REFERENCES finished_products(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_date DATE,
  expected_surge_factor DECIMAL(5, 2),
  duration_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mrp_runs table
CREATE TABLE IF NOT EXISTS mrp_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trigger_type TEXT CHECK (trigger_type IN ('manual', 'automatic')),
  status TEXT CHECK (status IN ('calculated', 'executed', 'approved')),
  generated_production_qty JSONB,
  generated_purchase_orders JSONB,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_forecasts table for caching AI results
CREATE TABLE IF NOT EXISTS ai_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finished_product_id UUID NOT NULL REFERENCES finished_products(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  predicted_demand DECIMAL(10, 2),
  confidence_level DECIMAL(3, 2),
  reasoning TEXT,
  ai_model TEXT DEFAULT 'gemini-pro',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (finished_product_id, forecast_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_production_batches_scheduled_start ON production_batches(scheduled_start_time);
CREATE INDEX IF NOT EXISTS idx_production_batches_scheduled_end ON production_batches(scheduled_end_time);
CREATE INDEX IF NOT EXISTS idx_seasonal_factors_product ON seasonal_factors(finished_product_id);
CREATE INDEX IF NOT EXISTS idx_demand_events_product ON demand_events(finished_product_id);
CREATE INDEX IF NOT EXISTS idx_mrp_runs_date ON mrp_runs(run_date);
CREATE INDEX IF NOT EXISTS idx_ai_forecasts_product_date ON ai_forecasts(finished_product_id, forecast_date);
