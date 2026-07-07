import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Employee } from '../types';
import { useSites } from '../hooks/useSites';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, Trash2, FileText, CalendarOff } from 'lucide-react';

export default function EmployeeDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { sites } = useSites();
  
  const [employee, setEmployee] = useState<Partial<Employee>>({ status: 'actif' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNew = id === 'new';

  useEffect(() => {
    if (isNew) {
      if (profile?.role === 'manager' && profile.site_id) {
        setEmployee(prev => ({ ...prev, site_id: profile.site_id }));
      }
      setLoading(false);
      return;
    }

    const fetchEmployee = async () => {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setEmployee(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id, isNew, profile]);

  const handleChange = (field: keyof Employee, value: any) => {
    setEmployee(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        const { data, error } = await supabase.from('employees').insert([employee]).select().single();
        if (error) throw error;
        navigate(`/employees/${data.id}`);
      } else {
        const { error } = await supabase.from('employees').update(employee).eq('id', id);
        if (error) throw error;
        navigate('/employees');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Voulez-vous vraiment marquer ce collaborateur comme "Départ" ?')) {
      setSaving(true);
      try {
        const { error } = await supabase.from('employees').update({ status: 'depart' }).eq('id', id);
        if (error) throw error;
        navigate('/employees');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) return <div className="p-4 text-sm text-slate-500">Chargement...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/employees')} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
        
        {!isNew && (
          <div className="flex gap-2">
            <Link to={`/employees/${id}/documents`} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded shadow-sm transition-colors">
              <FileText className="w-3.5 h-3.5" /> Documents
            </Link>
            <Link to={`/absences?employee_id=${id}`} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded shadow-sm transition-colors">
              <CalendarOff className="w-3.5 h-3.5" /> Absences
            </Link>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-sm text-slate-700">
            {isNew ? 'Nouveau collaborateur' : `Fiche de ${employee.first_name} ${employee.last_name}`}
          </h3>
          <div className="flex items-center gap-2">
            {!isNew && employee.status !== 'depart' && (
              <button 
                onClick={handleDelete}
                className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 text-xs font-bold rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Départ
              </button>
            )}
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 border border-red-100 rounded text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Prénom</label>
                <input 
                  type="text" 
                  value={employee.first_name || ''} 
                  onChange={e => handleChange('first_name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nom</label>
                <input 
                  type="text" 
                  value={employee.last_name || ''} 
                  onChange={e => handleChange('last_name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Site</label>
                <select
                  value={employee.site_id || ''}
                  onChange={e => handleChange('site_id', e.target.value)}
                  disabled={profile?.role === 'manager'}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white disabled:bg-slate-50"
                >
                  <option value="">Sélectionner un site</option>
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Poste</label>
                <input 
                  type="text" 
                  value={employee.poste || ''} 
                  onChange={e => handleChange('poste', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Statut</label>
                <select
                  value={employee.status || 'actif'}
                  onChange={e => handleChange('status', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="depart">Départ</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date d'entrée</label>
                  <input 
                    type="date" 
                    value={employee.date_entree || ''} 
                    onChange={e => handleChange('date_entree', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date de sortie</label>
                  <input 
                    type="date" 
                    value={employee.date_sortie || ''} 
                    onChange={e => handleChange('date_sortie', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email professionnel</label>
                <input 
                  type="email" 
                  value={employee.email || ''} 
                  onChange={e => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Téléphone</label>
                <input 
                  type="tel" 
                  value={employee.phone || ''} 
                  onChange={e => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
