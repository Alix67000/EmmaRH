import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEmployees } from '../hooks/useEmployees';
import { useSites } from '../hooks/useSites';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Filter } from 'lucide-react';
import { cn } from '../lib/utils';

export default function EmployeesList() {
  const { employees, loading } = useEmployees();
  const { sites } = useSites();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('tous');
  const [siteFilter, setSiteFilter] = useState<string>('tous');

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.poste && emp.poste.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'tous' || emp.status === statusFilter;
    const matchesSite = siteFilter === 'tous' || emp.site_id === siteFilter;

    return matchesSearch && matchesStatus && matchesSite;
  });

  const getSiteName = (siteId: string | null) => {
    return sites.find(s => s.id === siteId)?.name || '-';
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'actif':
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-100 uppercase">Actif</span>;
      case 'inactif':
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold border border-slate-200 uppercase">Inactif</span>;
      case 'depart':
        return <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold border border-red-100 uppercase">Départ</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-700">Liste des collaborateurs</h3>
          <button 
            onClick={() => navigate('/employees/new')}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouveau salarié
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher (nom, prénom, poste)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2 border border-slate-200 rounded-md bg-white outline-none focus:border-emerald-500"
            >
              <option value="tous">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
              <option value="depart">Départ</option>
            </select>

            {profile?.role === 'admin' && (
              <select 
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="py-1.5 px-2 border border-slate-200 rounded-md bg-white outline-none focus:border-emerald-500"
              >
                <option value="tous">Toutes les entités</option>
                {sites.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-400 font-bold uppercase z-10">
            <tr className="h-8 px-4">
              <th className="pl-4 font-bold">Nom</th>
              <th className="font-bold">Prénom</th>
              <th className="font-bold">Entité</th>
              <th className="font-bold">Poste</th>
              <th className="font-bold">Date Entrée</th>
              <th className="font-bold">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center text-slate-500">Chargement...</td></tr>
            ) : filteredEmployees.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-slate-500">Aucun collaborateur trouvé.</td></tr>
            ) : (
              filteredEmployees.map(emp => (
                <tr 
                  key={emp.id} 
                  onClick={() => navigate(`/employees/${emp.id}`)}
                  className="h-11 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="pl-4 font-bold">{emp.last_name.toUpperCase()}</td>
                  <td>{emp.first_name}</td>
                  <td>{getSiteName(emp.site_id)}</td>
                  <td className="text-slate-600">{emp.poste || '-'}</td>
                  <td className="text-slate-600">{emp.date_entree ? new Date(emp.date_entree).toLocaleDateString('fr-FR') : '-'}</td>
                  <td>{getStatusBadge(emp.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

