import { useState, useMemo } from 'react';
import { useEmployees } from '../hooks/useEmployees';
import { useAbsences } from '../hooks/useAbsences';
import { useAbsenceTypes } from '../hooks/useAbsenceTypes';
import { useSites } from '../hooks/useSites';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, CalendarDays, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { printElementAsA4 } from '../lib/printPlanning';

// D = Dimanche, L = Lundi ... (index = Date.getDay())
const DAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

// Palette calquée sur les types d'absences EmmaRH (proche de la légende Emmaüs)
const ABSENCE_STYLES: Record<string, { bg: string; label: string }> = {
  'Congés payés': { bg: '#94a3b8', label: 'Congés' },
  'Arrêts de travail': { bg: '#22c55e', label: 'Arrêts de travail' },
  'Formations': { bg: '#f97316', label: 'Formations' },
  'Stages': { bg: '#f9a8d4', label: 'Stages' },
  'Absence injustifiée': { bg: '#ef4444', label: 'Abs. injustifiée' },
  'Enfant malade': { bg: '#facc15', label: 'Enfant malade' },
  'Journée solidarité': { bg: '#166534', label: 'Journée solidarité' },
  'Décès proche': { bg: '#1e3a8a', label: 'Décès proche' },
  'Congé sans solde': { bg: '#3b82f6', label: 'Congé sans solde' },
  'Retards': { bg: '#fbcfe8', label: 'Retards' },
  "Garde d'enfants covid": { bg: '#78350f', label: "Garde d'enfants" },
  'Arrêt suite AT': { bg: '#57534e', label: 'Arrêt suite AT' },
  'Chômage technique': { bg: '#eab308', label: 'Chômage technique' },
  'RDV AST': { bg: '#0d9488', label: 'RDV AST' },
  'Début contrat': { bg: '#a78bfa', label: 'Début contrat' },
};
const DEFAULT_STYLE = { bg: '#cbd5e1', label: 'Absence' };

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export default function PlanningCalendar() {
  const { profile } = useAuth();
  const { employees, loading: empLoading } = useEmployees();
  const { absences, loading: absLoading } = useAbsences();
  const { absenceTypes, loading: typesLoading } = useAbsenceTypes();
  const { sites, loading: sitesLoading } = useSites();

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [siteFilter, setSiteFilter] = useState<string>('tous');

  const loading = empLoading || absLoading || typesLoading || sitesLoading;

  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const typeById = useMemo(() => {
    const map: Record<string, string> = {};
    absenceTypes.forEach((t) => {
      map[t.id] = t.name;
    });
    return map;
  }, [absenceTypes]);

  const visibleEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (profile?.role === 'manager' && profile.site_id) {
        return e.site_id === profile.site_id;
      }
      if (siteFilter !== 'tous') {
        return e.site_id === siteFilter;
      }
      return true;
    });
  }, [employees, profile, siteFilter]);

  const getAbsenceForDay = (empId: string, dateStr: string) => {
    return absences.find(
      (a) =>
        a.employee_id === empId &&
        a.statut !== 'refuse' &&
        a.date_debut &&
        a.date_fin &&
        a.date_debut <= dateStr &&
        a.date_fin >= dateStr
    );
  };

  const changeMonth = (delta: number) => {
    setCursor((prev) => {
      let month = prev.month + delta;
      let year = prev.year;
      if (month < 0) {
        month = 11;
        year -= 1;
      }
      if (month > 11) {
        month = 0;
        year += 1;
      }
      return { year, month };
    });
  };

  const goToday = () => {
    const d = new Date();
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  const usedTypeNames = useMemo(() => {
    const names = new Set<string>();
    absences.forEach((a) => {
      const name = typeById[a.absence_type_id];
      if (name) names.add(name);
    });
    return names;
  }, [absences, typeById]);

  const legendEntries = useMemo(() => {
    const entries = Object.entries(ABSENCE_STYLES).filter(([name]) => usedTypeNames.has(name));
    return entries.length > 0 ? entries : Object.entries(ABSENCE_STYLES);
  }, [usedTypeNames]);

  return (
    <div className="space-y-4">
      {/* Barre de contrôle */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-800 capitalize">
            {MONTH_NAMES[cursor.month]} {cursor.year}
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
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => changeMonth(-1)}
            className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600"
            title="Mois précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600"
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => changeMonth(1)}
            className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600"
            title="Mois suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => printElementAsA4('planning-presence-export', `Planning présence - ${MONTH_NAMES[cursor.month]} ${cursor.year}`)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-md shadow-sm transition-colors"
            title="Télécharger le planning en PDF (format A4)"
          >
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Grille du planning */}
      <div id="planning-presence-export" className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-auto max-h-[65vh]">
          <table className="border-collapse text-[11px] w-full">
            <thead className="sticky top-0 z-20">
              <tr>
                <th className="sticky left-0 z-30 bg-slate-50 border-b border-r border-slate-200 px-3 py-2 text-left text-slate-500 font-bold uppercase min-w-[190px]">
                  Collaborateur
                </th>
                {days.map((day) => {
                  const dateObj = new Date(cursor.year, cursor.month, day);
                  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                  const isToday =
                    new Date().toDateString() === dateObj.toDateString();
                  return (
                    <th
                      key={day}
                      className={cn(
                        'border-b border-slate-200 text-center font-bold w-7 min-w-[28px]',
                        isWeekend ? 'bg-slate-200 text-slate-500' : 'bg-slate-50 text-slate-500',
                        isToday && 'ring-2 ring-inset ring-emerald-400'
                      )}
                    >
                      {day}
                    </th>
                  );
                })}
              </tr>
              <tr>
                <th className="sticky left-0 z-30 bg-slate-50 border-b border-r border-slate-200"></th>
                {days.map((day) => {
                  const dateObj = new Date(cursor.year, cursor.month, day);
                  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                  return (
                    <th
                      key={day}
                      className={cn(
                        'border-b border-slate-200 text-center font-medium w-7 min-w-[28px] pb-1',
                        isWeekend ? 'bg-slate-200 text-slate-500' : 'bg-slate-50 text-slate-400'
                      )}
                    >
                      {DAY_LETTERS[dateObj.getDay()]}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={days.length + 1} className="p-6 text-center text-slate-500">
                    Chargement du planning...
                  </td>
                </tr>
              ) : visibleEmployees.length === 0 ? (
                <tr>
                  <td colSpan={days.length + 1} className="p-6 text-center text-slate-500">
                    Aucun collaborateur trouvé.
                  </td>
                </tr>
              ) : (
                visibleEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 group">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/70 border-r border-b border-slate-100 px-3 py-1.5 font-bold text-slate-700 truncate max-w-[190px]">
                      {emp.first_name} {emp.last_name.toUpperCase()}
                    </td>
                    {days.map((day) => {
                      const dateStr = `${cursor.year}-${pad(cursor.month + 1)}-${pad(day)}`;
                      const dateObj = new Date(cursor.year, cursor.month, day);
                      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                      const absence = getAbsenceForDay(emp.id, dateStr);
                      const typeName = absence ? typeById[absence.absence_type_id] : null;
                      const style = typeName ? ABSENCE_STYLES[typeName] || DEFAULT_STYLE : null;
                      const isPending = absence?.statut === 'en_attente';

                      return (
                        <td
                          key={day}
                          title={
                            absence
                              ? `${typeName || 'Absence'}${isPending ? ' (en attente)' : ''}`
                              : isWeekend
                              ? 'Week-end'
                              : 'Présent'
                          }
                          className={cn(
                            'border-b border-slate-100 h-8 w-7 min-w-[28px] text-center',
                            !absence && isWeekend && 'bg-slate-100',
                            !absence && !isWeekend && 'bg-emerald-50/40'
                          )}
                          style={
                            absence
                              ? {
                                  backgroundColor: style!.bg,
                                  opacity: isPending ? 0.55 : 1,
                                  backgroundImage: isPending
                                    ? 'repeating-linear-gradient(45deg, rgba(255,255,255,0.5) 0, rgba(255,255,255,0.5) 2px, transparent 2px, transparent 6px)'
                                    : undefined,
                                }
                              : undefined
                          }
                        />
                      );
                    })}
                  </tr>
                ))
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
            <span className="w-4 h-4 rounded bg-emerald-50/70 border border-slate-200 inline-block"></span>
            Présent
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-4 h-4 rounded bg-slate-100 border border-slate-200 inline-block"></span>
            Week-end
          </div>
          {legendEntries.map(([name, style]) => (
            <div key={name} className="flex items-center gap-2 text-xs text-slate-600">
              <span
                className="w-4 h-4 rounded inline-block border border-black/10"
                style={{ backgroundColor: style.bg }}
              ></span>
              {style.label}
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span
              className="w-4 h-4 rounded inline-block border border-slate-300"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, #cbd5e1 0, #cbd5e1 2px, white 2px, white 6px)',
              }}
            ></span>
            En attente de validation
          </div>
        </div>
      </div>
    </div>
  );
}
