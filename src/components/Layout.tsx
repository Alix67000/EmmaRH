import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const location = useLocation();
  
  // Mapping paths to titles
  let title = "Vue d'ensemble : Toutes les entités";
  if (location.pathname.includes('/employees')) title = "Collaborateurs";
  if (location.pathname.includes('/absences')) title = "Gestion des Absences";
  if (location.pathname.includes('/planning')) title = "Planning des présences / absences";
  if (location.pathname.includes('/documents')) title = "Documents RH";
  if (location.pathname.includes('/sites')) title = "Entités";
  if (location.pathname.includes('/soldes')) title = "Soldes & Congés";
  if (location.pathname.includes('/settings')) title = "Configuration";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} />
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
