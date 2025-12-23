-- Legg til rolle-system for brukere
-- Roller: owner (eier), superuser (superbruker), admin (administrator), user (vanlig bruker)

-- Legg til role-kolonne i profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' 
  CHECK (role IN ('owner', 'superuser', 'admin', 'user'));

-- Indeks for rask søk
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Oppdater RLS-policies for profiles
-- Alle kan se profiler
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);

-- Kun owner kan endre andre brukeres roller
CREATE POLICY "Owners can update any profile" ON profiles FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid() AND p.role = 'owner'
    )
  );

-- Superbrukere kan oppdatere vanlige brukere til admin
CREATE POLICY "Superusers can manage admins" ON profiles FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid() AND p.role = 'superuser'
    )
    AND role IN ('user', 'admin')
  );

-- Brukere kan oppdatere sin egen profil (men ikke rolle)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Oppdater contract_admins policies
-- Superbrukere kan også administrere kontraktsadministratorer
DROP POLICY IF EXISTS "Mesta users can manage admins" ON contract_admins;

CREATE POLICY "Owners and superusers can manage contract admins" ON contract_admins 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role IN ('owner', 'superuser') OR profiles.user_type = 'mesta')
    )
  );

-- Logg for rolleendringer
CREATE TABLE IF NOT EXISTS role_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  old_role TEXT,
  new_role TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_changes_user ON role_changes(user_id);

ALTER TABLE role_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and superusers can view role changes" ON role_changes 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('owner', 'superuser')
    )
  );
