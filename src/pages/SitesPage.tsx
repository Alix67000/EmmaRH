import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useEmployees } from '../hooks/useEmployees';
import { useAuth } from '../context/AuthContext';
import { Site } from '../types';
import { Plus, Trash2, Building2, MapPin, Save } from 'lucide-react';
import { cn } from '../lib/utils';

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { employees, loading: empLoading } = useEmployees();

  const [showForm, setShowForm] = useState(false);
  const [newSite, setNewSite] = useState<{ name: string; address: string }>({ name: '', address: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const { data, error } = await supabase.from('sites').select('*').order('name', { ascending: true });
      if (error) throw error;
      setSites(data || []);
    } catch (err) {
      console.error('Error fetching sites:', err);
    } finally {
      setLoading(false);
    }
  };

  const { profile } = useAuth();
  
  const handleSave = async () => {
    if (!newSite.name.trim()) return;
    setSaving(true);
    try {
      const payload: any = { name: newSite.name.trim() };
      if (newSite.address && newSite.address.trim()) {
        payload.address = newSite.address.trim();
      }
      const { error } = await supabase.from('sites').insert([payload]);
      if (error) throw error;
      
      setShowForm(false);
      setNewSite({ name: '', address: '' });
      fetchSites();
    } catch (err: any) {
      console.error('Error saving site:', err);
      alert(`Erreur lors de l'enregistrement du site: ${err.message || 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce site ?')) {
      try {
        const { error } = await supabase.from('sites').delete().eq('id', id);
        if (error) throw error;
        fetchSites();
      } catch (err) {
        console.error('Error deleting site:', err);
        alert("Erreur lors de la suppression du site. Il est peut-être lié à des collaborateurs.");
      }
    }
  };

  const getEmployeeCount = (siteId: string) => {
    return employees.filter(e => e.site_id === siteId).length;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col min-h-[400px]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            Sites Emmaüs
          </h3>
          {profile?.role === 'admin' && (
            <button 
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Nouveau site
            </button>
          )}
        </div>

        {showForm && profile?.role === 'admin' && (
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nom du site *</label>
                <input 
                  type="text" 
                  value={newSite.name}
                  onChange={e => setNewSite({...newSite, name: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Adresse (optionnel)</label>
                <input 
                  type="text" 
                  value={newSite.address}
                  onChange={e => setNewSite({...newSite, address: e.target.value})}
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
                disabled={saving || !newSite.name.trim()}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" /> Enregistrer
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-400 font-bold uppercase z-10">
              <tr className="h-8 px-4">
                <th className="pl-4 font-bold">Nom du site</th>
                <th className="font-bold">Adresse</th>
                <th className="font-bold">Nb employés</th>
                <th className="pr-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading || empLoading ? (
                <tr><td colSpan={4} className="p-4 text-center text-slate-500">Chargement...</td></tr>
              ) : sites.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-slate-500">Aucun site trouvé.</td></tr>
              ) : (
                sites.map(site => (
                  <tr key={site.id} className="h-11 hover:bg-slate-50 transition-colors">
                    <td className="pl-4 font-bold text-slate-700">{site.name}</td>
                    <td>
                      {site.address ? (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {site.address}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td>
                      <span className="inline-flex items-center justify-center px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200">
                        {getEmployeeCount(site.id)}
                      </span>
                    </td>
                    <td className="pr-4 text-right">
                      {profile?.role === 'admin' && (
                        <button 
                          onClick={() => handleDelete(site.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Supprimer ce site"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
