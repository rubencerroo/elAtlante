import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, getStaffRole, getSession, signOut, isTabletAuthorized, setActiveStaffId } from '../services/authStore';
import PinLoginView from '../components/admin/PinLoginView';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [usePinLogin, setUsePinLogin] = useState(isTabletAuthorized());
  const [isAuthorized] = useState(isTabletAuthorized());

  // Check if already logged in
  useEffect(() => {
    try {
      const session = getSession();
      if (session) {
        const role = getStaffRole();
        if (role === 'owner') {
          setShowRoleSelector(true);
        } else if (role === 'waiter') {
          navigate('/admin/waiter', { replace: true });
        }
      } else {
          // No session - if device is authorized, we'll suggest PIN login
          // but PinLoginView itself will handle the case where it needs to fetch staff
          if (isAuthorized) {
            setUsePinLogin(true);
          }
        }
      } finally {
        setCheckingSession(false);
      }
  }, [navigate, isAuthorized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      const role = await getStaffRole();

      if (!role) {
        setError('No tienes permisos para acceder al panel.');
        setLoading(false);
        return;
      }

      if (role === 'owner') {
        setShowRoleSelector(true);
        setLoading(false);
      } else {
        navigate('/admin/waiter');
      }
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('Email o contraseña incorrectos');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Email no confirmado. Revisa tu bandeja de entrada.');
      } else {
        setError(err.message || 'Error al iniciar sesión');
      }
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setActiveStaffId(null);
      setShowRoleSelector(false);
      setEmail('');
      setPassword('');
      setError('');
    } catch (err: any) {
      setError('Error al cerrar sesión');
    }
  };



  const handlePinLoginSuccess = (role: string) => {
    if (role === 'owner') {
      setShowRoleSelector(true);
      setUsePinLogin(false);
    } else {
      navigate('/admin/waiter');
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showRoleSelector) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* BG glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[150px]" />
        
        <div className="relative z-10 w-full max-w-md space-y-8 text-center">
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-white text-3xl font-bold tracking-tight mb-2">Bienvenido</h1>
            <p className="text-slate-400">¿A qué panel deseas acceder?</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 mt-8">
            <button
              onClick={() => navigate('/admin/owner')}
              className="group relative bg-white/5 border border-white/10 hover:border-primary/50 focus:border-primary/50 hover:bg-white/10 text-white font-bold text-lg py-6 rounded-2xl transition-all duration-300 shadow-lg overflow-hidden flex flex-col items-center gap-3"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <svg className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Panel Administrador</span>
            </button>

            <button
              onClick={() => navigate('/admin/waiter')}
              className="group relative bg-white/5 border border-white/10 hover:border-[#10b981]/50 focus:border-[#10b981]/50 hover:bg-white/10 text-white font-bold text-lg py-6 rounded-2xl transition-all duration-300 shadow-lg overflow-hidden flex flex-col items-center gap-3"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#10b981]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <svg className="w-8 h-8 text-[#10b981] group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Panel Camarero</span>
            </button>
          </div>
          
          <div className="pt-8 border-t border-white/10 space-y-4">


            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-white underline text-sm transition-colors w-full"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (usePinLogin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[150px]" />
        
        <div className="relative z-10 w-full max-w-md space-y-8">
          <div className="text-center space-y-3">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-2">
              <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 -960 960 960"><path d="M480-440q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0-80q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm0 440q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Zm0-400Z"/></svg>
            </div>
            <h1 className="text-white text-2xl font-bold tracking-tight">Acceso Rápido</h1>
            <p className="text-slate-400 text-sm">Dispositivo Autorizado · El Atlante</p>
          </div>

          <PinLoginView 
            onSuccess={handlePinLoginSuccess} 
            onCancel={() => setUsePinLogin(false)} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* BG glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/8 blur-[150px]" />

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-2">
            <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 -960 960 960"><path d="M480-440q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0-80q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm0 440q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Zm0-400Z"/></svg>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Panel de Administración</h1>
          <p className="text-slate-400 text-sm">El Atlante · Acceso restringido</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="tu@email.com"
              autoFocus
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold uppercase tracking-[0.2em] text-sm py-4 rounded-xl transition-all duration-300 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Iniciando sesión...
              </>
            ) : (
              'Acceder'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
