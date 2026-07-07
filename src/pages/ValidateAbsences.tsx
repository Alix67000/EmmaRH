import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAbsences } from '../hooks/useAbsences';
import { useEmployees } from '../hooks/useEmployees';
import { useAbsenceTypes } from '../hooks/useAbsenceTypes';
import { useAuth } from '../context/AuthContext';
import { Check, X, FileText } from 'lucide-react';

export default function ValidateAbsences() {
  const { absences, loading: loadingAbsences } = useAbsences();
  const { employees, loading: loadingEmployees } = useEmployees();
  const { absenceTypes, loading: loadingTypes } = useAbsenceTypes();
  const { profile } = useAuth();

  const [processingId, setProcessingId] = useState<string | null>(null);

  const loading = loadingAbsences || loadingEmployees || loadingTypes;

  const pendingAbsences = absences.filter(abs => {
    if (abs.statut !== 'en_attente') return false;
    
    // Filter by site if manager
    if (profile?.role === 'manager' && profile.site_id) {
      const emp = employees.find(e => e.id === abs.employee_id);
      return emp?.site_id === profile.site_id;
    }
    return true;
  });

  const handleAction = async (id: string, action: 'valide' | 'refuse', absenceTypeId: string, employeeId: string, duree: number | null) => {
    setProcessingId(id);
    try {
      // 1. Update status
      const { error } = await supabase
        .from('absences')
        .update({ statut: action, valide_par: profile?.id })
        .eq('id', id);
        
      if (error) throw error;

      // 2. If valid and impacts solde, update solde_conges
      if (action === 'valide') {
        const type = absenceTypes.find(t => t.id === absenceTypeId);
        if (type?.impact_solde && duree) {
          const anneeCourante = new Date().getFullYear();
          
          // Try to fetch existing solde
          const { data: soldeData, error: soldeError } = await supabase
            .from('soldes_conges')
            .select('*')
            .eq('employee_id', employeeId)
            .eq('annee', anneeCourante)
            .eq('type', type.name)
            .single();

          if (soldeData) {
            await supabase
              .from('soldes_conges')
              .update({ pris: Number(soldeData.pris) + Number(duree) })
              .eq('id', soldeData.id);
          } else {
             // Create it if it doesn't exist
             await supabase
              .from('soldes_conges')
              .insert([{ 
                employee_id: employeeId, 
                annee: anneeCourante, 
                type: type.name,
                solde_initial: 0, // Should be set globally, but 0 as fallback
                pris: Number(duree)
              }]);
          }
        }
      }

      // Refresh would be ideal, but since we use context/hooks, we might need to reload or rely on real-time.
      // For simplicity, a page reload or state update would work.
      window.location.reload();

    } catch (err) {
      console.error('Error processing absence:', err);
      alert('Erreur lors du traitement');
    } finally {
      setProcessingId(null);
    }
  };

  const getEmployee = (id: string) => employees.find(e => e.id === id);
  const getType = (id: string) => absenceTypes.find(t => t.id === id);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/30">
        <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          Absences à valider ({pendingAbsences.length})
        </h3>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center text-slate-500 text-sm">Chargement...</div>
        ) : pendingAbsences.length === 0 ? (
          <div className="text-center text-slate-500 text-sm">Aucune demande en attente.</div>
        ) : (
          pendingAbsences.map(abs => {
            const emp = getEmployee(abs.employee_id);
            const type = getType(abs.absence_type_id);
            
            return (
              <div key={abs.id} className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center font-bold text-sm text-slate-600">
                  {emp?.first_name?.[0]}{emp?.last_name?.[0]}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-800">{emp?.first_name} {emp?.last_name?.toUpperCase()}</p>
                    <span className="text-xs font-bold text-slate-500">
                      Du {abs.date_debut ? new Date(abs.date_debut).toLocaleDateString() : ''} au {abs.date_fin ? new Date(abs.date_fin).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs items-center">
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      {type?.name}
                    </span>
                    <span className="text-slate-500 font-medium">({abs.duree} jours)</span>
                  </div>
                  {abs.commentaire && (
                    <p className="text-xs text-slate-600 mt-2 bg-white p-2 rounded border border-slate-100">
                      "{abs.commentaire}"
                    </p>
                  )}
                  {abs.justificatif_lien && (
                    <a href={abs.justificatif_lien} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 mt-2">
                      <FileText className="w-3.5 h-3.5" /> Voir le justificatif
                    </a>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => handleAction(abs.id, 'valide', abs.absence_type_id, abs.employee_id, abs.duree)}
                    disabled={processingId === abs.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" /> Valider
                  </button>
                  <button 
                    onClick={() => handleAction(abs.id, 'refuse', abs.absence_type_id, abs.employee_id, abs.duree)}
                    disabled={processingId === abs.id}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-700 text-xs font-bold rounded shadow-sm transition-colors disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" /> Refuser
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
