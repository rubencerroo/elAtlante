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
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--admin-text)' }}>Selecciona tu perfil</h2>
              <p className="text-sm" style={{ color: 'var(--admin-text-secondary)' }}>Toca tu nombre para iniciar sesión</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => setSelectedStaff(profile)}
                  className="p-6 border rounded-2xl transition-all flex flex-col items-center gap-3 group"
                  style={{ background: 'var(--admin-bg-card)', borderColor: 'var(--admin-border)' }}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl group-hover:scale-110 transition-transform">
                    {(profile.display_name || profile.email)[0].toUpperCase()}
                  </div>
                  <span className="font-medium truncate w-full text-center" style={{ color: 'var(--admin-text)' }}>
                    {profile.display_name || profile.email.split('@')[0]}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={onCancel}
              className="w-full text-sm underline transition-colors"
              style={{ color: 'var(--admin-text-muted)' }}
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
              <h2 className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>Hola, {selectedStaff.display_name || selectedStaff.email.split('@')[0]}</h2>
              <p style={{ color: 'var(--admin-text-secondary)' }}>Introduce tu PIN de 4 dígitos</p>
            </div>

            {/* PIN Dots */}
            <div className="flex justify-center gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    pin.length > i 
                      ? 'bg-primary border-primary scale-110' 
                      : ''
                  } ${error ? 'border-red-500 bg-red-500/20' : ''}`}
                  style={{ borderColor: pin.length > i ? undefined : 'var(--admin-border-strong)' }}
                />
              ))}
            </div>

            {error && <p className="text-red-400 text-center text-sm animate-shake">{error}</p>}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  disabled={loading}
                  className="h-16 active:bg-primary/20 text-2xl font-light rounded-xl transition-all border active:border-primary/50"
                  style={{ background: 'var(--admin-bg-input)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                onClick={() => handleNumberClick('0')}
                disabled={loading}
                className="h-16 active:bg-primary/20 text-2xl font-light rounded-xl transition-all border active:border-primary/50"
                style={{ background: 'var(--admin-bg-input)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
              >
                0
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="h-16 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                aria-label="Borrar"
              >
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.7071 15.2938C11.3166 14.9033 11.3166 14.2701 11.7071 13.8796L13.5839 12.0027L11.7079 10.1267C11.3174 9.73617 11.3174 9.103 11.7079 8.71248C12.0984 8.32195 12.7316 8.32195 13.1221 8.71248L14.9982 10.5885L16.8796 8.70702C17.2702 8.3165 17.9033 8.3165 18.2938 8.70702C18.6844 9.09755 18.6844 9.73071 18.2938 10.1212L16.4124 12.0027L18.293 13.8833C18.6835 14.2739 18.6835 14.907 18.293 15.2975C17.9025 15.6881 17.2693 15.6881 16.8788 15.2975L14.9982 13.4169L13.1213 15.2938C12.7308 15.6843 12.0976 15.6843 11.7071 15.2938Z" fill="currentColor"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M5.6131 5.14653C6.18186 4.42266 7.05148 4 7.97206 4H20C21.6568 4 23 5.34315 23 7V17C23 18.6569 21.6568 20 20 20H7.97206C7.05148 20 6.18186 19.5773 5.6131 18.8535L1.68453 13.8535C0.829805 12.7656 0.829807 11.2344 1.68453 10.1465L5.6131 5.14653ZM7.97206 6C7.6652 6 7.37533 6.14089 7.18574 6.38218L3.25717 11.3822C2.97226 11.7448 2.97226 12.2552 3.25717 12.6178L7.18574 17.6178C7.37533 17.8591 7.6652 18 7.97206 18H20C20.5523 18 21 17.5523 21 17V7C21 6.44772 20.5523 6 20 6H7.97206Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
