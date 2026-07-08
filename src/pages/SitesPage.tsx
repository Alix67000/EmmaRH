import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useEmployees } from '../hooks/useEmployees';
import { useAuth } from '../context/AuthContext';
import { Site } from '../types';
import { Plus, Trash2, Pencil, Building2, MapPin, Save, X, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  const { employees, loading: empLoading } = useEmployees();
  const { profile } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<{ name: string; address: string }>({ name: '', address: '' });
  const [saving, setSaving] = useState(false);

  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const openCreateForm = () => {
    setEditingId(null);
    setFormValues({ name: '', address: '' });
    setShowForm(true);
  };

  const openEditForm = (site: Site) => {
    setEditingId(site.id);
    setFormValues({ name: site.name, address: site.address || '' });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormValues({ name: '', address: '' });
  };

  const handleSave = async () => {
    if (!formValues.name.trim()) return;
    setSaving(true);
    try {
      const payload: any = { name: formValues.name.trim() };
      payload.address = formValues.address.trim() ? formValues.address.trim() : null;

      if (editingId) {
        const { error } = await supabase.from('sites').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sites').insert([payload]);
        if (error) throw error;
      }

      closeForm();
      fetchSites();
    } catch (err: any) {
      console.error('Error saving site:', err);
      alert(`Erreur lors de l'enregistrement de l'entité : ${err.message || 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!siteToDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('sites').delete().eq('id', siteToDelete.id);
      if (error) throw error;
      setSiteToDelete(null);
      fetchSites();
    } catch (err: any) {
      console.error('Error deleting site:', err);
      alert(`Erreur lors de la suppression de l'entité : ${err.message || "Elle est peut-être liée à des collaborateurs."}`);
    } finally {
      setDeleting(false);
    }
  };

  const getEmployeeCount = (siteId: string) => {
    return employees.filter(e => e.site_id === siteId).length;
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col min-h-[400px]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            Entités
          </h3>
          {isAdmin && (
            <button
              onClick={openCreateForm}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Nouvelle entité
            </button>
          )}
        </div>

        {showForm && isAdmin && (
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-4">
            <p className="text-xs font-bold text-slate-600">
              {editingId ? "Modifier l'entité" : 'Nouvelle entité'}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nom de l'entité *</label>
                <input
                  type="text"
                  value={formValues.name}
                  onChange={e => setFormValues({ ...formValues, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Adresse (optionnel)</label>
                <input
                  type="text"
                  value={formValues.address}
                  onChange={e => setFormValues({ ...formValues, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeForm}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formValues.name.trim()}
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
                <th className="pl-4 font-bold">Nom de l'entité</th>
                <th className="font-bold">Adresse</th>
                <th className="font-bold">Nb employés</th>
                <th className="pr-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading || empLoading ? (
                <tr><td colSpan={4} className="p-4 text-center text-slate-500">Chargement...</td></tr>
              ) : sites.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-slate-500">Aucune entité trouvée.</td></tr>
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
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditForm(site)}
                            className="text-slate-400 hover:text-emerald-600 p-1 rounded hover:bg-emerald-50 transition-colors"
                            title="Modifier cette entité"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSiteToDelete(site)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Supprimer cette entité"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {siteToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !deleting && setSiteToDelete(null)}
        >
          <div
            className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Supprimer cette entité ?</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Vous êtes sur le point de supprimer <strong>{siteToDelete.name}</strong>.
                    {getEmployeeCount(siteToDelete.id) > 0 && (
                      <>
                        {' '}Cette entité compte actuellement{' '}
                        <strong>{getEmployeeCount(siteToDelete.id)} collaborateur(s)</strong>.
                      </>
                    )}
                    {' '}Cette action est irréversible.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setSiteToDelete(null)}
                disabled={deleting}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" /> Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md shadow-sm disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> {deleting ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
