import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ComingSoonProps {
  onUnlock: () => void;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulating a small delay for feedback
    setTimeout(() => {
      const expectedPassword = import.meta.env.VITE_COMING_SOON_PASSWORD;
      if (password === expectedPassword) {
        onUnlock();
      } else {
        setError(true);
        setPassword('');
        setIsSubmitting(false);
        // Reset error after animation
        setTimeout(() => setError(false), 2000);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] dark:bg-primary/20"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] dark:bg-primary/20"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-md w-full px-6 text-center"
      >
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
            </svg>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
          El Atlante
        </h1>
        
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-12">
          Estamos preparando algo espectacular. <br />
          Vuelve muy pronto.
        </p>

        <div className="glass dark:glass-dark p-8 rounded-3xl border border-white/20 dark:border-slate-800/50 relative overflow-hidden">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-2 left-0 right-0 text-red-500 text-sm font-medium"
              >
                Contraseña incorrecta
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Introducir contraseña"
                className={`w-full px-6 py-4 bg-white/50 dark:bg-slate-800/50 border ${error ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white transition-all text-center tracking-widest`}
                autoFocus
                disabled={isSubmitting}
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 group"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Acceder
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-12 text-slate-400 dark:text-slate-600 text-sm font-medium uppercase tracking-widest">
          Coming Soon 2026
        </div>
      </motion.div>
    </div>
  );
};

export default ComingSoon;
