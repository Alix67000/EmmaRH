import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@emmarh.fr');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      // Create admin user
      const { error: signUpError } = await supabase.auth.signUp({
        email: 'admin@emmarh.fr',
        password: 'admin123',
        options: {
          data: {
            full_name: 'Admin Principal',
            role: 'admin'
          }
        }
      });
      if (signUpError) throw signUpError;
      
      alert('Compte de test créé avec succès ! Vous pouvez maintenant vous connecter.');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 text-center bg-emerald-700 text-white">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
             <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">EmmaRH</h1>
          <p className="text-emerald-100 text-sm mt-1">Plateforme de Gestion RH</p>
        </div>
        
        <div className="p-8">
          <h2 className="text-lg font-bold text-slate-800 mb-6 text-center">Connexion à votre espace</h2>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 border border-red-100 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Adresse email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm"
                placeholder="votre.email@emmaus.org"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center text-sm disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
             <div className="text-[10px] text-slate-400 font-medium mb-3">
                Comptes de test (mot de passe: <strong>admin123</strong> ou <strong>manager123</strong>):<br/>
                admin@emmarh.fr | manager1@emmarh.fr
             </div>
             
             <button
              onClick={handleSetup}
              disabled={loading}
              className="text-xs text-emerald-600 font-bold hover:underline"
             >
               Créer le compte admin@emmarh.fr (si inexistant)
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
