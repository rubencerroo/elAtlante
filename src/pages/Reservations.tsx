import { useState } from 'react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { addReservation, type Reservation } from '../services/reservationStore';

export default function Reservations() {
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [lastReservation, setLastReservation] = useState<Reservation | null>(null);
  const [formData, setFormData] = useState({
    name: '', email: '', date: '', time: '13:00',
    guests: '2 Personas', preference: 'Indiferente' as const,
    hasPet: false, notes: '',
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 9) {
      alert('Por favor, introduce un número de teléfono válido.');
      return;
    }
    const guestMap: Record<string, number> = { '2 Personas': 2, '3 Personas': 3, '4 Personas': 4, 'Más de 4': 5 };
    const reservation = addReservation({
      name: formData.name,
      email: formData.email,
      phone,
      date: formData.date,
      time: formData.time,
      guests: guestMap[formData.guests] || 2,
      preference: formData.preference as 'Indiferente' | 'Interior' | 'Terraza exterior',
      hasPet: formData.hasPet,
      notes: formData.notes,
    });
    setLastReservation(reservation);
    setSubmitted(true);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (submitted && lastReservation) {
    return (
      <div className="min-h-screen pt-28 pb-24 px-6 lg:px-28 flex flex-col items-center justify-center bg-white dark:bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/5 rounded-full blur-[100px] -z-10"></div>

        <div className="max-w-lg w-full space-y-8">
          {/* Success Header */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center animate-[pulse_2s_ease-in-out_1]">
              <svg className="w-10 h-10 text-emerald-500" fill="currentColor" viewBox="0 -960 960 960"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>
            </div>
            <h2 className="text-slate-900 dark:text-white text-2xl font-bold">¡Reserva registrada!</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Te contactaremos para confirmar tu mesa. Guarda tu número de reserva.
            </p>
          </div>

          {/* Booking Number Card */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/5 rounded-2xl p-6 border border-primary/20 text-center space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Nº de Reserva</span>
            <p className="text-3xl font-black text-primary tracking-widest select-all">{lastReservation.bookingNumber}</p>
          </div>

          {/* Details Card */}
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 space-y-4 border border-slate-100 dark:border-white/5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Nombre</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{lastReservation.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Teléfono</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{lastReservation.phone}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Fecha</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{formatDate(lastReservation.date)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Hora</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{lastReservation.time} h</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Invitados</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{lastReservation.guests} {lastReservation.guests === 1 ? 'persona' : 'personas'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Zona</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{lastReservation.preference}</p>
              </div>
            </div>
            {lastReservation.hasPet && (
              <div className="pt-2 border-t border-slate-200 dark:border-white/5">
                <span className="text-xs text-slate-500 dark:text-slate-400">🐾 Viene con mascota</span>
              </div>
            )}
            {lastReservation.notes && (
              <div className="pt-2 border-t border-slate-200 dark:border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-1">Notas</span>
                <p className="text-xs text-slate-600 dark:text-slate-300">{lastReservation.notes}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-4">
            <button onClick={() => { setSubmitted(false); setLastReservation(null); setFormData({ name: '', email: '', date: '', time: '13:00', guests: '2 Personas', preference: 'Indiferente', hasPet: false, notes: '' }); setPhone(''); }}
              className="text-primary font-semibold text-sm hover:underline">
              Hacer otra reserva
            </button>
          </div>

          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
            <p className="text-xs text-center text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Las reservas están sujetas a disponibilidad.<br/> Te contactaremos personalmente para confirmar tu solicitud.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-24 px-6 lg:px-28 flex flex-col items-center bg-white dark:bg-slate-950 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px] -z-10"></div>

      <div className="max-w-4xl w-full relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          
          <div className="lg:sticky lg:top-36 space-y-8 flex-1">
            <div>
              <span className="text-primary font-bold tracking-[0.4em] uppercase text-[10px]">Reservaciones</span>
              <h1 className="text-slate-900 dark:text-slate-100 text-3xl md:text-4xl lg:text-5xl font-black mt-4 tracking-tight leading-tight">Tu mesa <br/>en el <span className="text-primary italic">Atlántico</span>.</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-light leading-relaxed max-w-md">
              Asegura tu lugar en el barrio marinero. Cocina honesta, producto fresco y el sonido de las olas de fondo. Para grupos grandes, llámanos directamente.
            </p>
            <div className="pt-4 space-y-3">
               <p className="flex items-center gap-3 text-slate-400 font-bold uppercase tracking-widest text-xs">
                  <svg className="size-5 text-primary" fill="currentColor" viewBox="0 -960 960 960"><path d="M798-120q-125 0-247-54.5T329-329Q229-429 174.5-551T120-798q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T387-387q31 31 65.5 58.5T524-281l98-97q9-9 20-11t27 1l140 26q13 2 22.5 13t9.5 25v162q0 18-12 30t-30 12Z"/></svg>
                  +34 928 58 44 22
               </p>
            </div>
          </div>

          <div className="flex-[1.5] w-full lg:border-l border-slate-100 dark:border-white/5 lg:pl-16 py-6">
            <form className="space-y-12" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-white/5 pb-5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600 dark:text-slate-300">Nombre Completo <span className="text-primary">*</span></label>
                  <input className="bg-transparent text-lg font-light text-slate-900 dark:text-white border-none focus:ring-0 p-0 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="Ej: Juan Pérez" type="text" required value={formData.name} onChange={e => handleChange('name', e.target.value)} />
                </div>
                <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-white/5 pb-5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600 dark:text-slate-300">Email <span className="text-primary">*</span></label>
                  <input className="bg-transparent text-lg font-light text-slate-900 dark:text-white border-none focus:ring-0 p-0 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="tu@email.com" type="email" required value={formData.email} onChange={e => handleChange('email', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-white/5 pb-5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600 dark:text-slate-300">Teléfono <span className="text-primary">*</span></label>
                  <PhoneInput
                    defaultCountry="es"
                    value={phone}
                    onChange={setPhone}
                    className="phone-input-custom"
                    inputClassName="phone-input-field"
                  />
                </div>
                <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-white/5 pb-5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600 dark:text-slate-300">Fecha <span className="text-primary">*</span></label>
                  <input className="bg-transparent text-lg font-light text-slate-900 dark:text-white border-none focus:ring-0 p-0"
                    type="date" required min={new Date().toISOString().split('T')[0]} value={formData.date} onChange={e => handleChange('date', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-white/5 pb-5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600 dark:text-slate-300">Hora <span className="text-primary">*</span></label>
                  <input className="bg-transparent text-lg font-light text-slate-900 dark:text-white border-none focus:ring-0 p-0"
                    type="time" required value={formData.time} onChange={e => handleChange('time', e.target.value)} />
                </div>
                <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-white/5 pb-5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600 dark:text-slate-300">Invitados</label>
                  <div className="relative">
                    <select className="bg-transparent w-full text-lg font-light text-slate-900 dark:text-white border-none focus:ring-0 p-0 appearance-none cursor-pointer"
                      value={formData.guests} onChange={e => handleChange('guests', e.target.value)}>
                      <option>2 Personas</option>
                      <option>3 Personas</option>
                      <option>4 Personas</option>
                      <option>Más de 4</option>
                    </select>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-primary">
                      <svg className="size-5" fill="currentColor" viewBox="0 -960 960 960"><path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z"/></svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-white/5 pb-5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600 dark:text-slate-300">Preferencia</label>
                  <div className="relative">
                    <select className="bg-transparent w-full text-lg font-light text-slate-900 dark:text-white border-none focus:ring-0 p-0 appearance-none cursor-pointer"
                      value={formData.preference} onChange={e => handleChange('preference', e.target.value)}>
                      <option>Indiferente</option>
                      <option>Interior</option>
                      <option>Terraza exterior</option>
                    </select>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-primary">
                      <svg className="size-5" fill="currentColor" viewBox="0 -960 960 960"><path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="mascota" className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary/20 bg-slate-50 dark:bg-white/5 dark:border-white/10"
                  checked={formData.hasPet} onChange={e => handleChange('hasPet', e.target.checked)} />
                <label htmlFor="mascota" className="text-sm font-light text-slate-600 dark:text-slate-300 cursor-pointer">Vengo con mascota</label>
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600 dark:text-slate-300">Notas Adicionales</label>
                <textarea className="bg-slate-50 dark:bg-white/5 rounded-2xl p-8 text-base font-light text-slate-900 dark:text-white border-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="¿Alguna alergia o preferencia de mesa?" rows={3} value={formData.notes} onChange={e => handleChange('notes', e.target.value)}></textarea>
              </div>

              <div className="pt-6">
                <button type="submit" className="relative w-full h-16 overflow-hidden group rounded-2xl shadow-2xl shadow-primary/30">
                  <div className="absolute inset-0 bg-primary transition-transform duration-500 group-hover:scale-110"></div>
                  <span className="relative z-10 text-white font-bold uppercase tracking-[0.3em] text-sm">Confirmar Reserva</span>
                </button>
              </div>

              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                <p className="text-xs text-center text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  Las reservas están sujetas a disponibilidad. <br/> Te contactaremos personalmente para confirmar tu solicitud.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
