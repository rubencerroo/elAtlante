import { useState } from 'react';
import { addReservation } from '../services/reservationStore';
import GuestCounter from './GuestCounter';
import { getAvailableTimes, isDateValid, getTodayDateString } from '../utils/reservationUtils';

interface ManualReservationModalProps {
  onClose: () => void;
  onSave: () => void;
}

export default function ManualReservationModal({ onClose, onSave }: ManualReservationModalProps) {
  const today = getTodayDateString();
  const initialAvailableTimes = getAvailableTimes(today, 15);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: today,
    time: initialAvailableTimes.length > 0 ? initialAvailableTimes[0] : '13:00',
    guests: 2,
    preference: 'Indiferente' as any,
    hasPet: false,
    notes: '',
    source: 'teléfono' // Corrected from 'phone' to match client origins if needed, but phone is fine.
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDateValid(formData.date, formData.time)) {
      alert('La fecha u hora seleccionada no es válida (restaurante cerrado o fuera de horario).');
      return;
    }
    setLoading(true);
    try {
      await addReservation({
        ...formData,
        status: 'confirmed'
      });
      onSave();
    } catch (err: any) {
      alert(err.message === 'DUPLICATE_RESERVATION' 
        ? 'Ya existe una reserva para ese cliente en esa fecha/hora.' 
        : 'Error al crear la reserva.');
    } finally {
      setLoading(false);
    }
  };

  const activeTimes = getAvailableTimes(formData.date, 15);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[200] p-4">
      <div className="bg-slate-900 border border-white/5 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h2 className="font-bold text-white">Nueva Reserva Manual</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nombre</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Teléfono (opcional)</label>
              <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fecha</label>
              <input required type="date" min={today} value={formData.date} onChange={e => {
                const newDate = e.target.value;
                const newTimes = getAvailableTimes(newDate, 15);
                setFormData({ 
                  ...formData, 
                  date: newDate,
                  time: newTimes.length > 0 ? (newTimes.includes(formData.time) ? formData.time : newTimes[0]) : ''
                });
              }}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50" />
            </div>
            <div className="space-y-1.5 col-span-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Hora</label>
              <select required value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50 appearance-none">
                {activeTimes.length > 0 ? (
                  activeTimes.map(t => <option key={t} value={t}>{t} h</option>)
                ) : (
                  <option value="">Cerrado</option>
                )}
              </select>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 flex flex-col items-center">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 w-full text-center">Comensales</label>
            <div className="w-full flex justify-center">
              <GuestCounter 
                value={formData.guests} 
                onChange={n => setFormData({ ...formData, guests: n })} 
                max={50}
                className="scale-90"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Preferencia</label>
              <select value={formData.preference} onChange={e => setFormData({ ...formData, preference: e.target.value as any })}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50 appearance-none">
                <option value="Indiferente">Indiferente</option>
                <option value="Interior">Interior</option>
                <option value="Mesas altas">Mesas altas</option>
                <option value="Terraza exterior">Terraza exterior</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Origen de la Reserva</label>
              <select value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 appearance-none">
                <option value="phone">📞 Reserva por Teléfono</option>
                <option value="in-person">🚶 Reserva en Persona</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={formData.hasPet} onChange={e => setFormData({ ...formData, hasPet: e.target.checked })} className="sr-only peer" />
              <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
            <span className="text-xs font-semibold text-slate-400">¿Trae mascota? 🐾</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Notas internas</label>
            <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ej: Cliente VIP, aniversario..."
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 h-20 resize-none" />
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-white/5 text-sm font-bold text-white hover:bg-white/5 transition-colors order-2 sm:order-1">Cancelar</button>
            <button type="submit" disabled={loading || !formData.time} className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-primary/20 disabled:opacity-50 order-1 sm:order-2">
              {loading ? 'Creando...' : 'Crear Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
