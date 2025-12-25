-- Add incident tracking columns to registrations table
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS incident_category TEXT,
ADD COLUMN IF NOT EXISTS lat NUMERIC,
ADD COLUMN IF NOT EXISTS lon NUMERIC,
ADD COLUMN IF NOT EXISTS vegreferanse TEXT;

-- Create index for fast incident queries
CREATE INDEX IF NOT EXISTS idx_registrations_incidents 
ON registrations(incident_category, created_at DESC) 
WHERE incident_category IS NOT NULL;

-- Create function to get recent incidents for the map
CREATE OR REPLACE FUNCTION get_recent_incidents(hours_ago INTEGER DEFAULT 24)
RETURNS TABLE (
  id UUID,
  lat NUMERIC,
  lon NUMERIC,
  vegreferanse TEXT,
  category TEXT,
  reportedAt TIMESTAMPTZ,
  ageMinutes NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.lat,
    r.lon,
    r.vegreferanse,
    r.incident_category AS category,
    r.created_at AS reportedAt,
    EXTRACT(EPOCH FROM (NOW() - r.created_at)) / 60 AS ageMinutes
  FROM registrations r
  WHERE r.registration_type = 'voice_memo'
    AND r.incident_category IS NOT NULL
    AND r.lat IS NOT NULL
    AND r.lon IS NOT NULL
    AND r.created_at > NOW() - (hours_ago || ' hours')::INTERVAL
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;
