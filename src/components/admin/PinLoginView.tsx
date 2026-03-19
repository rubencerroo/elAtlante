import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type StaffProfile, getStaffProfiles, pinSignIn, setActiveStaffId } from '../../services/authStore';

interface PinLoginViewProps {
  onSuccess: (role: string) => void;
  onCancel: () => void;
}

export default function PinLoginView({ onSuccess, onCancel }: PinLoginViewProps) {
  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingProfiles, setFetchingProfiles] = useState(true);

  useEffect(() => {
    async function loadProfiles() {
      try {
        const data = await getStaffProfiles();
        setProfiles(data);
      } catch (err) {
        console.error('Error loading profiles:', err);
      } finally {
        setFetchingProfiles(false);
      }
    }
    loadProfiles();
  }, []);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        handleVerify(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleVerify = async (pinAttempt: string) => {
    if (!selectedStaff) return;
    setLoading(true);
    setError('');
    try {
      // pinSignIn verifies the PIN server-side and creates a real Supabase auth session
      const result = await pinSignIn(selectedStaff.id, pinAttempt);
      setActiveStaffId(selectedStaff.id);
      onSuccess(result.role);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('PIN incorrecto')) {
        setError('PIN incorrecto');
      } else {
        setError('Error al verificar PIN');
        console.error('Pin login error:', err);
      }
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProfiles) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
          <p className="text-amber-400 text-sm font-medium">Equipo no disponible</p>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            Es necesario iniciar sesión con contraseña de administrador para cargar la lista del equipo en este dispositivo.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20"
        >
          Usar Login Tradicional
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {!selectedStaff ? (
          <motion.div
            key="selector"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2">Selecciona tu perfil</h2>
              <p className="text-slate-400 text-sm">Toca tu nombre para iniciar sesión</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => setSelectedStaff(profile)}
                  className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-primary/50 transition-all flex flex-col items-center gap-3 group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl group-hover:scale-110 transition-transform">
                    {(profile.display_name || profile.email)[0].toUpperCase()}
                  </div>
                  <span className="text-white font-medium truncate w-full text-center">
                    {profile.display_name || profile.email.split('@')[0]}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={onCancel}
              className="w-full text-slate-500 hover:text-white text-sm underline transition-colors"
            >
              Usar correo y contraseña
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="keypad"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <button 
                onClick={() => { setSelectedStaff(null); setPin(''); setError(''); }}
                className="text-primary text-sm hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </button>
              <h2 className="text-2xl font-bold text-white">Hola, {selectedStaff.display_name || selectedStaff.email.split('@')[0]}</h2>
              <p className="text-slate-400">Introduce tu PIN de 4 dígitos</p>
            </div>

            {/* PIN Dots */}
            <div className="flex justify-center gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    pin.length > i 
                      ? 'bg-primary border-primary scale-110' 
                      : 'border-white/20'
                  } ${error ? 'border-red-500 bg-red-500/20' : ''}`}
                />
              ))}
            </div>

            {error && <p className="text-red-400 text-center text-sm animate-shake">{error}</p>}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  disabled={loading}
                  className="h-20 bg-white/5 hover:bg-white/10 active:bg-primary/20 text-white text-3xl font-light rounded-2xl transition-all border border-white/5 active:border-primary/50"
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                onClick={() => handleNumberClick('0')}
                disabled={loading}
                className="h-20 bg-white/5 hover:bg-white/10 active:bg-primary/20 text-white text-3xl font-light rounded-2xl transition-all border border-white/5 active:border-primary/50"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="h-20 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 002.828 0L19 12l-6.758-6.758a2 2 0 00-2.828 0L3 12z" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
