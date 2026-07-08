import React, { useState, useMemo } from 'react';
import { useEmployees } from '../hooks/useEmployees';
import { useAbsences } from '../hooks/useAbsences';
import { useAbsenceTypes } from '../hooks/useAbsenceTypes';
import { useAteliers } from '../hooks/useAteliers';
import { usePlanningAssignments } from '../hooks/usePlanningAssignments';
import { useJoursFeries } from '../hooks/useJoursFeries';
import { useAuth } from '../context/AuthContext';
import { useSites } from '../hooks/useSites';
import { ChevronLeft, ChevronRight, CalendarRange } from 'lucide-react';
import { cn } from '../lib/utils';
import { DayKey } from '../types';

const DAY_KEYS: DayKey[] = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const DAY_LABELS: Record<DayKey, string> = {
  lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi', jeudi: 'Jeudi', vendredi: 'Vendredi', samedi: 'Samedi', dimanche: 'Dimanche',
};

const ATELIER_PALETTE = [
  '#bbf7d0', '#fde68a', '#a5f3fc', '#fbcfe8', '#ddd6fe', '#fecaca', '#bae6fd', '#fed7aa',
];

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fmtShort(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

// Renvoie le lundi de la semaine contenant `date`
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = dimanche
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function PlanningSemaine() {
  const { profile } = useAuth();
  const { employees, loading: empLoading } = useEmployees();
  const { absences, loading: absLoading } = useAbsences();
  const { absenceTypes } = useAbsenceTypes();
  const { ateliers, loading: ateliersLoading } = useAteliers();
  const { sites } = useSites();
  const { joursFeries } = useJoursFeries();

  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOfWeek(new Date()));
  const [siteFilter, setSiteFilter] = useState<string>('tous');

  const weekDates = useMemo(() => {
    return DAY_KEYS.map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const startISO = toISODate(weekDates[0]);
  const endISO = toISODate(weekDates[weekDates.length - 1]);

  const { assignments, loading: assignLoading, upsertAssignment } = usePlanningAssignments(startISO, endISO);

  const visibleEmployees = useMemo(() => {
    return employees
      .filter((e) => e.status === 'actif')
      .filter((e) => {
        if (profile?.role === 'manager' && profile.site_id) return e.site_id === profile.site_id;
        if (siteFilter !== 'tous') return e.site_id === siteFilter;
        return true;
      });
  }, [employees, profile, siteFilter]);

  const atelierColor = useMemo(() => {
    const map: Record<string, string> = {};
    ateliers.forEach((a, i) => {
      map[a.id] = ATELIER_PALETTE[i % ATELIER_PALETTE.length];
    });
    return map;
  }, [ateliers]);

  const typeById = useMemo(() => {
    const map: Record<string, string> = {};
    absenceTypes.forEach((t) => (map[t.id] = t.name));
    return map;
  }, [absenceTypes]);

  const getAbsence = (employeeId: string, dateStr: string) => {
    return absences.find(
      (a) =>
        a.employee_id === employeeId &&
        a.statut === 'valide' &&
        a.date_debut &&
        a.date_fin &&
        a.date_debut <= dateStr &&
        a.date_fin >= dateStr
    );
  };

  const getAssignment = (employeeId: string, dateStr: string, periode: 'matin' | 'apres_midi') => {
    return assignments.find((a) => a.employee_id === employeeId && a.jour === dateStr && a.periode === periode);
  };

  const changeWeek = (delta: number) => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta * 7);
      return d;
    });
  };

  const goToday = () => setWeekStart(getMondayOfWeek(new Date()));

  const handleAtelierChange = async (
    employeeId: string,
    dateStr: string,
    periode: 'matin' | 'apres_midi',
    atelierId: string
  ) => {
    try {
      await upsertAssignment(employeeId, dateStr, periode, atelierId || null);
    } catch (err: any) {
      alert(`Erreur lors de la mise à jour : ${err.message || 'Erreur inconnue'}`);
    }
  };

  const loading = empLoading || absLoading || ateliersLoading || assignLoading;

  return (
    <div className="space-y-4">
      {/* Barre de contrôle */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarRange className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-800">
            Planning du {fmtShort(weekDates[0])} au {fmtShort(weekDates[weekDates.length - 1])}/{weekDates[weekDates.length - 1].getFullYear()}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {profile?.role === 'admin' && (
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="text-xs px-2 py-1.5 border border-slate-200 rounded-md bg-white outline-none focus:border-emerald-500"
            >
              <option value="tous">Toutes les entités</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          <button onClick={() => changeWeek(-1)} className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600" title="Semaine précédente">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={goToday} className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600">
            Cette semaine
          </button>
          <button onClick={() => changeWeek(1)} className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600" title="Semaine suivante">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grille du planning hebdomadaire */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-auto max-h-[70vh]">
          <table className="border-collapse text-[11px] w-full">
            <thead className="sticky top-0 z-20">
              <tr>
                <th rowSpan={2} className="sticky left-0 z-30 bg-slate-50 border-b border-r border-slate-200 px-3 py-2 text-left text-slate-500 font-bold uppercase min-w-[170px]">
                  Collaborateur
                </th>
                <th rowSpan={2} className="sticky left-[170px] z-30 bg-slate-50 border-b border-r border-slate-200 px-3 py-2 text-left text-slate-500 font-bold uppercase min-w-[130px]">
                  Poste
                </th>
                {weekDates.map((d, i) => (
                  <th key={i} colSpan={2} className="border-b border-l border-slate-200 bg-slate-100 text-center font-bold text-slate-600 py-1.5 min-w-[180px]">
                    {DAY_LABELS[DAY_KEYS[i]]} {fmtShort(d)}
                  </th>
                ))}
              </tr>
              <tr>
                {weekDates.map((_, i) => (
                  <React.Fragment key={i}>
                    <th className="border-b border-l border-slate-200 bg-slate-50 text-center font-medium text-slate-400 py-1 min-w-[90px]">Matin</th>
                    <th className="border-b border-slate-200 bg-slate-50 text-center font-medium text-slate-400 py-1 min-w-[90px]">Après-midi</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={2 + weekDates.length * 2} className="p-6 text-center text-slate-500">Chargement du planning...</td></tr>
              ) : visibleEmployees.length === 0 ? (
                <tr><td colSpan={2 + weekDates.length * 2} className="p-6 text-center text-slate-500">Aucun collaborateur actif trouvé.</td></tr>
              ) : (
                visibleEmployees.map((emp) => {
                  const schedule = emp.horaires_travail;
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 group">
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/70 border-r border-b border-slate-100 px-3 py-1.5 font-bold text-slate-700 truncate max-w-[170px]">
                        {emp.first_name} {emp.last_name.toUpperCase()}
                      </td>
                      <td className="sticky left-[170px] z-10 bg-white group-hover:bg-slate-50/70 border-r border-b border-slate-100 px-3 py-1.5 text-slate-500 truncate max-w-[130px]">
                        {emp.poste || '-'}
                      </td>
                      {weekDates.map((d, i) => {
                        const dateStr = toISODate(d);
                        const dayKey = DAY_KEYS[i];
                        const isFerie = joursFeries.has(dateStr);
                        const absence = getAbsence(emp.id, dateStr);
                        const dayScheduleActive = schedule ? schedule[dayKey]?.active : true;

                        let cellState: 'ferie' | 'absence' | 'repos' | 'travail' = 'travail';
                        let label = '';
                        if (isFerie) {
                          cellState = 'ferie';
                          label = 'Férié';
                        } else if (absence) {
                          cellState = 'absence';
                          label = typeById[absence.absence_type_id] || 'Absence';
                        } else if (!dayScheduleActive) {
                          cellState = 'repos';
                          label = 'Repos';
                        }

                        const renderCell = (periode: 'matin' | 'apres_midi') => {
                          if (cellState !== 'travail') {
                            return (
                              <td key={periode} className="border-b border-l border-slate-100 bg-slate-200 text-center text-slate-500 font-semibold h-10 px-1">
                                {label}
                              </td>
                            );
                          }
                          const assignment = getAssignment(emp.id, dateStr, periode);
                          const currentAtelierId = assignment ? assignment.atelier_id : emp.atelier_id;
                          const bg = currentAtelierId ? atelierColor[currentAtelierId] : '#f8fafc';
                          return (
                            <td key={periode} className="border-b border-l border-slate-100 p-0.5 h-10" style={{ backgroundColor: bg }}>
                              <select
                                value={currentAtelierId || ''}
                                onChange={(e) => handleAtelierChange(emp.id, dateStr, periode, e.target.value)}
                                className="w-full h-full bg-transparent text-[10px] font-semibold text-slate-700 outline-none cursor-pointer text-center"
                                style={{ backgroundColor: 'transparent' }}
                              >
                                <option value="">-</option>
                                {ateliers.map((a) => (
                                  <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                              </select>
                            </td>
                          );
                        };

                        return (
                          <React.Fragment key={i}>
                            {renderCell('matin')}
                            {renderCell('apres_midi')}
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Légende */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Légende</h3>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-4 h-4 rounded bg-slate-200 border border-slate-300 inline-block"></span>
            Férié / Absent / Repos
          </div>
          {ateliers.map((a) => (
            <div key={a.id} className="flex items-center gap-2 text-xs text-slate-600">
              <span className="w-4 h-4 rounded inline-block border border-black/10" style={{ backgroundColor: atelierColor[a.id] }}></span>
              {a.name}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-3">
          Les cases sont pré-remplies automatiquement avec l'atelier renseigné dans la fiche du collaborateur.
          Cliquez sur une case (Matin ou Après-midi) pour changer l'atelier de cette demi-journée uniquement.
          Les jours fériés, absences validées et jours non travaillés sont grisés automatiquement et non modifiables.
        </p>
      </div>
    </div>
  );
}
