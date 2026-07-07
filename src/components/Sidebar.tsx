import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { LayoutDashboard, Users, FileText, CalendarOff, CalendarDays, Building, Map, Settings, LogOut, FileBadge } from 'lucide-react';

export default function Sidebar() {
  const { profile } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Collaborateurs', path: '/employees', icon: Users },
    { name: 'Absences', path: '/absences', icon: CalendarOff, badge: '3' },
    { name: 'Planning', path: '/planning', icon: CalendarDays },
    { name: 'Documents', path: '/documents', icon: FileText, badge: '1' },
    { name: 'Sites Emmaüs', path: '/sites', icon: Building },
    { name: 'Soldes & Congés', path: '/soldes', icon: FileBadge },
  ];

  const adminItems = [
    { name: 'Types de docs', path: '/settings/document-types', icon: Settings },
    { name: "Types d'absence", path: '/settings/absence-types', icon: Settings },
    { name: 'Rôles Utilisateurs', path: '/settings/users-roles', icon: Users },
  ];

  return (
    <aside className="w-56 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
      <div className="p-5 border-b border-slate-100">
        <h1 className="text-xl font-bold tracking-tight text-emerald-700">EmmaRH</h1>
        <p className="text-[10px] text-slate-400 font-medium uppercase mt-1 tracking-widest">
          Panel Administration
        </p>
      </div>
      
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md",
                isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-emerald-600" : "text-slate-400")} />
              {item.name}
              {item.badge && (
                <span className={cn("ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold", 
                  item.badge === '3' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {profile?.role === 'admin' && (
          <div className="pt-4 mt-4 border-t border-slate-100">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Configuration
            </p>
            {adminItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md",
                    isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-emerald-600" : "text-slate-400")} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs uppercase">
            {profile?.full_name?.substring(0, 2) || 'US'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold truncate">{profile?.full_name || 'Utilisateur'}</p>
            <p className="text-[10px] text-slate-500 uppercase">{profile?.role}</p>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 transition-colors" title="Déconnexion">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
