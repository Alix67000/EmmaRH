import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { useSites } from '../hooks/useSites';
import { Shield, MapPin, Save } from 'lucide-react';

export default function UsersRoles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const { sites } = useSites();
  const [loading, setLoading] = useState(true);
  
  // Track changes locally before saving
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (profile: Profile) => {
    setEditingId(profile.id);
    setEditForm({ role: profile.role, site_id: profile.site_id });
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(editForm)
        .eq('id', id);
      if (error) throw error;
      
      setEditingId(null);
      fetchProfiles();
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const getSiteName = (siteId: string | null) => {
    return sites.find(s => s.id === siteId)?.name || 'Toutes les entités (Admin)';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-700">Rôles Utilisateurs</h3>
        </div>
        
        <div className="p-4 bg-slate-50 border-b border-slate-100 text-xs text-slate-500">
          <p>La création de compte (email/mot de passe) doit être effectuée via l'interface Supabase Auth en mode administrateur pour des raisons de sécurité. Vous pouvez ici configurer les rôles et affectations de site des comptes existants.</p>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-400 font-bold uppercase z-10">
              <tr className="h-8 px-4">
                <th className="pl-4 font-bold">Utilisateur</th>
                <th className="font-bold">Email</th>
                <th className="font-bold">Rôle</th>
                <th className="font-bold">Affectation Entité</th>
                <th className="pr-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-4 text-center text-slate-500">Chargement...</td></tr>
              ) : profiles.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-slate-500">Aucun profil trouvé.</td></tr>
              ) : (
                profiles.map(profile => (
                  <tr key={profile.id} className="h-14 hover:bg-slate-50 transition-colors">
                    <td className="pl-4 font-bold text-slate-700">{profile.full_name || 'Sans nom'}</td>
                    <td className="text-slate-600">{profile.email}</td>
                    
                    <td>
                      {editingId === profile.id ? (
                        <select 
                          value={editForm.role}
                          onChange={(e) => setEditForm({...editForm, role: e.target.value as any})}
                          className="px-2 py-1.5 border border-slate-200 rounded text-xs outline-none focus:border-emerald-500 w-32"
                        >
                          <option value="admin">Administrateur</option>
                          <option value="manager">Manager</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Shield className={`w-3.5 h-3.5 ${profile.role === 'admin' ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className={profile.role === 'admin' ? 'font-bold text-emerald-700' : 'text-slate-600'}>
                            {profile.role === 'admin' ? 'Admin' : 'Manager'}
                          </span>
                        </div>
                      )}
                    </td>

                    <td>
                      {editingId === profile.id ? (
                        <select 
                          value={editForm.site_id || ''}
                          onChange={(e) => setEditForm({...editForm, site_id: e.target.value || null})}
                          className="px-2 py-1.5 border border-slate-200 rounded text-xs outline-none focus:border-emerald-500 max-w-[180px]"
                        >
                          <option value="">Aucun (ou Tous)</option>
                          {sites.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {getSiteName(profile.site_id)}
                        </div>
                      )}
                    </td>

                    <td className="pr-4 text-right">
                      {editingId === profile.id ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1">Annuler</button>
                          <button 
                            onClick={() => handleSave(profile.id)}
                            disabled={saving}
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded font-bold transition-colors disabled:opacity-50"
                          >
                            <Save className="w-3.5 h-3.5" /> Enregistrer
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => startEdit(profile)}
                          className="text-emerald-600 hover:text-emerald-800 font-bold"
                        >
                          Modifier
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
