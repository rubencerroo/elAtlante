import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PINS = { owner: '1234', waiter: '0000' };

export default function AdminLogin() {
  const navigate = useNavigate();
  const [role, setRole] = useState<'owner' | 'waiter' | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    if (pin === PINS[role]) {
      sessionStorage.setItem('admin_role', role);
      navigate(role === 'owner' ? '/admin/owner' : '/admin/waiter');
    } else {
      setError('PIN incorrecto');
      setPin('');
    }
  };

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

        {/* Role Selection */}
        {!role ? (
          <div className="space-y-4">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] text-center">Selecciona tu rol</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setRole('owner')}
                className="group relative bg-white/5 hover:bg-primary/10 border border-white/10 hover:border-primary/30 rounded-2xl p-6 text-center transition-all duration-300">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 -960 960 960"><path d="m354-287 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143ZM233-120l65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-350Z"/></svg>
                </div>
                <p className="text-white font-semibold text-sm">Dueño</p>
                <p className="text-slate-500 text-xs mt-1">Gestión completa</p>
              </button>
              <button onClick={() => setRole('waiter')}
                className="group relative bg-white/5 hover:bg-primary/10 border border-white/10 hover:border-primary/30 rounded-2xl p-6 text-center transition-all duration-300">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 -960 960 960"><path d="M160-80q-33 0-56.5-23.5T80-160v-440q0-33 23.5-56.5T160-680h200v-120q0-33 23.5-56.5T440-880h80q33 0 56.5 23.5T600-800v120h200q33 0 56.5 23.5T880-600v440q0 33-23.5 56.5T800-80H160Zm280-600h80v-120h-80v120ZM160-160h640v-440H160v440Zm320-220Z"/></svg>
                </div>
                <p className="text-white font-semibold text-sm">Camarero</p>
                <p className="text-slate-500 text-xs mt-1">Operación diaria</p>
              </button>
            </div>
          </div>
        ) : (
          /* PIN Entry */
          <form onSubmit={handleSubmit} className="space-y-6">
            <button type="button" onClick={() => { setRole(null); setPin(''); setError(''); }}
              className="text-slate-400 hover:text-white text-sm flex items-center gap-2 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 -960 960 960"><path d="M640-80 240-480l400-400 71 71-329 329 329 329-71 71Z"/></svg>
              Cambiar rol
            </button>
            <div className="text-center">
              <p className="text-slate-400 text-sm">Acceso como <span className="text-primary font-semibold">{role === 'owner' ? 'Dueño' : 'Camarero'}</span></p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">PIN de acceso</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-2xl tracking-[1em] text-center font-mono focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="····"
                autoFocus
              />
              {error && <p className="text-red-400 text-sm text-center animate-pulse">{error}</p>}
            </div>
            <button type="submit" disabled={pin.length < 4}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold uppercase tracking-[0.2em] text-sm py-4 rounded-xl transition-all duration-300 shadow-lg shadow-primary/20">
              Acceder
            </button>
            <p className="text-slate-600 text-xs text-center">PIN Dueño: 1234 · PIN Camarero: 0000</p>
          </form>
        )}
      </div>
    </div>
  );
}
