-- Oppdater RLS policies for contract_locations slik at kontraktsadministratorer kan redigere
DROP POLICY IF EXISTS "Service role can update locations" ON contract_locations;
DROP POLICY IF EXISTS "Service role can insert locations" ON contract_locations;

-- Kontraktsadministratorer kan oppdatere lokasjoner for sine kontrakter
CREATE POLICY "Contract admins can update locations" ON contract_locations 
  FOR UPDATE 
  USING (
    contract_nummer IN (
      SELECT contract_nummer 
      FROM contract_admins 
      WHERE user_id = auth.uid()
    )
  );

-- Kontraktsadministratorer kan legge til lokasjoner for sine kontrakter
CREATE POLICY "Contract admins can insert locations" ON contract_locations 
  FOR INSERT 
  WITH CHECK (
    contract_nummer IN (
      SELECT contract_nummer 
      FROM contract_admins 
      WHERE user_id = auth.uid()
    )
  );

-- Kontraktsadministratorer kan slette lokasjoner for sine kontrakter
CREATE POLICY "Contract admins can delete locations" ON contract_locations 
  FOR DELETE 
  USING (
    contract_nummer IN (
      SELECT contract_nummer 
      FROM contract_admins 
      WHERE user_id = auth.uid()
    )
  );

-- Service role kan fortsatt gjøre alt
CREATE POLICY "Service role can manage locations" ON contract_locations 
  FOR ALL 
  USING (true);
