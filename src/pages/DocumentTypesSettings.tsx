import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, FileText, Save } from 'lucide-react';

interface DocumentType {
  id: string;
  name: string;
  created_at: string;
}

export default function DocumentTypesSettings() {
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .order('name', { ascending: true });
        
      if (error) throw error;
      setTypes(data || []);
    } catch (err) {
      console.error('Error fetching document types:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('document_types')
        .insert([{ name: newName.trim() }]);
        
      if (error) throw error;
      
      setShowForm(false);
      setNewName('');
      fetchTypes();
    } catch (err) {
      console.error('Error saving document type:', err);
      alert("Erreur lors de l'enregistrement du type de document.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce type de document ?')) {
      try {
        const { error } = await supabase
          .from('document_types')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        fetchTypes();
      } catch (err) {
        console.error('Error deleting document type:', err);
        alert("Erreur lors de la suppression du type de document.");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col min-h-[400px]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            Types de documents
          </h3>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nouveau type
          </button>
        </div>

        {showForm && (
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nom du type *</label>
              <input 
                type="text" 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full max-w-sm px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
                placeholder="Ex: Contrat de travail"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowForm(false)} 
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Annuler
              </button>
              <button 
                onClick={handleSave} 
                disabled={saving || !newName.trim()}
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
                <th className="pl-4 font-bold w-1/2">Nom</th>
                <th className="font-bold w-1/4">Créé le</th>
                <th className="pr-4 font-bold text-right w-1/4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={3} className="p-4 text-center text-slate-500">Chargement...</td></tr>
              ) : types.length === 0 ? (
                <tr><td colSpan={3} className="p-4 text-center text-slate-500">Aucun type trouvé.</td></tr>
              ) : (
                types.map(type => (
                  <tr key={type.id} className="h-11 hover:bg-slate-50 transition-colors">
                    <td className="pl-4 font-bold text-slate-700">{type.name}</td>
                    <td className="text-slate-500">
                      {type.created_at ? new Date(type.created_at).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="pr-4 text-right">
                      <button 
                        onClick={() => handleDelete(type.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Supprimer ce type"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
