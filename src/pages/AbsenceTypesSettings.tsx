import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AbsenceType } from '../types';
import { Plus, Trash2 } from 'lucide-react';

export default function AbsenceTypesSettings() {
  const [types, setTypes] = useState<AbsenceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newType, setNewType] = useState({ name: '', impact_solde: false, is_custom: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const { data, error } = await supabase.from('absence_types').select('*').order('name');
      if (error) throw error;
      setTypes(data || []);
    } catch (err) {
      console.error('Error fetching types:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newType.name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('absence_types').insert([newType]);
      if (error) throw error;
      setShowForm(false);
      setNewType({ name: '', impact_solde: false, is_custom: true });
      fetchTypes();
    } catch (err) {
      console.error('Error saving type:', err);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce type personnalisé ?')) {
      try {
        const { error } = await supabase.from('absence_types').delete().eq('id', id);
        if (error) throw error;
        fetchTypes();
      } catch (err) {
        console.error('Error deleting type:', err);
        alert('Erreur: ' + (err as any).message);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-700">Types d'absence</h3>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nouveau type
          </button>
        </div>

        {showForm && (
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-4">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nom du type</label>
                <input 
                  type="text" 
                  value={newType.name}
                  onChange={e => setNewType({...newType, name: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
                />
              </div>
              <div className="mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={newType.impact_solde}
                    onChange={e => setNewType({...newType, impact_solde: e.target.checked})}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-bold text-slate-700">Déduit des congés</span>
                </label>
              </div>
              <button 
                onClick={handleSave}
                disabled={saving || !newType.name.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded shadow-sm disabled:opacity-50"
              >
                {saving ? '...' : 'Ajouter'}
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-400 font-bold uppercase z-10">
              <tr className="h-8 px-4">
                <th className="pl-4 font-bold">Nom</th>
                <th className="font-bold">Impact Solde</th>
                <th className="font-bold">Origine</th>
                <th className="pr-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="p-4 text-center text-slate-500">Chargement...</td></tr>
              ) : types.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-slate-500">Aucun type trouvé.</td></tr>
              ) : (
                types.map(type => (
                  <tr key={type.id} className="h-11 hover:bg-slate-50 transition-colors">
                    <td className="pl-4 font-bold text-slate-700">{type.name}</td>
                    <td>
                      {type.impact_solde ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold border border-amber-100 uppercase">Oui</span>
                      ) : (
                        <span className="text-slate-400">Non</span>
                      )}
                    </td>
                    <td>
                      {type.is_custom ? (
                        <span className="text-emerald-600 font-bold">Personnalisé</span>
                      ) : (
                        <span className="text-slate-400">Système</span>
                      )}
                    </td>
                    <td className="pr-4 text-right">
                      {type.is_custom && (
                        <button 
                          onClick={() => handleDelete(type.id)}
                          className="text-red-500 hover:text-red-700 p-1"
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
