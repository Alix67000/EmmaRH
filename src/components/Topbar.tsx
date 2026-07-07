import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Bell, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Notification } from '../types';
import { cn } from '../lib/utils';

export default function Topbar({ title }: { title: string }) {
  const { profile } = useAuth();
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.lu).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: Notification) => {
    setShowNotifs(false);
    if (!notif.lu) {
      await supabase.from('notifications').update({ lu: true }).eq('id', notif.id);
    }
    if (notif.lien) {
      navigate(notif.lien);
    }
  };

  const markAllAsRead = async () => {
    if (!profile) return;
    const unreadIds = notifications.filter(n => !n.lu).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ lu: true }).in('id', unreadIds);
  };

  return (
    <header className="h-16 flex-shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-20 relative">
      <div className="flex items-center gap-4">
        <h2 className="font-bold text-slate-700">{title}</h2>
        {profile?.role === 'admin' && (
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">
            MODE ADMINISTRATEUR
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-full relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-sm text-slate-700">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    Aucune notification.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map(notif => (
                      <div 
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={cn(
                          "p-3 cursor-pointer hover:bg-slate-50 transition-colors flex gap-3",
                          !notif.lu ? "bg-emerald-50/30" : ""
                        )}
                      >
                        <div className="mt-0.5">
                          {!notif.lu ? (
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={cn("text-xs", !notif.lu ? "font-bold text-slate-800" : "font-medium text-slate-600")}>
                            {notif.titre}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-1">
                            {new Date(notif.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex -space-x-2 mr-2">
          <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-200"></div>
          <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-300"></div>
          <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-400"></div>
        </div>
        
        <Link 
          to="/employees/new" 
          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouvel Employé
        </Link>
      </div>
    </header>
  );
}
