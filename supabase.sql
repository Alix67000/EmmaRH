-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) profiles (extends auth.users)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  role text CHECK (role IN ('admin','manager')) NOT NULL DEFAULT 'manager',
  site_id uuid,
  created_at timestamptz DEFAULT now()
);

-- 2) sites
CREATE TABLE sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  created_at timestamptz DEFAULT now()
);

-- Foreign key for profiles to sites (added after sites table creation)
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_sites FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL;

-- 3) employees
CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text,
  last_name text,
  site_id uuid REFERENCES sites(id) ON DELETE SET NULL,
  poste text,
  manager_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  status text CHECK (status IN ('actif','inactif','depart')) DEFAULT 'actif',
  date_entree date,
  date_sortie date,
  email text,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- 4) document_types
CREATE TABLE document_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 5) documents
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  type text,
  date_emission date,
  date_expiration date,
  status text CHECK (status IN ('valide','expirant_bientot','expire')),
  onedrive_link text,
  created_at timestamptz DEFAULT now()
);

-- Trigger for documents status calculation
CREATE OR REPLACE FUNCTION update_document_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_expiration IS NULL THEN
    NEW.status = 'valide';
  ELSIF NEW.date_expiration < CURRENT_DATE THEN
    NEW.status = 'expire';
  ELSIF NEW.date_expiration <= (CURRENT_DATE + interval '30 days') THEN
    NEW.status = 'expirant_bientot';
  ELSE
    NEW.status = 'valide';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_document_status
BEFORE INSERT OR UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION update_document_status();

-- 6) absence_types
CREATE TABLE absence_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  impact_solde boolean DEFAULT false,
  is_custom boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 7) absences
CREATE TABLE absences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  absence_type_id uuid REFERENCES absence_types(id) ON DELETE CASCADE,
  date_debut date,
  date_fin date,
  duree numeric,
  commentaire text,
  justificatif_lien text,
  statut text CHECK (statut IN ('en_attente','valide','refuse')) DEFAULT 'en_attente',
  demande_par uuid REFERENCES profiles(id) ON DELETE SET NULL,
  valide_par uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 8) soldes_conges
CREATE TABLE soldes_conges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  annee int NOT NULL,
  type text,
  solde_initial numeric DEFAULT 0,
  pris numeric DEFAULT 0,
  solde_restant numeric GENERATED ALWAYS AS (solde_initial - pris) STORED,
  UNIQUE (employee_id, annee, type)
);

-- 9) notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  titre text,
  message text,
  lu boolean DEFAULT false,
  lien text,
  created_at timestamptz DEFAULT now()
);

-- RLS Enable
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE absence_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE soldes_conges ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_my_role() RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get current user's site_id
CREATE OR REPLACE FUNCTION get_my_site_id() RETURNS uuid AS $$
  SELECT site_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS Policies

-- profiles
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "profiles_manager_site" ON profiles FOR SELECT USING (
  id = auth.uid() OR site_id = get_my_site_id()
);
CREATE POLICY "profiles_manager_update_self" ON profiles FOR UPDATE USING (id = auth.uid());

-- sites
CREATE POLICY "sites_admin_all" ON sites FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "sites_manager_site" ON sites FOR SELECT USING (id = get_my_site_id());

-- employees
CREATE POLICY "employees_admin_all" ON employees FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "employees_manager_site" ON employees FOR ALL USING (site_id = get_my_site_id());

-- document_types
CREATE POLICY "doc_types_read_all" ON document_types FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "doc_types_admin_write" ON document_types FOR ALL USING (get_my_role() = 'admin');

-- documents
CREATE POLICY "documents_admin_all" ON documents FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "documents_manager_site" ON documents FOR ALL USING (
  EXISTS (SELECT 1 FROM employees WHERE id = documents.employee_id AND site_id = get_my_site_id())
);

-- absence_types
CREATE POLICY "abs_types_read_all" ON absence_types FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "abs_types_admin_write" ON absence_types FOR ALL USING (get_my_role() = 'admin');

-- absences
CREATE POLICY "absences_admin_all" ON absences FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "absences_manager_site" ON absences FOR ALL USING (
  EXISTS (SELECT 1 FROM employees WHERE id = absences.employee_id AND site_id = get_my_site_id())
);

-- soldes_conges
CREATE POLICY "soldes_admin_all" ON soldes_conges FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "soldes_manager_site" ON soldes_conges FOR ALL USING (
  EXISTS (SELECT 1 FROM employees WHERE id = soldes_conges.employee_id AND site_id = get_my_site_id())
);

-- notifications
CREATE POLICY "notifications_user_only" ON notifications FOR ALL USING (user_id = auth.uid());

-- Triggers for profiles
CREATE OR REPLACE FUNCTION on_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'role', 'manager'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_trigger
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION on_auth_user_created();

-- SEED DATA

DO $$
DECLARE
  site_stras uuid;
  site_mulhouse uuid;
  site_colmar uuid;
  user_admin uuid := gen_random_uuid();
  user_manager1 uuid := gen_random_uuid();
  user_manager2 uuid := gen_random_uuid();
  emp_jean uuid;
  emp_marie uuid;
  emp_luc uuid;
  type_cni uuid;
  type_permis uuid;
  type_cp uuid;
  type_maladie uuid;
