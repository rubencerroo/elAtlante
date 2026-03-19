import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';

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
    <div className="fixed inset-0 z-[9999] flex flex-col lg:flex-row bg-background-light dark:bg-background-dark overflow-x-hidden overflow-y-auto font-sans">
      <SEO
        title="Próximamente | El Atlante"
        description="Estamos preparando algo espectacular en El Atlante de San Cristóbal. Sabor del mar y tradición marinera."
      />

      {/* Left Column: Visual & Brand Branding */}
      <div className="lg:w-1/2 relative min-h-[40vh] lg:min-h-screen flex flex-col justify-center p-12 lg:p-24 overflow-hidden">
        {/* Coastal Background Image */}
        <div className="absolute inset-0 -z-10">
          <img
            src="https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&q=80&w=1600"
            alt="Costa de Gran Canaria"
            className="w-full h-full object-cover scale-105 animate-[kenburns_20s_ease-in-out_infinite_alternate] opacity-30"
          />
          <div className="absolute inset-0 bg-primary/40 dark:bg-primary/60 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/80 via-transparent to-transparent"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10 space-y-8"
        >
          <div className="space-y-4">
            <span className="text-white/60 font-medium tracking-[0.4em] uppercase text-[10px] block">El Atlante de San Cristóbal</span>
            <h1 className="text-white text-5xl md:text-6xl lg:text-7xl font-serif leading-tight tracking-tight">
              Sabor del mar <br />
              <span className="italic text-coastal-sea">muy pronto</span>.
            </h1>
          </div>

          <div className="w-24 h-[1px] bg-white/30"></div>

          <p className="text-white/80 text-lg font-light max-w-md leading-relaxed">
            Estamos perfeccionando cada detalle para ofrecerte lo mejor de nuestra cocina marinera frente al Atlántico.
          </p>
        </motion.div>

        {/* Floating elements for visual interest */}
        <div className="absolute bottom-12 left-12 lg:bottom-24 lg:left-24 text-white/40 text-[10px] font-bold tracking-[0.3em] uppercase">
          Est. 2026 — Las Palmas
        </div>
      </div>

      {/* Right Column: Interaction & Access */}
      <div className="lg:w-1/2 flex items-center justify-center p-12 lg:p-24 bg-white dark:bg-background-dark relative">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-coastal-sea/5 rounded-full blur-[100px] pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-md w-full relative z-10 text-center lg:text-left"
        >
          <div className="mb-12 flex justify-center lg:justify-start">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
              </svg>
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-serif text-primary dark:text-white mb-6">
            Acceso Exclusivo
          </h2>

          <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg font-light leading-relaxed">
            Si dispones de un código de acceso, puedes previsualizar nuestro nuevo portal.
          </p>

          <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 relative overflow-hidden shadow-sm">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-2 left-0 right-0 text-red-500 text-[10px] font-bold uppercase tracking-widest text-center"
                >
                  Contraseña incorrecta
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 block ml-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-8 py-5 bg-white dark:bg-slate-900/50 border ${error ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white transition-all text-center tracking-[0.5em] text-sm shadow-inner`}
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-16 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold uppercase tracking-[0.3em] text-[11px] shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="relative z-10">Entrar</span>
                    <svg className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-12 flex items-center justify-center lg:justify-start gap-6 text-slate-400 dark:text-slate-600">
            <a href="https://www.instagram.com/restaurante_elatlante" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <span className="text-[10px] font-bold uppercase tracking-widest">@restaurante_elatlante</span>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes kenburns {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default ComingSoon;

