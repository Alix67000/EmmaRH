import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDocuments } from '../hooks/useDocuments';
import { useEmployees } from '../hooks/useEmployees';
import { useSites } from '../hooks/useSites';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, ExternalLink, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

export default function DocumentsGlobal() {
  const { documents, loading: loadingDocs } = useDocuments();
  const { employees, loading: loadingEmp } = useEmployees();
  const { sites, loading: loadingSites } = useSites();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const [siteFilter, setSiteFilter] = useState('tous');

  const loading = loadingDocs || loadingEmp || loadingSites;

  const getEmployee = (id: string) => employees.find(e => e.id === id);
  const getSiteName = (id: string | null) => sites.find(s => s.id === id)?.name || '-';

  const filteredDocuments = documents.filter(doc => {
    const emp = getEmployee(doc.employee_id);
    if (!emp) return false;

    // Role filtering
    if (profile?.role === 'manager' && profile.site_id && emp.site_id !== profile.site_id) {
      return false;
    }

    // Site filtering (Admin)
    if (siteFilter !== 'tous' && emp.site_id !== siteFilter) {
      return false;
    }

    // Status filtering
    if (statusFilter !== 'tous' && doc.status !== statusFilter) {
      return false;
    }

    // Search filtering
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const empName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
      const docType = (doc.type || '').toLowerCase();
      if (!empName.includes(search) && !docType.includes(search)) {
        return false;
      }
    }

    return true;
  });

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

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            Tous les documents ({filteredDocuments.length})
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher (nom, prénom, type de document)..."
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
              <option value="valide">Valide</option>
              <option value="expirant_bientot">Expirant bientôt</option>
              <option value="expire">Expiré</option>
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
              <th className="pl-4 font-bold">Employé</th>
              <th className="font-bold">Entité</th>
              <th className="font-bold">Type</th>
              <th className="font-bold">Date Émission</th>
              <th className="font-bold">Date Expiration</th>
              <th className="font-bold">Statut</th>
              <th className="pr-4 font-bold text-right">Lien</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="p-4 text-center text-slate-500">Chargement...</td></tr>
            ) : filteredDocuments.length === 0 ? (
              <tr><td colSpan={7} className="p-4 text-center text-slate-500">Aucun document trouvé.</td></tr>
            ) : (
              filteredDocuments.map(doc => {
                const emp = getEmployee(doc.employee_id);
                return (
                  <tr 
                    key={doc.id} 
                    className="h-11 hover:bg-slate-50 transition-colors"
                  >
                    <td className="pl-4 font-bold text-slate-700">
                      <Link to={`/employees/${doc.employee_id}/documents`} className="hover:text-emerald-600 hover:underline">
                        {emp?.first_name} {emp?.last_name?.toUpperCase()}
                      </Link>
                    </td>
                    <td className="text-slate-600">{getSiteName(emp?.site_id || null)}</td>
                    <td className="text-slate-600 font-medium">{doc.type}</td>
                    <td className="text-slate-500">{doc.date_emission ? new Date(doc.date_emission).toLocaleDateString('fr-FR') : '-'}</td>
                    <td className="text-slate-500">{doc.date_expiration ? new Date(doc.date_expiration).toLocaleDateString('fr-FR') : '-'}</td>
                    <td>{getStatusBadge(doc.status)}</td>
                    <td className="pr-4 text-right">
                      {doc.onedrive_link ? (
                        <a href={doc.onedrive_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
