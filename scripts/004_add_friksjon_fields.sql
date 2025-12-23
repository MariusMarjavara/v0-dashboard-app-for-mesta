-- Add flat columns for friksjon registration type
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS has_run_today BOOLEAN,
  ADD COLUMN IF NOT EXISTS why_not TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS start_tiltak BOOLEAN,
  ADD COLUMN IF NOT EXISTS tiltak TEXT[],
  ADD COLUMN IF NOT EXISTS lowest_friction DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS general_friction DECIMAL(4,2);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_registrations_type ON registrations(registration_type);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at DESC);
