import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Document, DocumentType, Employee } from '../types';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, Save, ExternalLink } from 'lucide-react';

export default function EmployeeDocuments() {
  const { id } = useParams<{ id: string }>();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [newDoc, setNewDoc] = useState<Partial<Document>>({ employee_id: id });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docsRes, typesRes, empRes] = await Promise.all([
          supabase.from('documents').select('*').eq('employee_id', id).order('date_expiration', { ascending: true, nullsFirst: false }),
          supabase.from('document_types').select('*').order('name', { ascending: true }),
          supabase.from('employees').select('*').eq('id', id).single()
        ]);
        
        if (docsRes.error) throw docsRes.error;
        if (typesRes.error) throw typesRes.error;
        if (empRes.error) throw empRes.error;

        setDocuments(docsRes.data || []);
        setDocTypes(typesRes.data || []);
        setEmployee(empRes.data);
      } catch (err) {
        console.error('Error fetching documents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSaveDoc = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.from('documents').insert([newDoc]).select();
      if (error) throw error;
      if (data) {
        setDocuments(prev => [...prev, data[0]].sort((a, b) => {
          if (!a.date_expiration) return 1;
          if (!b.date_expiration) return -1;
          return new Date(a.date_expiration).getTime() - new Date(b.date_expiration).getTime();
        }));
      }
      setShowForm(false);
      setNewDoc({ employee_id: id });
    } catch (err) {
      console.error('Error saving document:', err);
      alert("Erreur lors de l'enregistrement du document");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'valide':
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-100 uppercase">Valide</span>;
      case 'expirant_bientot':
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[10px] font-bold border border-amber-100 uppercase">Expirant bientôt</span>;
      case 'expire':
        return <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold border border-red-100 uppercase">Expiré</span>;
      default:
        return <span>{status}</span>;
    }
  };

  if (loading) return <div className="p-4 text-sm text-slate-500">Chargement...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to={`/employees/${id}`} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" />
          Retour à la fiche
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col min-h-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-700">Documents de {employee?.first_name} {employee?.last_name}</h3>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nouveau document
          </button>
        </div>

        {showForm && (
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Type de document</label>
                <select 
                  value={newDoc.type || ''}
                  onChange={e => setNewDoc({...newDoc, type: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="">Sélectionner un type</option>
                  {docTypes.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lien OneDrive</label>
                <input 
                  type="url" 
                  value={newDoc.onedrive_link || ''}
                  onChange={e => setNewDoc({...newDoc, onedrive_link: e.target.value})}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date d'émission</label>
                <input 
                  type="date" 
                  value={newDoc.date_emission || ''}
                  onChange={e => setNewDoc({...newDoc, date_emission: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date d'expiration</label>
                <input 
                  type="date" 
                  value={newDoc.date_expiration || ''}
                  onChange={e => setNewDoc({...newDoc, date_expiration: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 bg-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800">Annuler</button>
              <button 
                onClick={handleSaveDoc} 
                disabled={saving || !newDoc.type}
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
                <th className="pl-4 font-bold">Type</th>
                <th className="font-bold">Date Émission</th>
                <th className="font-bold">Date Expiration</th>
                <th className="font-bold">Statut</th>
                <th className="pr-4 font-bold">Lien</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-slate-500">Aucun document.</td></tr>
              ) : (
                documents.map(doc => (
                  <tr key={doc.id} className="h-11 hover:bg-slate-50 transition-colors">
                    <td className="pl-4 font-bold text-slate-700">{doc.type}</td>
                    <td className="text-slate-600">{doc.date_emission ? new Date(doc.date_emission).toLocaleDateString('fr-FR') : '-'}</td>
                    <td className="text-slate-600">{doc.date_expiration ? new Date(doc.date_expiration).toLocaleDateString('fr-FR') : '-'}</td>
                    <td>{getStatusBadge(doc.status)}</td>
                    <td className="pr-4">
                      {doc.onedrive_link ? (
                        <a href={doc.onedrive_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold">
                          <ExternalLink className="w-3.5 h-3.5" /> Ouvrir
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
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
