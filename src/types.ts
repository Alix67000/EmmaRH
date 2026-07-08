export type Role = 'admin' | 'manager';

export type DayKey = 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi' | 'dimanche';

export interface DaySchedule {
  active: boolean;
  debut: string;
  fin: string;
}

export type WeeklySchedule = Record<DayKey, DaySchedule>;

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  site_id: string | null;
  created_at: string;
}

export interface Site {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  site_id: string | null;
  poste: string | null;
  manager_id: string | null;
  status: 'actif' | 'inactif' | 'depart';
  date_entree: string | null;
  date_sortie: string | null;
  email: string | null;
  phone: string | null;
  horaires_travail: WeeklySchedule | null;
  created_at: string;
}

export interface DocumentType {
  id: string;
  name: string;
  created_at: string;
}

export interface Document {
  id: string;
  employee_id: string;
  type: string;
  date_emission: string | null;
  date_expiration: string | null;
  status: 'valide' | 'expirant_bientot' | 'expire';
  onedrive_link: string | null;
  created_at: string;
}

export interface AbsenceType {
  id: string;
  name: string;
  impact_solde: boolean;
  is_custom: boolean;
  created_at: string;
}

export interface Absence {
  id: string;
  employee_id: string;
  absence_type_id: string;
  date_debut: string | null;
  date_fin: string | null;
  duree: number | null;
  commentaire: string | null;
  justificatif_lien: string | null;
  statut: 'en_attente' | 'valide' | 'refuse';
  demande_par: string | null;
  valide_par: string | null;
  created_at: string;
}

export interface SoldeConges {
  id: string;
  employee_id: string;
  annee: number;
  type: string;
  solde_initial: number;
  pris: number;
  solde_restant: number;
}

export interface Notification {
  id: string;
  user_id: string;
  titre: string | null;
  message: string | null;
  lu: boolean;
  lien: string | null;
  created_at: string;
}
