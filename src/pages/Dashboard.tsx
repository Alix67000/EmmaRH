import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEmployees } from '../hooks/useEmployees';
import { useDocuments } from '../hooks/useDocuments';
import { useAbsences } from '../hooks/useAbsences';
import { useSites } from '../hooks/useSites';
import { FileText, Users, CalendarOff, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { profile } = useAuth();
  const { employees, loading: empLoading } = useEmployees();
  const { documents, loading: docLoading } = useDocuments();
  const { absences, loading: absLoading } = useAbsences();
  const { sites, loading: sitesLoading } = useSites();

  const loading = empLoading || docLoading || absLoading || sitesLoading;

  // Filtre en fonction du rôle
  const filteredEmployees = employees.filter(e => 
    profile?.role === 'admin' ? true : e.site_id === profile?.site_id
  );
  
  const empIds = filteredEmployees.map(e => e.id);
  const filteredAbsences = absences.filter(a => empIds.includes(a.employee_id));
  const filteredDocuments = documents.filter(d => empIds.includes(d.employee_id));

  // Dates
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  // Indicators
  const pendingAbsences = filteredAbsences.filter(a => a.statut === 'en_attente');
  
  const absencesToday = filteredAbsences.filter(a => {
    if (!a.date_debut || !a.date_fin) return false;
    const d1 = new Date(a.date_debut);
    const d2 = new Date(a.date_fin);
    d1.setHours(0,0,0,0);
    d2.setHours(23,59,59,999);
    return today >= d1 && today <= d2 && a.statut === 'valide';
  });

  const expiringDocs = filteredDocuments.filter(d => {
    if (!d.date_expiration) return false;
    const exp = new Date(d.date_expiration);
    return exp >= today && exp <= thirtyDaysFromNow;
  });

  const expiredDocs = filteredDocuments.filter(d => {
    if (!d.date_expiration) return false;
    const exp = new Date(d.date_expiration);
    return exp < today;
  });

  const newArrivals = filteredEmployees.filter(e => {
    if (!e.date_entree) return false;
    const d = new Date(e.date_entree);
    return d >= thirtyDaysAgo && d <= today;
  });

  const upcomingDepartures = filteredEmployees.filter(e => {
    if (!e.date_sortie) return false;
    const d = new Date(e.date_sortie);
    return d >= today && d <= thirtyDaysFromNow && e.status !== 'depart';
  });

  // Repartition
  const siteCounts: Record<string, number> = {};
  filteredEmployees.forEach(e => {
    const siteName = sites.find(s => s.id === e.site_id)?.name || 'Inconnu';
    siteCounts[siteName] = (siteCounts[siteName] || 0) + 1;
  });
  
  const maxCount = Math.max(...Object.values(siteCounts), 1);

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.first_name} ${emp.last_name.toUpperCase()}` : 'Inconnu';
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Chargement du tableau de bord...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
              Collaborateurs
            </p>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black">{filteredEmployees.length}</span>
            <span className="text-[10px] text-emerald-600 font-bold">+{newArrivals.length} récent(s)</span>
          </div>
        </div>
        
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
              Absences (Jour)
            </p>
            <CalendarOff className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-amber-600">{absencesToday.length}</span>
            <span className="text-[10px] text-slate-400 font-bold">Aujourd'hui</span>
          </div>
        </div>

        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
              Docs Expirés
            </p>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-red-600">{expiredDocs.length}</span>
            <span className="text-[10px] text-red-500 font-bold">Action requise</span>
          </div>
        </div>

        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
              Demandes Attente
            </p>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-blue-600">{pendingAbsences.length}</span>
            <span className="text-[10px] text-blue-500 font-bold hover:underline cursor-pointer">
              <Link to="/absences/validate">À valider</Link>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Documents à renouveler */}
        <div className="col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-80">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Documents à renouveler (<span className="text-amber-600">{expiringDocs.length}</span>)
            </h3>
            <Link to="/documents" className="text-[10px] font-bold text-emerald-600 hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {expiringDocs.length === 0 && expiredDocs.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-4">Aucun document à renouveler.</div>
            ) : (
              [...expiredDocs, ...expiringDocs].map(doc => (
                <div key={doc.id} className="flex items-center gap-3 p-2 rounded-md bg-slate-50 border border-slate-100">
                  <div className={cn("w-2 h-2 rounded-full", doc.status === 'expire' ? "bg-red-500" : "bg-amber-500")}></div>
                  <div className="flex-1">
                    <p className="text-xs font-bold">{doc.type} - {getEmployeeName(doc.employee_id)}</p>
                    <p className={cn("text-[10px] font-medium", doc.status === 'expire' ? "text-red-500" : "text-amber-600")}>
                      {doc.status === 'expire' ? 'Expiré le' : 'Expire le'} {doc.date_expiration ? new Date(doc.date_expiration).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <Link 
                    to={`/employees/${doc.employee_id}/documents`}
                    className="px-2 py-1 bg-white border border-slate-200 rounded shadow-xs text-[10px] font-bold hover:bg-slate-50 text-slate-600"
                  >
                    Gérer
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Répartition par Site */}
        <div className="col-span-1 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-80">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-700">Effectifs par site</h3>
          </div>
          <div className="flex-1 p-4 overflow-auto space-y-4">
            {Object.entries(siteCounts).map(([site, count]) => {
              const percentage = Math.round((count / maxCount) * 100);
              return (
                <div key={site} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>{site}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mouvements */}
        <div className="col-span-3 grid grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col min-h-[250px]">
             <div className="p-4 border-b border-slate-100 bg-emerald-50/30">
               <h3 className="font-bold text-sm text-slate-700 text-emerald-800">Nouveaux arrivants (30 jours)</h3>
             </div>
             <div className="p-4 space-y-3">
                {newArrivals.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-2">Aucune nouvelle entrée.</div>
                ) : (
                  newArrivals.map(e => (
                    <div key={e.id} className="flex items-center gap-3">
                       <ArrowRight className="w-4 h-4 text-emerald-500" />
                       <div className="flex-1">
                         <p className="text-xs font-bold">{e.first_name} {e.last_name}</p>
                         <p className="text-[10px] text-slate-500">{e.poste} • Entré le {e.date_entree ? new Date(e.date_entree).toLocaleDateString() : ''}</p>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col min-h-[250px]">
             <div className="p-4 border-b border-slate-100 bg-amber-50/30">
               <h3 className="font-bold text-sm text-slate-700 text-amber-800">Départs à venir (30 jours)</h3>
             </div>
             <div className="p-4 space-y-3">
                {upcomingDepartures.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-2">Aucun départ prévu.</div>
                ) : (
                  upcomingDepartures.map(e => (
                    <div key={e.id} className="flex items-center gap-3">
                       <ArrowRight className="w-4 h-4 text-amber-500" />
                       <div className="flex-1">
                         <p className="text-xs font-bold">{e.first_name} {e.last_name}</p>
                         <p className="text-[10px] text-slate-500">{e.poste} • Départ le {e.date_sortie ? new Date(e.date_sortie).toLocaleDateString() : ''}</p>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
