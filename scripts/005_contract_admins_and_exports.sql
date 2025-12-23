-- Tabell for kontraktsadministratorer
CREATE TABLE IF NOT EXISTS contract_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_nummer INTEGER REFERENCES contracts(nummer) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, contract_nummer)
);

-- Indekser
CREATE INDEX IF NOT EXISTS idx_contract_admins_user ON contract_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_admins_contract ON contract_admins(contract_nummer);

-- RLS policies
ALTER TABLE contract_admins ENABLE ROW LEVEL SECURITY;

-- Alle kan se hvem som er admin
CREATE POLICY "Anyone can view contract admins" ON contract_admins FOR SELECT USING (true);

-- Kun Mesta-brukere kan legge til/fjerne admins
CREATE POLICY "Mesta users can manage admins" ON contract_admins 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'mesta'
    )
  );

-- Tabell for å logge eksporter
CREATE TABLE IF NOT EXISTS export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  export_type TEXT NOT NULL, -- 'user', 'admin', 'images'
  contract_nummer INTEGER,
  file_path TEXT, -- For Supabase-lagrede filer
  record_count INTEGER,
  exported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_export_logs_user ON export_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_contract ON export_logs(contract_nummer);

ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;

-- Brukere kan se sine egne eksporter
CREATE POLICY "Users can view own exports" ON export_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);
