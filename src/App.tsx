/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function App() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900">
      <aside className="w-56 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-5 border-b border-slate-100">
          <h1 className="text-xl font-bold tracking-tight text-emerald-700">EmmaRH</h1>
          <p className="text-[10px] text-slate-400 font-medium uppercase mt-1 tracking-widest">
            Panel Administration
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md bg-emerald-50 text-emerald-700"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Dashboard
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Collaborateurs
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Absences <span className="ml-auto text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">3</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Documents <span className="ml-auto text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">1</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Sites Emmaüs
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Soldes & Congés
          </a>
          <div className="pt-4 mt-4 border-t border-slate-100">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Configuration
            </p>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Types de docs
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Types d'absence
            </a>
          </div>
        </nav>
        <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">Admin Principal</p>
              <p className="text-[10px] text-slate-500">Rôle: Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-16 flex-shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-slate-700">Vue d'ensemble : Tous les sites</h2>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">
              MODE ADMINISTRATEUR
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-200"></div>
              <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-300"></div>
              <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-400"></div>
            </div>
            <button className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded shadow-sm">
              Nouvel Employé
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                Collaborateurs
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black">42</span>
                <span className="text-[10px] text-emerald-600 font-bold">+2 ce mois</span>
              </div>
            </div>
            <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                Absences en cours
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-amber-600">5</span>
                <span className="text-[10px] text-slate-400 font-bold">8.5 jours total</span>
              </div>
            </div>
            <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                Docs à renouveler
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-red-600">3</span>
                <span className="text-[10px] text-red-500 font-bold">Action requise</span>
              </div>
            </div>
            <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                Sites actifs
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black">3</span>
                <span className="text-[10px] text-slate-400 font-bold">Grand Est</span>
              </div>
            </div>
          </div>

          <div className="flex gap-6 min-h-[480px]">
            <div className="flex-[2] bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-700">Employés récents</h3>
                <button className="text-[10px] font-bold text-emerald-600 hover:underline">
                  Voir tout
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-400 font-bold uppercase">
                    <tr className="h-8 px-4">
                      <th className="pl-4 font-bold">Collaborateur</th>
                      <th className="font-bold">Site</th>
                      <th className="font-bold">Poste</th>
                      <th className="font-bold">Statut</th>
                      <th className="pr-4 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="h-11 hover:bg-slate-50">
                      <td className="pl-4 font-bold">Jean Dupont</td>
                      <td>Strasbourg</td>
                      <td>Encadrant</td>
                      <td>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-100">
                          ACTIF
                        </span>
                      </td>
                      <td className="pr-4">
                        <button className="text-slate-400">Modifier</button>
                      </td>
                    </tr>
                    <tr className="h-11 hover:bg-slate-50">
                      <td className="pl-4 font-bold">Marie Curie</td>
                      <td>Mulhouse</td>
                      <td>Logistique</td>
                      <td>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-100">
                          ACTIF
                        </span>
                      </td>
                      <td className="pr-4">
                        <button className="text-slate-400">Modifier</button>
                      </td>
                    </tr>
                    <tr className="h-11 hover:bg-slate-50">
                      <td className="pl-4 font-bold">Luc Martin</td>
                      <td>Colmar</td>
                      <td>Chauffeur</td>
                      <td>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-100">
                          ACTIF
                        </span>
                      </td>
                      <td className="pr-4">
                        <button className="text-slate-400">Modifier</button>
                      </td>
                    </tr>
                    <tr className="h-11 hover:bg-slate-50">
                      <td className="pl-4 font-bold">Sophie Germain</td>
                      <td>Strasbourg</td>
                      <td>Comptable</td>
                      <td>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold border border-slate-200">
                          INACTIF
                        </span>
                      </td>
                      <td className="pr-4">
                        <button className="text-slate-400">Modifier</button>
                      </td>
                    </tr>
                    <tr className="h-11 hover:bg-slate-50">
                      <td className="pl-4 font-bold">Albert Camus</td>
                      <td>Mulhouse</td>
                      <td>Vendeur</td>
                      <td>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-100">
                          ACTIF
                        </span>
                      </td>
                      <td className="pr-4">
                        <button className="text-slate-400">Modifier</button>
                      </td>
                    </tr>
                    <tr className="h-11 hover:bg-slate-50">
                      <td className="pl-4 font-bold">Simone Veil</td>
                      <td>Colmar</td>
                      <td>Encadrant</td>
                      <td>
                        <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold border border-red-100">
                          DEPART
                        </span>
                      </td>
                      <td className="pr-4">
                        <button className="text-slate-400">Modifier</button>
                      </td>
                    </tr>
                    <tr className="h-11 hover:bg-slate-50">
                      <td className="pl-4 font-bold">Louis Pasteur</td>
                      <td>Strasbourg</td>
                      <td>Vendeur</td>
                      <td>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-100">
                          ACTIF
                        </span>
                      </td>
                      <td className="pr-4">
                        <button className="text-slate-400">Modifier</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex-1 space-y-4 flex flex-col">
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col flex-1 min-h-0">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/30">
                  <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Absences à valider
                  </h3>
                </div>
                <div className="p-4 space-y-3 overflow-y-auto">
                  <div className="p-2 rounded-md bg-slate-50 border border-slate-100 flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-slate-200 flex-shrink-0 flex items-center justify-center font-bold text-xs">
                      LM
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold">Luc Martin</p>
                      <p className="text-[10px] text-slate-500">Congés payés • 2 jours</p>
                    </div>
                    <button className="px-2 py-1 bg-white border border-slate-200 rounded shadow-xs text-[10px] font-bold">
                      Gérer
                    </button>
                  </div>
                  <div className="p-2 rounded-md bg-slate-50 border border-slate-100 flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-slate-200 flex-shrink-0 flex items-center justify-center font-bold text-xs">
                      MC
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold">Marie Curie</p>
                      <p className="text-[10px] text-slate-500">Rdv Médical • 0.5 jour</p>
                    </div>
                    <button className="px-2 py-1 bg-white border border-slate-200 rounded shadow-xs text-[10px] font-bold">
                      Gérer
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col flex-1 min-h-0">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-red-50/30">
                  <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    Docs Critiques
                  </h3>
                </div>
                <div className="p-4 space-y-3 overflow-y-auto">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <div className="flex-1">
                      <p className="text-xs font-bold">CNI - Jean Dupont</p>
                      <p className="text-[10px] text-red-500">Expiré le 12/05/2023</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <div className="flex-1">
                      <p className="text-xs font-bold">Permis - Luc Martin</p>
                      <p className="text-[10px] text-amber-600">Expire dans 14 jours</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                    <div className="flex-1">
                      <p className="text-xs font-bold">Attestation - Sophie G.</p>
                      <p className="text-[10px] text-slate-500">Renouvellement en cours</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
