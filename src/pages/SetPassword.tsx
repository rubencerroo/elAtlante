import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword, getSession } from '../services/authStore';

export default function SetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    try {
      const session = getSession();
      if (!session) {
        // No session - redirect to login
        navigate('/admin', { replace: true });
        return;
      }
    } catch {
      navigate('/admin', { replace: true });
    }
    setCheckingSession(false);
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => navigate('/admin', { replace: true }), 2000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la contraseña');
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Verificando sesión...</p>
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-2">
            <svg className="w-8 h-8 text-emerald-400" fill="currentColor" viewBox="0 -960 960 960"><path d="M480-440q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0-80q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm0 440q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Zm0-400Z"/></svg>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Establece tu Contraseña</h1>
          <p className="text-slate-400 text-sm">El Atlante · Primera configuración</p>
        </div>

        {success ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-3">
            <div className="text-4xl">✅</div>
            <p className="text-emerald-400 font-semibold">¡Contraseña actualizada!</p>
            <p className="text-slate-400 text-sm">Redirigiendo al login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Nueva contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                autoComplete="new-password"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Repite la contraseña"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold uppercase tracking-[0.2em] text-sm py-4 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                'Guardar Contraseña'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
