import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useEmployees } from '../hooks/useEmployees';
import { useAbsenceTypes } from '../hooks/useAbsenceTypes';
import { ArrowLeft, Save } from 'lucide-react';
import { Absence } from '../types';
import { useJoursFeries } from '../hooks/useJoursFeries';

export default function NewAbsence() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { employees } = useEmployees();
  const { absenceTypes } = useAbsenceTypes();
  const { joursFeries, loading: loadingJoursFeries } = useJoursFeries();

  const [absence, setAbsence] = useState<Partial<Absence>>({ statut: 'en_attente' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeEmployees = employees.filter(e => {
    if (e.status === 'depart') return false;
    if (profile?.role === 'manager' && profile.site_id) {
      return e.site_id === profile.site_id;
    }
    return true;
  });

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 0;
    const d1 = new Date(start);
    const d2 = new Date(end);
    if (d1 > d2) return 0;

    let count = 0;
    const cursor = new Date(d1);
    while (cursor <= d2) {
      const dayOfWeek = cursor.getDay(); // 0 = dimanche, 6 = samedi
      const isoDate = cursor.toISOString().split('T')[0];
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isFerie = joursFeries.has(isoDate);
      if (!isWeekend && !isFerie) {
        count += 1;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return count;
  };

  const handleDateChange = (field: 'date_debut' | 'date_fin', value: string) => {
    setAbsence(prev => {
      const updated = { ...prev, [field]: value };
      if (updated.date_debut && updated.date_fin) {
        updated.duree = calculateDuration(updated.date_debut, updated.date_fin);
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!absence.employee_id || !absence.absence_type_id || !absence.date_debut || !absence.date_fin) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const dataToInsert = {
        ...absence,
        demande_par: profile?.id,
      };

      const { data, error } = await supabase.from('absences').insert([dataToInsert]).select().single();
      if (error) throw error;

      // Create notification for managers of the employee's site
      const employee = employees.find(e => e.id === absence.employee_id);
      const employeeSiteId = employee?.site_id || null;
      
      if (employeeSiteId) {
        const { data: managers } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'manager')
          .eq('site_id', employeeSiteId);
          
        if (managers && managers.length > 0) {
          const employeePrenom = employee?.first_name || '';
          const employeeNom = employee?.last_name || '';
          const typeObj = absenceTypes.find(t => t.id === absence.absence_type_id);
          const typeName = typeObj?.name || 'Absence';
          const dateDebut = new Date(absence.date_debut!).toLocaleDateString('fr-FR');
          const dateFin = new Date(absence.date_fin!).toLocaleDateString('fr-FR');

          const notifs = managers.map(m => ({
            user_id: m.id,
            titre: "Nouvelle demande d'absence",
            message: `${employeePrenom} ${employeeNom.toUpperCase()} — ${typeName} du ${dateDebut} au ${dateFin}`,
            lien: '/absences/validate'
          }));
          await supabase.from('notifications').insert(notifs);
        }
      }

      navigate('/absences');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/absences')} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" />
          Retour aux absences
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-sm text-slate-700">Nouvelle demande d'absence</h3>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> Enregistrer
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Collaborateur *</label>
              <select
                value={absence.employee_id || ''}
                onChange={e => setAbsence({...absence, employee_id: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
              >
                <option value="">Sélectionner un collaborateur</option>
                {activeEmployees.map(e => (
                  <option key={e.id} value={e.id}>{e.first_name} {e.last_name.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Type d'absence *</label>
              <select
                value={absence.absence_type_id || ''}
                onChange={e => setAbsence({...absence, absence_type_id: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
              >
                <option value="">Sélectionner un type</option>
                {absenceTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name} {t.impact_solde ? '(Déduit des congés)' : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date de début *</label>
              <input 
                type="date" 
                value={absence.date_debut || ''} 
                onChange={e => handleDateChange('date_debut', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date de fin *</label>
              <input 
                type="date" 
                value={absence.date_fin || ''} 
                onChange={e => handleDateChange('date_fin', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Durée (jours ouvrés)</label>
              <input 
                type="number" 
                step="0.5"
                value={absence.duree || 0} 
                onChange={e => setAbsence({...absence, duree: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-slate-50"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {loadingJoursFeries
                  ? 'Chargement des jours fériés (Alsace-Moselle)...'
                  : 'Calculé automatiquement : jours ouvrés (lun-ven), hors jours fériés (zone Alsace-Moselle, via calendrier.api.gouv.fr). Modifiable manuellement si besoin.'}
              </p>
            </div>
            
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Justificatif (Lien OneDrive / Info)</label>
              <input 
                type="text" 
                placeholder="https://..."
                value={absence.justificatif_lien || ''} 
                onChange={e => setAbsence({...absence, justificatif_lien: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Commentaire</label>
              <textarea 
                rows={3}
                value={absence.commentaire || ''} 
                onChange={e => setAbsence({...absence, commentaire: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500"
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
