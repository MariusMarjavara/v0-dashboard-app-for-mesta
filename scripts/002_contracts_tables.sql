-- Tabell for kontraktsområder fra NVDB
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nummer INTEGER UNIQUE NOT NULL,
  navn TEXT NOT NULL,
  type TEXT NOT NULL, -- 'statens_vegvesen', 'fylkeskommune', 'kommune'
  region TEXT,
  
  -- Geometri fra NVDB (lagret som GeoJSON)
  geometri JSONB,
  
  -- Bounding box for raskere søk
  bbox_north DECIMAL(10, 6),
  bbox_south DECIMAL(10, 6),
  bbox_east DECIMAL(10, 6),
  bbox_west DECIMAL(10, 6),
  
  -- Senterpunkt
  center_lat DECIMAL(10, 6),
  center_lon DECIMAL(10, 6),
  
  -- Metadata
  nvdb_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabell for steder innenfor kontraktsområder
CREATE TABLE IF NOT EXISTS contract_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  contract_nummer INTEGER NOT NULL,
  
  -- Stedsinfo
  name TEXT NOT NULL,
  lat DECIMAL(10, 6) NOT NULL,
  lon DECIMAL(10, 6) NOT NULL,
  
  -- Stedstype og prioritering
  location_type TEXT NOT NULL, -- 'weather_station', 'city', 'town', 'village', 'poi'
  priority INTEGER DEFAULT 50, -- Lavere = høyere prioritet
  
  -- Ekstra metadata
  population INTEGER,
  station_id TEXT, -- For værstasjoner
  source TEXT, -- 'nvdb', 'frost', 'kartverket', 'manual'
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(contract_nummer, name)
);

-- Indekser for raskere søk
CREATE INDEX IF NOT EXISTS idx_contracts_nummer ON contracts(nummer);
CREATE INDEX IF NOT EXISTS idx_contracts_region ON contracts(region);
CREATE INDEX IF NOT EXISTS idx_contract_locations_contract ON contract_locations(contract_nummer);
CREATE INDEX IF NOT EXISTS idx_contract_locations_type ON contract_locations(location_type);
CREATE INDEX IF NOT EXISTS idx_contract_locations_priority ON contract_locations(priority);

-- RLS policies
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_locations ENABLE ROW LEVEL SECURITY;

-- Alle kan lese kontrakter og steder
CREATE POLICY "Anyone can view contracts" ON contracts FOR SELECT USING (true);
CREATE POLICY "Anyone can view locations" ON contract_locations FOR SELECT USING (true);

-- Kun service role kan skrive
CREATE POLICY "Service role can insert contracts" ON contracts FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update contracts" ON contracts FOR UPDATE USING (true);
CREATE POLICY "Service role can insert locations" ON contract_locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update locations" ON contract_locations FOR UPDATE USING (true);
