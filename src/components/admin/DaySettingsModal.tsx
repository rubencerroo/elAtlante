import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Slot {
  start: string;
  end: string;
}

interface DaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  initialIsClosed: boolean;
  initialSlots?: Slot[];
  onSave: (isClosed: boolean, slots: Slot[] | null) => Promise<void>;
  onDelete: () => Promise<void>;
  hasOverride: boolean;
}

export default function DaySettingsModal({ 
  isOpen, 
  onClose, 
  date, 
  initialIsClosed, 
  initialSlots, 
  onSave,
  onDelete,
  hasOverride
}: DaySettingsModalProps) {
  const [isClosed, setIsClosed] = useState(initialIsClosed);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsClosed(initialIsClosed);
    if (initialSlots && initialSlots.length > 0) {
      setSlots([...initialSlots]);
    } else {
      // Default to standard opening hours for easy editing
      const standardSlots = [
          { start: '13:00', end: '16:00' },
          { start: '20:00', end: '23:30' }
      ];
      setSlots(standardSlots);
    }
  }, [initialIsClosed, initialSlots, isOpen]);

  if (!isOpen) return null;

  const handleAddSlot = () => {
    setSlots([...slots, { start: '13:00', end: '15:00' }]);
  };

  const handleRemoveSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const handleSlotChange = (index: number, field: keyof Slot, value: string) => {
    const newSlots = [...slots];
    newSlots[index][field] = value;
    setSlots(newSlots);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    await onSave(isClosed, isClosed ? null : slots);
    setIsSaving(false);
    setShowConfirm(false);
    onClose();
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    onClose();
  };

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-md"
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] shadow-2xl border"
        style={{ background: 'var(--admin-modal-bg)', borderColor: 'var(--admin-border)' }}
      >
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">Configuración de día</span>
            <h2 className="text-2xl font-serif font-bold capitalize" style={{ color: 'var(--admin-text)' }}>{formattedDate}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors" style={{ color: 'var(--admin-text-secondary)' }}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 pt-4 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Status Toggle */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block">Estado del restaurante</label>
            <div className="flex p-1.5 rounded-2xl border" style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}>
              <button 
                onClick={() => setIsClosed(false)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${!isClosed ? 'bg-emerald-400/10 text-emerald-500 shadow-sm' : 'text-slate-500 opacity-50'}`}
              >
                Abierto
              </button>
              <button 
                onClick={() => setIsClosed(true)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${isClosed ? 'bg-red-400/10 text-red-500 shadow-sm' : 'text-slate-500 opacity-50'}`}
              >
                Cerrado
              </button>
            </div>
          </div>

          {/* Slots Editor */}
          <AnimatePresence mode="wait">
            {!isClosed && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6 overflow-hidden"
              >
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Horarios de servicio</label>
                  <button 
                    onClick={handleAddSlot}
                    className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
                  >
                    <span>+ Añadir turno</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {slots.map((slot, index) => (
                    <motion.div 
                      key={index}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 p-4 rounded-2xl border"
                      style={{ background: 'var(--admin-bg)', borderColor: 'var(--admin-border)' }}
                    >
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase tracking-tighter text-slate-400">Apertura</span>
                          <input 
                            type="time" 
                            value={slot.start} 
                            onChange={(e) => handleSlotChange(index, 'start', e.target.value)}
                            className="w-full bg-transparent text-sm font-bold focus:outline-none"
                            style={{ color: 'var(--admin-text)' }}
                          />
                        </div>
                        <div className="space-y-1 text-right">
                          <span className="text-[9px] uppercase tracking-tighter text-slate-400">Cierre</span>
                          <input 
                            type="time" 
                            value={slot.end} 
                            onChange={(e) => handleSlotChange(index, 'end', e.target.value)}
                            className="w-full bg-transparent text-sm font-bold text-right focus:outline-none"
                            style={{ color: 'var(--admin-text)' }}
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveSlot(index)}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </motion.div>
                  ))}
                  {slots.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4">No hay turnos definidos. El restaurante aparecerá cerrado.</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reset to Default */}
          {hasOverride && (
            <div className="pt-2">
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-red-400 transition-colors border border-dashed border-slate-300 dark:border-white/10 rounded-2xl"
              >
                Restablecer horario automático
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 pt-4 flex gap-4">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
            style={{ background: 'var(--admin-bg-hover)', color: 'var(--admin-text-secondary)', border: '1px solid var(--admin-border)' }}
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={() => setShowConfirm(true)}
            className="flex-1 py-4 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/20"
          >
            Guardar cambios
          </button>
        </div>

        {/* Local Confirmation Modal Overlay for Saving */}
        <AnimatePresence>
          {showConfirm && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 w-full max-w-xs text-center space-y-6 shadow-2xl"
              >
                <div className="text-4xl">❓</div>
                <div className="space-y-2">
                  <h4 className="text-lg font-bold">¿Confirmar cambios?</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Vas a modificar la disponibilidad del restaurante para el día <strong>{formattedDate}</strong>.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    disabled={isSaving}
                    onClick={handleConfirmSave}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-all outline-none"
                  >
                    {isSaving ? 'Guardando...' : 'Sí, confirmar'}
                  </button>
                  <button 
                    onClick={() => setShowConfirm(false)}
                    className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest outline-none"
                  >
                    Volver atrás
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Local Confirmation Modal Overlay for Resetting/Deleting */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 w-full max-w-xs text-center space-y-6 shadow-2xl"
              >
                <div className="text-4xl">🗑️</div>
                <div className="space-y-2">
                  <h4 className="text-lg font-bold">¿Restablecer horario?</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Se eliminará la configuración personalizada para el día <strong>{formattedDate}</strong> y volverá al horario automático.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    disabled={isDeleting}
                    onClick={handleConfirmDelete}
                    className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-all outline-none"
                  >
                    {isDeleting ? 'Restableciendo...' : 'Sí, restablecer'}
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest outline-none"
                  >
                    Mantener cambios
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Confirmation logic using AlertModal can be used as an alternative, but the nested implementation is smoother here */}
    </div>,
    document.body
  );
}
