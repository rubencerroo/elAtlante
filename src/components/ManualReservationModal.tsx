import { useState, useRef, useEffect } from 'react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { addReservation } from '../services/reservationStore';
import GuestCounter from './GuestCounter';
import Calendar from './Calendar';
import CustomSelect from './CustomSelect';
import { getAvailableTimes, isDateValid, getTodayDateString, getDefaultReservationDateTime } from '../utils/reservationUtils';

interface ManualReservationModalProps {
  onClose: () => void;
  onSave: () => void;
}

export default function ManualReservationModal({ onClose, onSave }: ManualReservationModalProps) {
  const today = getTodayDateString();
  const defaultDateTime = getDefaultReservationDateTime();
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: defaultDateTime.date,
    time: defaultDateTime.time,
    guests: 2,
    preference: 'Indiferente' as any,
    hasPet: false,
    notes: '',
    source: 'phone'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDateValid(formData.date, formData.time)) {
      alert('La fecha u hora seleccionada no es válida (restaurante cerrado o fuera de horario).');
      return;
    }
    if (formData.phone.length < 9) {
      alert('El número de teléfono no es válido.');
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[200] p-4 sm:p-6 overflow-y-auto custom-scrollbar dark">
      <div className="bg-slate-900 border border-white/5 rounded-3xl w-full max-w-lg sm:max-w-2xl my-auto overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h2 className="font-bold text-lg text-white">Nueva Reserva Manual</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar overflow-x-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-x-10">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/70 ml-1">Nombre Completo</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del cliente"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all" />
            </div>
            <div className="space-y-2 group">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/70 ml-1">Teléfono (obligatorio)</label>
              <div className="border border-white/10 group-focus-within:border-primary/50 group-focus-within:ring-4 group-focus-within:ring-primary/5 bg-white/5 rounded-2xl px-5 py-2 transition-all">
                <PhoneInput
                  defaultCountry="es"
                  value={formData.phone}
                  onChange={(phone) => setFormData({ ...formData, phone })}
                  className="phone-input-custom"
                  inputClassName="phone-input-field"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-x-10">
            <div className="space-y-2 col-span-1 relative" ref={calendarRef}>
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/70 ml-1">Fecha</label>
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white hover:bg-white/10 focus:outline-none focus:border-primary/50 transition-all font-light"
              >
                <span className="capitalize">{formatDate(formData.date)}</span>
                <svg className={`size-4 text-slate-400 transition-transform duration-300 ${showCalendar ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
              </button>

              <AnimatePresence>
                {showCalendar && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-3 z-[210] overflow-hidden shadow-2xl rounded-3xl"
                  >
                    <Calendar
                      selectedDate={formData.date}
                      onSelect={(date) => {
                        const newTimes = getAvailableTimes(date, 15);
                        setFormData({
                          ...formData,
                          date: date,
                          time: newTimes.length > 0 ? (newTimes.includes(formData.time) ? formData.time : newTimes[0]) : ''
                        });
                        setShowCalendar(false);
                      }}
                      minDate={today}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="space-y-2 col-span-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/70 ml-1">Hora</label>
              <CustomSelect
                value={formData.time}
                onChange={v => setFormData({ ...formData, time: v })}
                options={activeTimes.map(t => ({ value: t, label: `${t} h` }))}
                placeholder="Cerrado"
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 flex flex-col items-center">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/70 w-full text-center">Número de Comensales</label>
            <div className="w-full flex justify-center py-2 bg-white/5 border border-white/5 rounded-2xl">
              <GuestCounter
                value={formData.guests}
                onChange={n => setFormData({ ...formData, guests: n })}
                max={50}
                className="scale-105"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-x-10">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/70 ml-1">Preferencia de Zona</label>
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-primary/50 transition-all">
                <select value={formData.preference} onChange={e => setFormData({ ...formData, preference: e.target.value as any })}
                  className="w-full bg-transparent px-5 py-3 text-sm text-white focus:outline-none appearance-none cursor-pointer font-light">
                  <option value="Indiferente">Indiferente</option>
                  <option value="Interior">Interior</option>
                  <option value="Mesas altas">Mesas altas</option>
                  <option value="Terraza exterior">Terraza exterior</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/70 ml-1">Origen de la Reserva</label>
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-primary/50 transition-all">
                <select value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })}
                  className="w-full bg-transparent px-5 py-3 text-sm text-white focus:outline-none appearance-none cursor-pointer font-light">
                  <option value="phone">📞 Reserva por Teléfono</option>
                  <option value="in-person">🚶 Reserva en Persona</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 py-4 px-6 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/[0.08] transition-all group" onClick={() => setFormData({ ...formData, hasPet: !formData.hasPet })}>
            <div className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 ${formData.hasPet ? 'bg-primary' : 'bg-white/10'}`}>
              <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform duration-300 ${formData.hasPet ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm font-medium text-white group-hover:text-white transition-colors uppercase tracking-wider">Trae mascota 🐾</span>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/70 ml-1">Notas internas / Observaciones</label>
            <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ej: Alergias, Cliente VIP, celebración especial..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 h-28 resize-none transition-all font-light" />
          </div>

          <div className="pt-6 flex flex-col sm:flex-row gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-4 rounded-2xl border border-white/10 text-sm font-bold text-white/70 hover:bg-white/5 hover:text-white transition-all order-2 sm:order-1">Cancelar</button>
            <button type="submit" disabled={loading || !formData.time} className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-xl shadow-primary/20 disabled:opacity-50 order-1 sm:order-2 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>Procesando...</span>
                </>
              ) : 'Confirmar Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
