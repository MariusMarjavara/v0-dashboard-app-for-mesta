-- Produksjonsklare forbedringer basert på teknisk gjennomgang
-- Implementerer: ENUM, indekser, updated_at trigger, strammere RLS, contract_area kobling

-- ============================================
-- 1. ENUM for registreringstyper (konsistens + ytelse)
-- ============================================
DO $$ BEGIN
  CREATE TYPE registration_type_enum AS ENUM (
    'arbeidsdok',
    'innkjop',
    'avvik',
    'uoensket_hendelse',
    'forbedringsforslag',
    'maskin',
    'vinterarbeid',
    'friksjon',
    'utbedring'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Konverter eksisterende data til ENUM
ALTER TABLE registrations 
ALTER COLUMN registration_type 
TYPE registration_type_enum 
USING registration_type::registration_type_enum;

-- ============================================
-- 2. Legg til contract_area og contract_nummer på registrations (VIKTIG for filtrering)
-- ============================================
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS contract_area TEXT,
ADD COLUMN IF NOT EXISTS contract_nummer INTEGER;

-- Oppdater eksisterende registreringer med contract info fra bruker
UPDATE registrations r
SET contract_area = p.contract_area
FROM profiles p
WHERE r.user_id = p.id
AND r.contract_area IS NULL;

-- ============================================
-- 3. Legg til updated_at på registrations
-- ============================================
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================
-- 4. Trigger for automatisk updated_at
-- ============================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Legg til trigger på profiles
DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Legg til trigger på registrations
DROP TRIGGER IF EXISTS set_registrations_updated_at ON registrations;
CREATE TRIGGER set_registrations_updated_at
BEFORE UPDATE ON registrations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Legg til trigger på contracts
DROP TRIGGER IF EXISTS set_contracts_updated_at ON contracts;
CREATE TRIGGER set_contracts_updated_at
BEFORE UPDATE ON contracts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Legg til trigger på contract_locations
DROP TRIGGER IF EXISTS set_contract_locations_updated_at ON contract_locations;
CREATE TRIGGER set_contract_locations_updated_at
BEFORE UPDATE ON contract_locations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================
-- 5. Kritiske indekser for ytelse (MÅ HA)
-- ============================================

-- Registrations indekser
CREATE INDEX IF NOT EXISTS idx_registrations_created_at 
ON registrations (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_registrations_user_id 
ON registrations (user_id);

CREATE INDEX IF NOT EXISTS idx_registrations_type 
ON registrations (registration_type);

CREATE INDEX IF NOT EXISTS idx_registrations_contract_area 
ON registrations (contract_area);

CREATE INDEX IF NOT EXISTS idx_registrations_contract_nummer 
ON registrations (contract_nummer);

-- JSONB indekser for ofte brukte felt
CREATE INDEX IF NOT EXISTS idx_registrations_data_vegreferanse 
ON registrations USING GIN ((data -> 'vegreferanse'));

CREATE INDEX IF NOT EXISTS idx_registrations_data_order_number 
ON registrations USING GIN ((data -> 'order_number'));

CREATE INDEX IF NOT EXISTS idx_registrations_data_location 
ON registrations USING GIN ((data -> 'location'));

-- Profiles indekser
CREATE INDEX IF NOT EXISTS idx_profiles_company 
ON profiles (company);

CREATE INDEX IF NOT EXISTS idx_profiles_user_type 
ON profiles (user_type);

CREATE INDEX IF NOT EXISTS idx_profiles_contract_area 
ON profiles (contract_area);

CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles (email);

-- ============================================
-- 6. Strammere RLS policies (produksjonsklar)
-- ============================================

-- Registrations: Brukere ser kun egne + samme firma/kontrakt
DROP POLICY IF EXISTS "Users can view all registrations" ON registrations;

CREATE POLICY "Users can view own or same company registrations"
ON registrations
FOR SELECT
USING (
  -- Egen registrering
  user_id = auth.uid()
  OR
  -- Samme firma
  EXISTS (
    SELECT 1 FROM profiles p1, profiles p2
    WHERE p1.id = auth.uid()
    AND p2.id = registrations.user_id
    AND p1.company = p2.company
  )
  OR
  -- Mesta-brukere ser alt på sin kontrakt
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.user_type = 'mesta'
    AND (
      registrations.contract_area = p.contract_area
      OR p.rolle IN ('owner', 'superuser')
    )
  )
);

-- Profiles: Brukere ser profiler i samme firma eller kontrakt
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

CREATE POLICY "Users can view relevant profiles"
ON profiles
FOR SELECT
USING (
  -- Egen profil
  id = auth.uid()
  OR
  -- Samme firma
  company = (SELECT company FROM profiles WHERE id = auth.uid())
  OR
  -- Mesta-brukere ser alle på sin kontrakt
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.user_type = 'mesta'
    AND (
      profiles.contract_area = p.contract_area
      OR p.rolle IN ('owner', 'superuser')
    )
  )
);

