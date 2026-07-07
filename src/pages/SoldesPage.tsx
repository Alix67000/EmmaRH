import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useEmployees } from '../hooks/useEmployees';
import { useSites } from '../hooks/useSites';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FileBadge, Plus, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import { Employee, Site } from '../types';

interface Solde {
  id: string;
  employee_id: string;
  annee: number;
  type: string;
  solde_initial: number;
  pris: number;
  solde_restant: number;
}

export default function SoldesPage() {
  const [soldes, setSoldes] = useState<Solde[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { employees, loading: empLoading } = useEmployees();
  const { sites, loading: sitesLoading } = useSites();
  const { profile } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [newSolde, setNewSolde] = useState<{
    employee_id: string;
    annee: number;
    type: string;
    solde_initial: number;
    pris: number;
  }>({
    employee_id: '',
    annee: new Date().getFullYear(),
    type: 'Congés payés',
    solde_initial: 0,
    pris: 0
  });
  const [saving, setSaving] = useState(false);

  const fetchSoldes = async () => {
    try {
      const { data, error } = await supabase.from('soldes_conges').select('*').order('annee', { ascending: false });
      if (error) throw error;
      setSoldes(data || []);
    } catch (err) {
      console.error('Error fetching soldes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoldes();
  }, []);

  const handleSave = async () => {
    if (!newSolde.employee_id || !newSolde.type || !newSolde.annee) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('soldes_conges').insert([newSolde]);
      if (error) throw error;
      
      setShowForm(false);
      setNewSolde({
        employee_id: '',
        annee: new Date().getFullYear(),
        type: 'Congés payés',
        solde_initial: 0,
        pris: 0
      });
      fetchSoldes();
    } catch (err: any) {
      console.error('Error saving solde:', err);
      alert("Erreur lors de l'enregistrement du solde. Vérifiez si ce solde (année/type) existe déjà pour cet employé.");
    } finally {
      setSaving(false);
    }
  };

  const getSiteName = (siteId: string | null) => {
    return sites.find((s: Site) => s.id === siteId)?.name || 'Inconnu';
  };

  const filteredEmployees = employees.filter((e: Employee) => 
    profile?.role === 'admin' ? true : e.site_id === profile?.site_id
  );

  const formatNumber = (num: number) => Number(num).toFixed(0);

  const groupedSoldes = filteredEmployees.map(emp => {
    const empSoldes = soldes.filter(s => s.employee_id === emp.id);
    return {
      employee: emp,
      soldes: empSoldes
    };
  }).filter(group => group.soldes.length > 0);

  const isDataLoading = loading || empLoading || sitesLoading;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
            <FileBadge className="w-4 h-4 text-slate-400" />
            Soldes & Congés ({groupedSoldes.length} collaborateurs avec soldes)
          </h3>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nouveau solde
          </button>
        </div>

        {showForm && (
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-4">
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Employé *</label>
                <select 
                  value={newSolde.employee_id}
                  onChange={e => setNewSolde({...newSolde, employee_id: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="">Sélectionner un employé</option>
                  {filteredEmployees.map((e: Employee) => (
                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Année *</label>
                <input 
                  type="number" 
                  value={newSolde.annee}
                  onChange={e => setNewSolde({...newSolde, annee: parseInt(e.target.value) || new Date().getFullYear()})}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Type *</label>
                <input 
                  type="text" 
                  value={newSolde.type}
                  onChange={e => setNewSolde({...newSolde, type: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
                  placeholder="Congés payés, RTT..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Solde Initial *</label>
                <input 
                  type="number" 
                  step="0.5"
                  value={newSolde.solde_initial}
                  onChange={e => setNewSolde({...newSolde, solde_initial: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pris</label>
                <input 
                  type="number" 
                  step="0.5"
                  value={newSolde.pris}
                  onChange={e => setNewSolde({...newSolde, pris: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowForm(false)} 
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Annuler
              </button>
              <button 
                onClick={handleSave} 
                disabled={saving || !newSolde.employee_id || !newSolde.type}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" /> Enregistrer
              </button>
            </div>
          </div>
        )}

        <div className="p-4 space-y-6">
          {isDataLoading ? (
            <div className="text-center text-sm text-slate-500 py-8">Chargement...</div>
          ) : groupedSoldes.length === 0 ? (
            <div className="text-center text-sm text-slate-500 py-8">Aucun solde de congés enregistré.</div>
          ) : (
            groupedSoldes.map(({ employee, soldes }) => (
              <div key={employee.id} className="border border-slate-200 rounded-md overflow-hidden shadow-sm">
                <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="font-bold text-sm text-slate-800">
                      <Link to={`/employees/${employee.id}`} className="hover:text-emerald-600 hover:underline">
                        {employee.first_name} {employee.last_name.toUpperCase()}
                      </Link>
                    </div>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded text-[10px] font-bold">
                      {getSiteName(employee.site_id)}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-white border-b border-slate-100 text-slate-400 font-bold uppercase">
                      <tr className="h-8 px-4">
                        <th className="pl-4 font-bold">Année</th>
                        <th className="font-bold">Type</th>
                        <th className="font-bold text-right">Solde Initial</th>
                        <th className="font-bold text-right">Pris</th>
                        <th className="pr-4 font-bold text-right">Restant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {soldes.map(solde => {
                        // Si le solde restant n'est pas remonté ou est null, on le calcule :
                        const restant = solde.solde_restant ?? (solde.solde_initial - solde.pris);
                        return (
                          <tr key={solde.id} className="h-10 bg-white hover:bg-slate-50 transition-colors">
                            <td className="pl-4 font-bold text-slate-600">{solde.annee}</td>
                            <td className="text-slate-600">{solde.type}</td>
                            <td className="text-right font-medium text-slate-600">{formatNumber(solde.solde_initial)}</td>
                            <td className="text-right text-slate-500">{formatNumber(solde.pris)}</td>
                            <td className="pr-4 text-right">
                              <span className={cn(
                                "inline-flex px-2 py-0.5 rounded text-[10px] font-bold",
                                restant > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                restant === 0 ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                "bg-red-50 text-red-700 border border-red-100"
                              )}>
                                {formatNumber(restant)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
