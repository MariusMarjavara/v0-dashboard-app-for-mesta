-- Add flat fields for innkjøp registrations to make export and viewing easier
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS product TEXT,
ADD COLUMN IF NOT EXISTS amount NUMERIC,
ADD COLUMN IF NOT EXISTS price NUMERIC,
ADD COLUMN IF NOT EXISTS comment TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_registrations_type ON registrations(registration_type);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at DESC);