-- ============================================
-- 7. Storage bucket policies for bilder
-- ============================================

-- Oppdater storage.objects policies for registrations bucket
-- (Må kjøres manuelt i Supabase Storage UI eller via API)

-- Policy for lesing: Samme logikk som registrations
-- Policy for skriving: Kun egen bruker kan laste opp

-- ============================================
-- 8. Nyttige views for rapportering
-- ============================================

-- Flat view for enklere rapportering
CREATE OR REPLACE VIEW v_registrations_flat AS
SELECT 
  r.id,
  r.user_id,
  r.registered_by_name,
  r.registration_type::text as registration_type,
  r.contract_area,
  r.contract_nummer,
  r.created_at,
  r.updated_at,
  
  -- Ekstraher viktige felt fra JSONB
  r.data->>'order_number' as order_number,
  r.data->>'vegreferanse' as vegreferanse,
  r.data->>'comment' as comment,
  r.data->>'location' as location,
  (r.data->'gps'->>'lat')::decimal as gps_lat,
  (r.data->'gps'->>'lon')::decimal as gps_lon,
  
  -- Brukerinfo
  p.full_name,
  p.email,
  p.company,
  p.user_type,
  
  -- Kontraktsinfo
  c.navn as contract_name,
  c.region as contract_region
  
FROM registrations r
LEFT JOIN profiles p ON r.user_id = p.id
LEFT JOIN contracts c ON r.contract_nummer = c.nummer;

-- View for daglig aggregering per kontrakt
CREATE OR REPLACE VIEW v_daily_registrations_summary AS
SELECT 
  DATE(created_at) as date,
  contract_area,
  contract_nummer,
  registration_type::text,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM registrations
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY DATE(created_at), contract_area, contract_nummer, registration_type
ORDER BY date DESC, contract_area, registration_type;

-- View for bilder med metadata
CREATE OR REPLACE VIEW v_registrations_with_images AS
SELECT 
  r.id,
  r.registration_type::text,
  r.contract_area,
  r.created_at,
  r.data->>'vegreferanse' as vegreferanse,
  jsonb_array_length(COALESCE(r.data->'images', '[]'::jsonb)) as image_count,
  r.data->'images' as images,
  p.full_name,
  p.company
FROM registrations r
LEFT JOIN profiles p ON r.user_id = p.id
WHERE jsonb_array_length(COALESCE(r.data->'images', '[]'::jsonb)) > 0;

-- ============================================
-- 9. Funksjoner for datakvalitet
-- ============================================

-- Funksjon for å validere vegreferanse-format
CREATE OR REPLACE FUNCTION is_valid_vegreferanse(veg_ref TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Enkel validering: FV123 HP1 m1234 eller E6 HP1 m1234
  RETURN veg_ref ~ '^(FV|RV|E)\d+\s+HP\d+\s+m\d+$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Funksjon for å hente registreringer for en kontrakt innen periode
CREATE OR REPLACE FUNCTION get_contract_registrations(
  p_contract_nummer INTEGER,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  id UUID,
  registration_type TEXT,
  registered_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.registration_type::text,
    r.registered_by_name,
    r.created_at,
    r.data
  FROM registrations r
  WHERE r.contract_nummer = p_contract_nummer
  AND r.created_at BETWEEN p_start_date AND p_end_date
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Kommentarer og dokumentasjon
-- ============================================

COMMENT ON TABLE registrations IS 'Hovedtabell for alle feltregistreringer fra Mesta og UE';
COMMENT ON COLUMN registrations.data IS 'JSONB-struktur med fleksibel data per registreringstype';
COMMENT ON COLUMN registrations.contract_area IS 'Kontraktsområde for filtrering og rapportering';
COMMENT ON VIEW v_registrations_flat IS 'Flat view for enklere rapportering og eksport';
COMMENT ON FUNCTION get_contract_registrations IS 'Hent alle registreringer for en kontrakt i en periode';
