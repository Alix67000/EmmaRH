import { useState } from 'react';
import { useAbsences } from '../hooks/useAbsences';
import { useEmployees } from '../hooks/useEmployees';
import { useAbsenceTypes } from '../hooks/useAbsenceTypes';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Filter } from 'lucide-react';

export default function AbsencesList() {
  const { absences, loading: loadingAbsences } = useAbsences();
  const { employees, loading: loadingEmployees } = useEmployees();
  const { absenceTypes, loading: loadingTypes } = useAbsenceTypes();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<string>('tous');
  
  const loading = loadingAbsences || loadingEmployees || loadingTypes;

  const filteredAbsences = absences.filter(abs => {
    // Basic filter by status
    const matchesStatus = statusFilter === 'tous' || abs.statut === statusFilter;
    
    // Filter by site if manager
    let matchesSite = true;
    if (profile?.role === 'manager' && profile.site_id) {
      const emp = employees.find(e => e.id === abs.employee_id);
      matchesSite = emp?.site_id === profile.site_id;
    }
    
    return matchesStatus && matchesSite;
  });

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.first_name} ${emp.last_name.toUpperCase()}` : 'Inconnu';
  };

  const getTypeName = (id: string) => {
    const type = absenceTypes.find(t => t.id === id);
    return type ? type.name : 'Inconnu';
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
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

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-700">Toutes les absences</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => navigate('/absences/validate')}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded shadow-sm transition-colors"
            >
              Validation
            </button>
            <button 
              onClick={() => navigate('/absences/new')}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Nouvelle absence
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-2 border border-slate-200 rounded-md bg-white outline-none focus:border-emerald-500"
          >
            <option value="tous">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="valide">Validé</option>
            <option value="refuse">Refusé</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-400 font-bold uppercase z-10">
            <tr className="h-8 px-4">
              <th className="pl-4 font-bold">Collaborateur</th>
              <th className="font-bold">Type</th>
              <th className="font-bold">Début</th>
              <th className="font-bold">Fin</th>
              <th className="font-bold">Durée</th>
              <th className="pr-4 font-bold">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center text-slate-500">Chargement...</td></tr>
            ) : filteredAbsences.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-slate-500">Aucune absence trouvée.</td></tr>
            ) : (
              filteredAbsences.map(abs => (
                <tr key={abs.id} className="h-11 hover:bg-slate-50 transition-colors">
                  <td className="pl-4 font-bold text-slate-700">{getEmployeeName(abs.employee_id)}</td>
                  <td className="text-slate-600">{getTypeName(abs.absence_type_id)}</td>
                  <td className="text-slate-600">{abs.date_debut ? new Date(abs.date_debut).toLocaleDateString('fr-FR') : '-'}</td>
                  <td className="text-slate-600">{abs.date_fin ? new Date(abs.date_fin).toLocaleDateString('fr-FR') : '-'}</td>
                  <td className="text-slate-600">{abs.duree} j</td>
                  <td className="pr-4">{getStatusBadge(abs.statut)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

