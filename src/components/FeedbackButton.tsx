import { useState } from 'react';
import { createPortal } from 'react-dom';
import { submitFeedback, type FeedbackType, type FeedbackRole } from '../services/reservationStore';
import { getUser } from '../services/authStore';

interface FeedbackButtonProps {
  role: FeedbackRole;
  className?: string;
}

export default function FeedbackButton({ role, className }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('bug');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    
    setIsSubmitting(true);
    let userEmail = '';
    const user = getUser();
    userEmail = user?.email || '';

    const success = await submitFeedback(type, role, content, userEmail);
    setIsSubmitting(false);
    
    if (success) {
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setContent('');
      }, 2000);
    } else {
      alert('Error al enviar. Inténtalo de nuevo.');
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={className || "text-slate-400 hover:text-amber-400 text-sm flex items-center gap-2 transition-colors"}
        title="Reportar error o sugerencia"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        <span>Feedback</span>
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
              <h2 className="font-bold text-white">Errores / Sugerencias</h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors">✕</button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              {submitted ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-emerald-400 font-bold">¡Gracias por tu ayuda!</p>
                  <p className="text-slate-400 text-sm">Tu comentario ha sido enviado correctamente.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tipo de comentario</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setType('bug')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${type === 'bug' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-slate-500'}`}
                      >
                        🐞 Error / Bug
                      </button>
                      <button
                        type="button"
                        onClick={() => setType('suggestion')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${type === 'suggestion' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/10 text-slate-500'}`}
                      >
                        💡 Sugerencia
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tu mensaje</label>
                    <textarea
                      required
                      autoFocus
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={type === 'bug' ? "Describe qué ha fallado..." : "Cuéntanos tu idea para mejorar..."}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 h-32 resize-none transition-all"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 text-sm font-bold hover:bg-white/5 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !content.trim()}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