BEGIN
  -- Insert sites
  INSERT INTO sites (name, address) VALUES ('Emmaüs Strasbourg', 'Strasbourg') RETURNING id INTO site_stras;
  INSERT INTO sites (name, address) VALUES ('Emmaüs Mulhouse', 'Mulhouse') RETURNING id INTO site_mulhouse;
  INSERT INTO sites (name, address) VALUES ('Emmaüs Colmar', 'Colmar') RETURNING id INTO site_colmar;

  -- Insert Auth Users
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
  VALUES
  ('00000000-0000-0000-0000-000000000000', user_admin, 'authenticated', 'authenticated', 'admin@emmarh.fr', crypt('admin123', gen_salt('bf')), now(), '{"full_name": "Admin Principal", "role": "admin"}'),
  ('00000000-0000-0000-0000-000000000000', user_manager1, 'authenticated', 'authenticated', 'manager1@emmarh.fr', crypt('manager123', gen_salt('bf')), now(), '{"full_name": "Manager Stras", "role": "manager"}'),
  ('00000000-0000-0000-0000-000000000000', user_manager2, 'authenticated', 'authenticated', 'manager2@emmarh.fr', crypt('manager123', gen_salt('bf')), now(), '{"full_name": "Manager Mulhouse", "role": "manager"}');

  -- Update profiles with sites (profiles are created by trigger)
  UPDATE profiles SET site_id = site_stras WHERE id = user_manager1;
  UPDATE profiles SET site_id = site_mulhouse WHERE id = user_manager2;

  -- Employees
  INSERT INTO employees (first_name, last_name, site_id, poste, status) VALUES 
  ('Jean', 'Dupont', site_stras, 'Encadrant', 'actif') RETURNING id INTO emp_jean;
  INSERT INTO employees (first_name, last_name, site_id, poste, status) VALUES 
  ('Marie', 'Curie', site_mulhouse, 'Logistique', 'actif') RETURNING id INTO emp_marie;
  INSERT INTO employees (first_name, last_name, site_id, poste, status) VALUES 
  ('Luc', 'Martin', site_colmar, 'Chauffeur', 'actif') RETURNING id INTO emp_luc;
  INSERT INTO employees (first_name, last_name, site_id, poste, status) VALUES 
  ('Sophie', 'Germain', site_stras, 'Comptable', 'inactif');
  INSERT INTO employees (first_name, last_name, site_id, poste, status) VALUES 
  ('Albert', 'Camus', site_mulhouse, 'Vendeur', 'actif');
  INSERT INTO employees (first_name, last_name, site_id, poste, status) VALUES 
  ('Simone', 'Veil', site_colmar, 'Encadrant', 'depart');
  INSERT INTO employees (first_name, last_name, site_id, poste, status) VALUES 
  ('Louis', 'Pasteur', site_stras, 'Vendeur', 'actif');

  -- Absence types
  INSERT INTO absence_types (name, impact_solde) VALUES ('Congés payés', true) RETURNING id INTO type_cp;
  INSERT INTO absence_types (name, impact_solde) VALUES ('Arrêts de travail', false) RETURNING id INTO type_maladie;
  INSERT INTO absence_types (name, impact_solde) VALUES ('Formations', false);
  INSERT INTO absence_types (name, impact_solde) VALUES ('Stages', false);
  INSERT INTO absence_types (name, impact_solde) VALUES ('Absence injustifiée', false);
  INSERT INTO absence_types (name, impact_solde) VALUES ('Enfant malade', false);
  INSERT INTO absence_types (name, impact_solde) VALUES ('Journée solidarité', false);
  INSERT INTO absence_types (name, impact_solde) VALUES ('Décès proche', false);
  INSERT INTO absence_types (name, impact_solde) VALUES ('Congé sans solde', true);
  INSERT INTO absence_types (name, impact_solde) VALUES ('Retards', false);
  INSERT INTO absence_types (name, impact_solde) VALUES ('Garde d''enfants covid', false);
  INSERT INTO absence_types (name, impact_solde) VALUES ('Arrêt suite AT', false);
  INSERT INTO absence_types (name, impact_solde) VALUES ('Chômage technique', false);
  INSERT INTO absence_types (name, impact_solde) VALUES ('RDV AST', false);
  INSERT INTO absence_types (name, impact_solde) VALUES ('Début contrat', false);

  -- Document types
  INSERT INTO document_types (name) VALUES ('CNI') RETURNING id INTO type_cni;
  INSERT INTO document_types (name) VALUES ('Permis de conduire') RETURNING id INTO type_permis;
  INSERT INTO document_types (name) VALUES ('Attestation') ;

  -- Documents
  INSERT INTO documents (employee_id, type, date_expiration) VALUES 
  (emp_jean, 'CNI', '2023-05-12'), -- expiré
  (emp_luc, 'Permis de conduire', current_date + interval '14 days'), -- expirant_bientot
  (emp_marie, 'CNI', current_date + interval '1 year'), -- valide
  (emp_jean, 'Permis de conduire', current_date + interval '2 years'); -- valide

  -- Absences
  INSERT INTO absences (employee_id, absence_type_id, date_debut, date_fin, duree, statut, demande_par)
  VALUES 
  (emp_luc, type_cp, current_date, current_date + interval '2 days', 2, 'en_attente', user_admin),
  (emp_marie, type_maladie, current_date, current_date, 0.5, 'valide', user_admin);

END $$;
