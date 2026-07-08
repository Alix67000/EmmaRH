import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Employee, WeeklySchedule, DayKey, Absence, AbsenceType } from '../types';
import { useSites } from '../hooks/useSites';
import { useAuth } from '../context/AuthContext';
import { useContractRenewals } from '../hooks/useContractRenewals';
import { useAbsenceTypes } from '../hooks/useAbsenceTypes';
import { useAteliers } from '../hooks/useAteliers';
import {
  ArrowLeft, Save, Trash2, FileText, CalendarOff, Clock,
  Briefcase, PlusCircle, Umbrella, TrendingUp, RefreshCw,
} from 'lucide-react';
import { cn } from '../lib/utils';

const DAYS: { key: DayKey; label: string }[] = [
  { key: 'lundi', label: 'Lundi' },
  { key: 'mardi', label: 'Mardi' },
  { key: 'mercredi', label: 'Mercredi' },
  { key: 'jeudi', label: 'Jeudi' },
  { key: 'vendredi', label: 'Vendredi' },
  { key: 'samedi', label: 'Samedi' },
  { key: 'dimanche', label: 'Dimanche' },
];

const DEFAULT_SCHEDULE: WeeklySchedule = {
  lundi: { active: true, debut: '09:00', fin: '17:00' },
  mardi: { active: true, debut: '09:00', fin: '17:00' },
  mercredi: { active: true, debut: '09:00', fin: '17:00' },
  jeudi: { active: true, debut: '09:00', fin: '17:00' },
  vendredi: { active: true, debut: '09:00', fin: '17:00' },
  samedi: { active: false, debut: '09:00', fin: '17:00' },
  dimanche: { active: false, debut: '09:00', fin: '17:00' },
};

