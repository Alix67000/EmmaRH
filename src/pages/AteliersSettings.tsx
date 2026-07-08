import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAteliers } from '../hooks/useAteliers';
import { Plus, Trash2, Pencil, Wrench, Save, X } from 'lucide-react';

export default function AteliersSettings() {
  const { ateliers, loading, refetch } = useAteliers();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const openCreateForm = () => {
    setEditingId(null);
    setName('');
    setShowForm(true);
  };

  const openEditForm = (id: string, currentName: string) => {
    setEditingId(id);
    setName(currentName);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName('');
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase.from('ateliers').update({ name: name.trim() }).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ateliers').insert([{ name: name.trim() }]);
        if (error) throw error;
      }
      closeForm();
      refetch();
    } catch (err: any) {
      alert(`Erreur lors de l'enregistrement : ${err.message || 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cet atelier ?')) return;
    try {
      const { error } = await supabase.from('ateliers').delete().eq('id', id);
      if (error) throw error;
      refetch();
    } catch (err: any) {
      alert(`Erreur lors de la suppression : ${err.message || 'Erreur inconnue'}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col min-h-[400px]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-slate-400" />
            Ateliers
          </h3>
          <button
            onClick={openCreateForm}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nouvel atelier
          </button>
        </div>

        {showForm && (
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                {editingId ? "Nom de l'atelier" : 'Nom du nouvel atelier'} *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full max-w-sm px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
                placeholder="Ex: Lavage & conditionnement"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={closeForm}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                <X className="w-3.5 h-3.5 inline mr-1" /> Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" /> {editingId ? 'Enregistrer les modifications' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-400 font-bold uppercase z-10">
              <tr className="h-8 px-4">
                <th className="pl-4 font-bold w-1/2">Nom</th>
                <th className="font-bold w-1/4">Créé le</th>
                <th className="pr-4 font-bold text-right w-1/4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={3} className="p-4 text-center text-slate-500">Chargement...</td></tr>
              ) : ateliers.length === 0 ? (
                <tr><td colSpan={3} className="p-4 text-center text-slate-500">Aucun atelier trouvé.</td></tr>
              ) : (
                ateliers.map(atelier => (
                  <tr key={atelier.id} className="h-11 hover:bg-slate-50 transition-colors">
                    <td className="pl-4 font-bold text-slate-700">{atelier.name}</td>
                    <td className="text-slate-500">
                      {atelier.created_at ? new Date(atelier.created_at).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="pr-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditForm(atelier.id, atelier.name)}
                          className="text-slate-400 hover:text-emerald-600 p-1 rounded hover:bg-emerald-50 transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(atelier.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
