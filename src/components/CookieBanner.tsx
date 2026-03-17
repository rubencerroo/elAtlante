import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('el_atlante_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('el_atlante_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-6 sm:right-auto z-50 pointer-events-none transition-all duration-500 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} ${!isVisible && 'hidden'}`}>
      <div className="max-w-[360px] w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/50 dark:border-white/10 p-5 pointer-events-auto flex flex-col gap-4 relative overflow-hidden">
        
        {/* Minimal text */}
        <div className="flex items-start gap-4">
          <div className="shrink-0 text-primary mt-1">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 -960 960 960">
              <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q16 0 29.5 4.5T535-862q-11 25-13 51.5t9 51.5q11 25 32 41t47 22q16 4 33.5.5T675-709q21 17 31 41.5t5 51.5q-5 28 8.5 52t34.5 37q21 13 46 17.5t50-3.5q8 18 12 34t4 33q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/>
            </svg>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-light leading-relaxed">
            Usamos cookies para mejorar tu experiencia. Al continuar, aceptas su uso según nuestra <Link to="/cookies" className="text-primary hover:underline font-semibold">Política de Cookies</Link>.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsVisible(false)}
            className="flex-1 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
          >
            Cerrar
          </button>
          <button 
            onClick={handleAccept}
            className="flex-1 px-4 py-2 bg-primary text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg hover:bg-primary/90"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
