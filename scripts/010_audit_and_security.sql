-- =====================================================
-- AUDIT LOGGING SYSTEM
-- =====================================================

-- Audit logs tabell (append-only, uforanderlig)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  target_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- RLS for audit_logs - kun admin+ kan lese
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_read_admin" ON audit_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.rolle IN ('owner', 'superuser', 'admin', 'auditor')
    )
  );

-- Ingen kan slette audit logs (append-only)
CREATE POLICY "audit_no_delete" ON audit_logs 
  FOR DELETE 
  USING (false);

-- Trigger function for å logge profil-endringer
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Logg rolleendringer
  IF NEW.rolle IS DISTINCT FROM OLD.rolle THEN
    INSERT INTO audit_logs (
      actor_id,
      target_id,
      action,
      table_name,
      old_data,
      new_data
    )
    VALUES (
      auth.uid(),
      OLD.id,
      'ROLE_CHANGED',
      'profiles',
      jsonb_build_object('rolle', OLD.rolle),
      jsonb_build_object('rolle', NEW.rolle)
    );
  END IF;
  
  -- Logg kontraktsendringer
  IF NEW.contract_area IS DISTINCT FROM OLD.contract_area THEN
    INSERT INTO audit_logs (
      actor_id,
      target_id,
      action,
      table_name,
      old_data,
      new_data
    )
    VALUES (
      auth.uid(),
      OLD.id,
      'CONTRACT_CHANGED',
      'profiles',
      jsonb_build_object('contract_area', OLD.contract_area),
      jsonb_build_object('contract_area', NEW.contract_area)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_profile_audit ON profiles;
CREATE TRIGGER trg_profile_audit
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_profile_changes();

-- =====================================================
-- AUDITOR ROLLE (read-only revisjon)
-- =====================================================

-- Oppdater rolle-constraint til å inkludere auditor
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_rolle_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_rolle_check 
  CHECK (rolle IN ('owner', 'superuser', 'admin', 'user', 'auditor'));

-- =====================================================
-- STRAMMERE RLS POLICIES
-- =====================================================

-- PROFILES: Stram opp oppdateringsrettigheter
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Brukere kan kun oppdatere sitt eget navn/telefon, ikke rolle
CREATE POLICY "Users can update own basic info" ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND rolle = (SELECT rolle FROM profiles WHERE id = auth.uid())
    AND user_type = (SELECT user_type FROM profiles WHERE id = auth.uid())
  );

-- Kun høyere roller kan endre lavere roller
CREATE POLICY "Higher roles can update lower roles" ON profiles 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles me
      WHERE me.id = auth.uid()
      AND me.rolle IN ('owner', 'superuser')
    )
  );

-- REGISTRATIONS: Kun eier kan endre sine egne
DROP POLICY IF EXISTS "Users can update own registrations" ON registrations;

CREATE POLICY "Users can update own recent registrations" ON registrations 
  FOR UPDATE 
  USING (
    user_id = auth.uid()
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- Admin+ kan endre alle
CREATE POLICY "Admins can update all registrations" ON registrations 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.rolle IN ('owner', 'superuser', 'admin')
    )
  );

-- =====================================================
-- SECURE VIEWS FOR OPTIMIZED QUERIES
-- =====================================================

-- Registreringer med brukerinfo (sikker view)
CREATE OR REPLACE VIEW registrations_with_user AS
SELECT
  r.id,
  r.registration_type,
  r.data,
  r.user_id,
  r.contract_area,
  r.contract_nummer,
  r.created_at,
  r.updated_at,
  p.full_name as user_name,
  p.email as user_email,
  p.user_type,
  p.rolle as user_role
FROM registrations r
JOIN profiles p ON p.id = r.user_id;

-- RLS for view
ALTER VIEW registrations_with_user SET (security_barrier = true);

-- Kontraktsaktivitet (for dashboards)
CREATE OR REPLACE VIEW contract_activity_summary AS
SELECT
  COALESCE(r.contract_nummer, 0) as contract_nummer,
  COALESCE(r.contract_area, 'Ukjent') as contract_area,
  r.registration_type,
  DATE(r.created_at) as date,
  COUNT(*) as count,
  COUNT(DISTINCT r.user_id) as unique_users,
  MAX(r.created_at) as last_registration
FROM registrations r
GROUP BY r.contract_nummer, r.contract_area, r.registration_type, DATE(r.created_at);

-- =====================================================
-- UE ISOLASJON
-- =====================================================

-- Sikre at UE-brukere kun ser sine egne data
DROP POLICY IF EXISTS "Users can view registrations" ON registrations;

CREATE POLICY "Users can view appropriate registrations" ON registrations 
  FOR SELECT 
  USING (
    -- Owner/superuser ser alt
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.rolle IN ('owner', 'superuser', 'auditor')
    )
    OR
    -- Admin ser sitt kontraktsområde
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.rolle = 'admin'
      AND profiles.contract_area = registrations.contract_area
    )
    OR
    -- Brukere ser sine egne
    user_id = auth.uid()
  );
