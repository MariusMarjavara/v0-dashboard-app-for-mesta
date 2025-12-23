-- Dokumentdatabase for deling av dokumenter mellom brukere
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  category TEXT, -- 'prosedyre', 'skjema', 'instruks', 'annet'
  contract_nummer INTEGER REFERENCES contracts(nummer),
  uploaded_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_contract ON documents(contract_nummer);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_public ON documents(is_public);

-- RLS policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Alle kan se offentlige dokumenter
CREATE POLICY "Anyone can view public documents" ON documents 
  FOR SELECT 
  USING (is_public = true);

-- Brukere kan se dokumenter for sine kontrakter
CREATE POLICY "Users can view contract documents" ON documents 
  FOR SELECT 
  USING (
    contract_nummer IN (
      SELECT contract_nummer FROM profiles WHERE id = auth.uid()
    )
  );

-- Superusers og owner kan laste opp dokumenter
CREATE POLICY "Superusers can manage documents" ON documents 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.rolle IN ('owner', 'superuser', 'admin')
    )
  );

-- Logging tabell for dokumenttilgang
CREATE TABLE IF NOT EXISTS document_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT, -- 'view', 'download'
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_access_log_document ON document_access_log(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_log_user ON document_access_log(user_id);

ALTER TABLE document_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own access log" ON document_access_log 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Enum for bedre type-sikkerhet på roller (anbefaling fra tilbakemelding)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'superuser', 'admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Audit log for rolleendringer (sikkerhetstiltak fra tilbakemelding)
ALTER TABLE rolle_changes ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE rolle_changes ADD COLUMN IF NOT EXISTS ip_address TEXT;