function timeToMinutes(t: string): number {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatHours(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

function dayDurationMinutes(day: { active: boolean; debut: string; fin: string }): number {
  if (!day.active) return 0;
  const start = timeToMinutes(day.debut);
  const end = timeToMinutes(day.fin);
  return end > start ? end - start : 0;
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString('fr-FR') : '-';
}

export default function EmployeeDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { sites } = useSites();
  const { ateliers } = useAteliers();

  const [employee, setEmployee] = useState<Partial<Employee>>({ status: 'actif' });
  const [schedule, setSchedule] = useState<WeeklySchedule>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNew = id === 'new';

  // --- Contrats ---
  const { renewals: contracts, loading: contractsLoading, refetch: refetchContracts } = useContractRenewals(isNew ? undefined : id);
  const [showContractForm, setShowContractForm] = useState(false);
  const [contractForm, setContractForm] = useState({ contract_type: 'cdd' as 'cdi' | 'cdd', date_debut: '', date_fin: '', commentaire: '' });
  const [savingContract, setSavingContract] = useState(false);

  // --- Congés & absences ---
  const { absenceTypes } = useAbsenceTypes();
  const [employeeAbsences, setEmployeeAbsences] = useState<Absence[]>([]);
  const [loadingAbsences, setLoadingAbsences] = useState(true);
  const [employeeSoldes, setEmployeeSoldes] = useState<any[]>([]);
  const [loadingSoldes, setLoadingSoldes] = useState(true);
  const [recalculatingConges, setRecalculatingConges] = useState(false);

  useEffect(() => {
    if (isNew) {
      if (profile?.role === 'manager' && profile.site_id) {
        setEmployee(prev => ({ ...prev, site_id: profile.site_id }));
      }
      setLoading(false);
      setLoadingAbsences(false);
      setLoadingSoldes(false);
      return;
    }

    const fetchEmployee = async () => {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setEmployee(data);
        setSchedule(data.horaires_travail || DEFAULT_SCHEDULE);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchAbsences = async () => {
      try {
        const { data, error } = await supabase
          .from('absences')
          .select('*')
          .eq('employee_id', id)
          .order('date_debut', { ascending: false });
        if (error) throw error;
        setEmployeeAbsences(data || []);
      } catch (err) {
        console.error('Error fetching employee absences:', err);
      } finally {
        setLoadingAbsences(false);
      }
    };

    const fetchSoldesAndAutoCalc = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const { data, error } = await supabase
          .from('soldes_conges')
          .select('*')
          .eq('employee_id', id)
          .order('annee', { ascending: false });
        if (error) throw error;

        const hasCurrentYearCP = (data || []).some(
          (s: any) => s.annee === currentYear && s.type === 'Congés payés'
        );

        if (!hasCurrentYearCP) {
          // Aucun solde "Congés payés" pour l'année en cours : on le calcule automatiquement
          const { error: rpcError } = await supabase.rpc('recalculate_conges_payes', {
            p_employee_id: id,
            p_annee: currentYear,
          });
          if (!rpcError) {
            const { data: refreshed } = await supabase
              .from('soldes_conges')
              .select('*')
              .eq('employee_id', id)
              .order('annee', { ascending: false });
            setEmployeeSoldes(refreshed || []);
          } else {
            setEmployeeSoldes(data || []);
          }
        } else {
          setEmployeeSoldes(data || []);
        }
      } catch (err) {
        console.error('Error fetching/calculating employee soldes:', err);
      } finally {
        setLoadingSoldes(false);
      }
    };

    fetchEmployee();
    fetchAbsences();
    fetchSoldesAndAutoCalc();
  }, [id, isNew, profile]);

  const handleChange = (field: keyof Employee, value: any) => {
    setEmployee(prev => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: DayKey) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], active: !prev[day].active },
    }));
  };

  const updateDayTime = (day: DayKey, field: 'debut' | 'fin', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const totalWeeklyMinutes = DAYS.reduce((sum, d) => sum + dayDurationMinutes(schedule[d.key]), 0);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = { ...employee, horaires_travail: schedule };
      if (isNew) {
        const { data, error } = await supabase.from('employees').insert([payload]).select().single();
        if (error) throw error;
        navigate(`/employees/${data.id}`);
      } else {
        const { error } = await supabase.from('employees').update(payload).eq('id', id);
        if (error) throw error;
        navigate('/employees');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Voulez-vous vraiment marquer ce collaborateur comme "Départ" ?')) {
      setSaving(true);
      try {
        const { error } = await supabase.from('employees').update({ status: 'depart' }).eq('id', id);
        if (error) throw error;
        navigate('/employees');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleAddContract = async () => {
    if (!id || !contractForm.date_debut) return;
    setSavingContract(true);
    try {
      const { error: insertError } = await supabase.from('contract_renewals').insert([{
        employee_id: id,
        contract_type: contractForm.contract_type,
        date_debut: contractForm.date_debut,
        date_fin: contractForm.date_fin || null,
        commentaire: contractForm.commentaire || null,
      }]);
      if (insertError) throw insertError;

      setContractForm({ contract_type: 'cdd', date_debut: '', date_fin: '', commentaire: '' });
      setShowContractForm(false);
      refetchContracts();
    } catch (err: any) {
      alert(`Erreur lors de l'ajout du contrat : ${err.message}`);
    } finally {
      setSavingContract(false);
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    if (!confirm('Supprimer ce contrat de l\'historique ?')) return;
    try {
      const { error } = await supabase.from('contract_renewals').delete().eq('id', contractId);
      if (error) throw error;
      refetchContracts();
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const handleRecalculateConges = async () => {
    if (!id) return;
    setRecalculatingConges(true);
    try {
      const currentYear = new Date().getFullYear();
      const { error } = await supabase.rpc('recalculate_conges_payes', {
        p_employee_id: id,
        p_annee: currentYear,
      });
      if (error) throw error;

      const { data, error: fetchError } = await supabase
        .from('soldes_conges')
        .select('*')
        .eq('employee_id', id)
        .order('annee', { ascending: false });
      if (fetchError) throw fetchError;
      setEmployeeSoldes(data || []);
    } catch (err: any) {
      alert(`Erreur lors du recalcul : ${err.message || 'Erreur inconnue'}`);
    } finally {
      setRecalculatingConges(false);
    }
  };

  const getAbsenceTypeName = (typeId: string) => {
    return absenceTypes.find((t: AbsenceType) => t.id === typeId)?.name || 'Inconnu';
  };

  const getAbsenceStatusBadge = (status: string) => {
    switch (status) {
      case 'valide':
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-100 uppercase">Validé</span>;
      case 'en_attente':
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[10px] font-bold border border-amber-100 uppercase">En attente</span>;
      case 'refuse':
        return <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold border border-red-100 uppercase">Refusé</span>;
      default:
        return <span>{status}</span>;
    }
  };

  // Le contrat "actuel" = celui avec la date de début la plus récente
  const sortedContracts = [...contracts].sort((a, b) => (a.date_debut < b.date_debut ? 1 : -1));
  const currentContract = sortedContracts[0];

  const currentYear = new Date().getFullYear();
  const currentYearSoldes = employeeSoldes.filter(s => s.annee === currentYear);
  const totalSoldeRestant = currentYearSoldes.reduce((sum, s) => sum + Number(s.solde_restant ?? (s.solde_initial - s.pris)), 0);
  const totalPrisAnnee = currentYearSoldes.reduce((sum, s) => sum + Number(s.pris || 0), 0);
  const totalAbsencesEnAttente = employeeAbsences.filter(a => a.statut === 'en_attente').length;

  if (loading) return <div className="p-4 text-sm text-slate-500">Chargement...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/employees')} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>

        {!isNew && (
          <div className="flex gap-2">
            <Link to={`/employees/${id}/documents`} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded shadow-sm transition-colors">
              <FileText className="w-3.5 h-3.5" /> Documents
            </Link>
            <Link to={`/absences?employee_id=${id}`} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded shadow-sm transition-colors">
              <CalendarOff className="w-3.5 h-3.5" /> Absences
            </Link>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-sm text-slate-700">
            {isNew ? 'Nouveau collaborateur' : `Fiche de ${employee.first_name} ${employee.last_name}`}
          </h3>
          <div className="flex items-center gap-2">
            {!isNew && employee.status !== 'depart' && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 text-xs font-bold rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Départ
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 border border-red-100 rounded text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Prénom</label>
                <input
                  type="text"
                  value={employee.first_name || ''}
                  onChange={e => handleChange('first_name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nom</label>
                <input
                  type="text"
                  value={employee.last_name || ''}
                  onChange={e => handleChange('last_name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Entité</label>
                <select
                  value={employee.site_id || ''}
                  onChange={e => handleChange('site_id', e.target.value)}
                  disabled={profile?.role === 'manager'}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white disabled:bg-slate-50"
                >
                  <option value="">Sélectionner une entité</option>
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Poste</label>
                <input
                  type="text"
                  value={employee.poste || ''}
                  onChange={e => handleChange('poste', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Atelier</label>
                <select
                  value={employee.atelier_id || ''}
                  onChange={e => handleChange('atelier_id', e.target.value || null)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="">Aucun atelier</option>
                  {ateliers.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Statut</label>
                <select
                  value={employee.status || 'actif'}
                  onChange={e => handleChange('status', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="depart">Départ</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email professionnel</label>
                <input
                  type="email"
                  value={employee.email || ''}
                  onChange={e => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={employee.phone || ''}
                  onChange={e => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Horaires de travail hebdomadaires */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              <Clock className="w-3.5 h-3.5" />
              Horaires de travail hebdomadaires
            </h4>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase">
                  <tr className="h-9">
                    <th className="pl-4 font-bold">Jour</th>
                    <th className="font-bold">Travaillé</th>
                    <th className="font-bold">Début</th>
                    <th className="font-bold">Fin</th>
                    <th className="pr-4 font-bold text-right">Durée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {DAYS.map(({ key, label }) => {
                    const day = schedule[key];
                    const durationMin = dayDurationMinutes(day);
                    return (
                      <tr key={key} className={cn('h-12', !day.active && 'bg-slate-50/50')}>
                        <td className="pl-4 font-bold text-slate-700">{label}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => toggleDay(key)}
                            className={cn(
                              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                              day.active ? 'bg-emerald-600' : 'bg-slate-200'
                            )}
                          >
                            <span
                              className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                              style={{ transform: day.active ? 'translateX(18px)' : 'translateX(2px)' }}
                            />
                          </button>
                        </td>
                        <td>
                          <input
                            type="time"
                            value={day.debut}
                            disabled={!day.active}
                            onChange={e => updateDayTime(key, 'debut', e.target.value)}
                            className="px-2 py-1 text-xs border border-slate-200 rounded-md outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </td>
                        <td>
                          <input
                            type="time"
                            value={day.fin}
                            disabled={!day.active}
                            onChange={e => updateDayTime(key, 'fin', e.target.value)}
                            className="px-2 py-1 text-xs border border-slate-200 rounded-md outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </td>
                        <td className="pr-4 text-right font-bold text-slate-600">
                          {day.active && durationMin > 0 ? formatHours(durationMin) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="h-11 bg-emerald-50/50 border-t border-emerald-100">
                    <td colSpan={4} className="pl-4 font-bold text-emerald-800 text-right pr-3">
                      Total hebdomadaire
                    </td>
                    <td className="pr-4 text-right font-black text-emerald-700 text-sm">
                      {formatHours(totalWeeklyMinutes)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Contrats de travail */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-400" />
              Contrats
            </h3>
            {currentContract && (
              <p className="text-[11px] text-slate-500 mt-1">
                Contrat actuel : <strong className="text-slate-700 uppercase">{currentContract.contract_type}</strong> depuis le {fmtDate(currentContract.date_debut)}
                {currentContract.date_fin && <> — fin prévue le {fmtDate(currentContract.date_fin)}</>}
              </p>
            )}
          </div>
          {!isNew && (
            <button
              onClick={() => setShowContractForm(!showContractForm)}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm transition-colors flex-shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Ajouter un contrat
            </button>
          )}
        </div>

        {isNew ? (
          <div className="p-6 text-center text-xs text-slate-500">
            Enregistrez d'abord la fiche pour pouvoir ajouter des contrats.
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {showContractForm && (
              <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-lg space-y-3">
                <p className="text-xs font-bold text-slate-600">
                  {contracts.length === 0 ? 'Premier contrat' : `Contrat n°${contracts.length + 1}`}
                </p>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Type *</label>
                    <select
                      value={contractForm.contract_type}
                      onChange={e => setContractForm({ ...contractForm, contract_type: e.target.value as 'cdi' | 'cdd' })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
                    >
                      <option value="cdd">CDD</option>
                      <option value="cdi">CDI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date début *</label>
                    <input
                      type="date"
                      value={contractForm.date_debut}
                      onChange={e => setContractForm({ ...contractForm, date_debut: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Date fin {contractForm.contract_type === 'cdi' && <span className="normal-case font-normal text-slate-400">(N/A)</span>}
                    </label>
                    <input
                      type="date"
                      value={contractForm.date_fin}
                      disabled={contractForm.contract_type === 'cdi'}
                      onChange={e => setContractForm({ ...contractForm, date_fin: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Commentaire</label>
                    <input
                      type="text"
                      value={contractForm.commentaire}
                      onChange={e => setContractForm({ ...contractForm, commentaire: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
                      placeholder="Ex: contrat initial, avenant..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowContractForm(false)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddContract}
                    disabled={savingContract || !contractForm.date_debut}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" /> Enregistrer le contrat
                  </button>
                </div>
              </div>
            )}

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase">
                  <tr className="h-8">
                    <th className="pl-3 font-bold">Type</th>
                    <th className="font-bold">Début</th>
                    <th className="font-bold">Fin</th>
                    <th className="font-bold">Commentaire</th>
                    <th className="pr-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contractsLoading ? (
                    <tr><td colSpan={5} className="p-3 text-center text-slate-500">Chargement...</td></tr>
                  ) : sortedContracts.length === 0 ? (
                    <tr><td colSpan={5} className="p-3 text-center text-slate-500">Aucun contrat enregistré. Cliquez sur "Ajouter un contrat" pour créer le premier.</td></tr>
                  ) : (
                    sortedContracts.map((c, idx) => (
                      <tr key={c.id} className="h-10 hover:bg-slate-50">
                        <td className="pl-3">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border',
                            c.contract_type === 'cdi' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                          )}>
                            {c.contract_type}
                          </span>
                          {idx === 0 && (
                            <span className="ml-1.5 text-[9px] font-bold text-emerald-600 uppercase">actuel</span>
                          )}
                        </td>
                        <td className="font-bold text-slate-700">{fmtDate(c.date_debut)}</td>
                        <td className="text-slate-600">{fmtDate(c.date_fin)}</td>
                        <td className="text-slate-500">{c.commentaire || '-'}</td>
                        <td className="pr-3 text-right">
                          <button
                            onClick={() => handleDeleteContract(c.id)}
                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Congés & Absences */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
            <Umbrella className="w-4 h-4 text-slate-400" />
            Congés & Absences
          </h3>
          {!isNew && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleRecalculateConges}
                disabled={recalculatingConges}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-600 text-xs font-bold rounded shadow-sm transition-colors disabled:opacity-50"
                title="Recalcule le solde légal : 2,5 jours ouvrables acquis par mois de contrat actif"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', recalculatingConges && 'animate-spin')} />
                Recalculer le solde CP
              </button>
              <Link
                to="/absences/new"
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded shadow-sm transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Nouvelle absence
              </Link>
            </div>
          )}
        </div>

        {isNew ? (
          <div className="p-6 text-center text-xs text-slate-500">
            Enregistrez d'abord la fiche pour voir les congés et absences de ce collaborateur.
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Stats rapides */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <p className="text-[10px] font-bold uppercase tracking-wider">Solde restant {currentYear}</p>
                </div>
                <p className="text-xl font-black text-emerald-700 mt-1">{totalSoldeRestant} j</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Jours pris {currentYear}</p>
                <p className="text-xl font-black text-slate-700 mt-1">{totalPrisAnnee} j</p>
              </div>
              <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">En attente de validation</p>
                <p className="text-xl font-black text-amber-700 mt-1">{totalAbsencesEnAttente}</p>
              </div>
            </div>

            {/* Soldes par année/type */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Soldes de congés</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase">
                    <tr className="h-8">
                      <th className="pl-3 font-bold">Année</th>
                      <th className="font-bold">Type</th>
                      <th className="font-bold text-right">Initial</th>
                      <th className="font-bold text-right">Pris</th>
                      <th className="pr-3 font-bold text-right">Restant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingSoldes ? (
                      <tr><td colSpan={5} className="p-3 text-center text-slate-500">Chargement...</td></tr>
                    ) : employeeSoldes.length === 0 ? (
                      <tr><td colSpan={5} className="p-3 text-center text-slate-500">Aucun solde enregistré.</td></tr>
                    ) : (
                      employeeSoldes.map(s => {
                        const restant = s.solde_restant ?? (s.solde_initial - s.pris);
                        return (
                          <tr key={s.id} className="h-9 hover:bg-slate-50">
                            <td className="pl-3 font-bold text-slate-700">{s.annee}</td>
                            <td className="text-slate-600">{s.type}</td>
                            <td className="text-right text-slate-600">{s.solde_initial}</td>
                            <td className="text-right text-slate-500">{s.pris}</td>
                            <td className="pr-3 text-right">
                              <span className={cn(
                                'inline-flex px-2 py-0.5 rounded text-[10px] font-bold',
                                restant > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                restant === 0 ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                'bg-red-50 text-red-700 border border-red-100'
                              )}>
                                {restant}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Liste des absences */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Historique des absences ({employeeAbsences.length})
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase">
                    <tr className="h-8">
                      <th className="pl-3 font-bold">Type</th>
                      <th className="font-bold">Début</th>
                      <th className="font-bold">Fin</th>
                      <th className="font-bold">Durée</th>
                      <th className="pr-3 font-bold">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingAbsences ? (
                      <tr><td colSpan={5} className="p-3 text-center text-slate-500">Chargement...</td></tr>
                    ) : employeeAbsences.length === 0 ? (
                      <tr><td colSpan={5} className="p-3 text-center text-slate-500">Aucune absence enregistrée.</td></tr>
                    ) : (
                      employeeAbsences.map(a => (
                        <tr key={a.id} className="h-9 hover:bg-slate-50">
                          <td className="pl-3 font-bold text-slate-700">{getAbsenceTypeName(a.absence_type_id)}</td>
                          <td className="text-slate-600">{fmtDate(a.date_debut)}</td>
                          <td className="text-slate-600">{fmtDate(a.date_fin)}</td>
                          <td className="text-slate-500">{a.duree} j</td>
                          <td className="pr-3">{getAbsenceStatusBadge(a.statut)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
