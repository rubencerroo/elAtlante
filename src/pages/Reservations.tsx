import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { addReservation, getReservationById, type Reservation } from '../services/reservationStore';

export default function Reservations() {
  const [searchParams] = useSearchParams();
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastReservation, setLastReservation] = useState<Reservation | null>(null);
  const [formData, setFormData] = useState({
    name: '', email: '', date: '', time: '13:00',
    guests: '2', preference: 'Indiferente' as const,
    hasPet: false, notes: '', acceptPolicies: false,
  });

  useEffect(() => {
    const isConfirmed = searchParams.get('confirmed') === 'true';
    const reservationId = searchParams.get('id');
    const errorParam = searchParams.get('error');

    if (errorParam === 'failed_to_confirm') {
      alert('No hemos podido confirmar tu reserva. El enlace puede haber caducado o ser inválido.');
    } else if (errorParam === 'reservation_cancelled') {
      alert('Lo sentimos, esta reserva ha sido cancelada o ya no es válida.');
    }

    if (isConfirmed && reservationId && !submitted) {
      getReservationById(reservationId).then(res => {
        if (res) {
          setLastReservation(res);
          setSubmitted(true);
        } else {
          alert('No hemos encontrado los detalles de tu reserva confirmada.');
        }
      });
    }
  }, [searchParams, submitted]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getAvailableTimes = (dateStr: string) => {
    if (!dateStr) return ['13:00'];
    const date = new Date(dateStr + 'T12:00:00'); 
    const day = date.toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'Atlantic/Canary' }).toLowerCase();
    const normalizedDay = day.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (['lunes', 'jueves', 'viernes', 'sabado'].includes(normalizedDay)) {
      return ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30'];
    }
    if (normalizedDay === 'domingo') {
      return ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30'];
    }
    return [];
  };

  const isDateValid = (dateStr: string, timeStr: string) => {
    const date = new Date(dateStr + 'T' + timeStr);
    const day = date.toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'Atlantic/Canary' }).toLowerCase();
    const normalizedDay = day.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const timeToMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const currentMinutes = timeToMinutes(timeStr);

    switch (normalizedDay) {
      case 'lunes':
      case 'jueves':
      case 'viernes':
      case 'sabado':
        return currentMinutes >= timeToMinutes('12:30') && currentMinutes <= timeToMinutes('23:00');
      case 'domingo':
        return currentMinutes >= timeToMinutes('12:30') && currentMinutes <= timeToMinutes('16:30');
      case 'martes':
      case 'miercoles':
        return false;
      default:
        return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 9) {
      alert('Por favor, introduce un número de teléfono válido.');
      return;
    }

    if (!isDateValid(formData.date, formData.time)) {
      alert('Lo sentimos, el restaurante está cerrado en el horario seleccionado. Por favor, revisa nuestros horarios.');
      return;
    }

    setIsSubmitting(true);

    if (!isDateValid(formData.date, formData.time)) {
      alert('Lo sentimos, el restaurante está cerrado en el horario seleccionado. Por favor, revisa nuestros horarios.');
      return;
    }

    try {
      const guestCount = parseInt(formData.guests);
      const reservation = await addReservation({
        name: formData.name,
        email: formData.email,
        phone,
        date: formData.date,
        time: formData.time,
        guests: isNaN(guestCount) ? 5 : guestCount,
        preference: formData.preference as 'Indiferente' | 'Interior' | 'Mesas altas' | 'Terraza exterior',
        hasPet: formData.hasPet,
        notes: formData.notes,
        utmSource: searchParams.get('utm_source') || undefined,
        utmMedium: searchParams.get('utm_medium') || undefined,
        utmCampaign: searchParams.get('utm_campaign') || undefined,
        language: navigator.language,
      });
      if (reservation) {
        setLastReservation(reservation);
        setSubmitted(true);
      } else {
        alert('Hubo un error al procesar tu reserva. Por favor, inténtalo de nuevo o contáctanos por teléfono.');
      }
    } catch (err: any) {
      if (err.message === 'DUPLICATE_RESERVATION') {
        alert('Ya tienes una reserva para esta misma fecha y hora. Si necesitas modificarla, por favor contáctanos por teléfono.');
      } else {
        alert('Hubo un error al procesar tu reserva. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
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
              <svg className="w-10 h-10 text-emerald-500" fill="currentColor" viewBox="0 -960 960 960"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" /></svg>
            </div>
            <h2 className="text-slate-900 dark:text-white text-2xl font-bold">
              {lastReservation.status === 'confirmed' ? '¡Reserva confirmada!' : '¡Reserva registrada!'}
            </h2>
            <div className="space-y-2">
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                {lastReservation.status === 'confirmed'
                  ? 'Tu mesa está asegurada. ¡Te esperamos!'
                  : `Hemos enviado un correo a ${lastReservation.email} para confirmar tu asistencia.`}
              </p>
              {lastReservation.status !== 'confirmed' && (
                <p className="text-primary font-bold text-sm bg-primary/5 py-2 px-4 rounded-full inline-block">
                  Por favor, revisa tu bandeja de entrada y pulsa el botón de confirmar.
                </p>
              )}
            </div>
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
            <button onClick={() => { setSubmitted(false); setLastReservation(null); setFormData({ name: '', email: '', date: '', time: '13:00', guests: '2 Personas', preference: 'Indiferente', hasPet: false, notes: '', acceptPolicies: false }); setPhone(''); }}
              className="text-primary font-semibold text-sm hover:underline">
              Hacer otra reserva
            </button>
          </div>

          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
            <p className="text-xs text-center text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Las reservas están sujetas a disponibilidad.<br /> Te contactaremos personalmente para confirmar tu solicitud.
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
              <h1 className="text-slate-900 dark:text-slate-100 text-3xl md:text-4xl lg:text-5xl font-black mt-4 tracking-tight leading-tight">Tu mesa <br />en el <span className="text-primary italic">Atlántico</span>.</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-light leading-relaxed max-w-md">
              Asegura tu lugar en el barrio marinero. Cocina honesta, producto fresco y el sonido de las olas de fondo. Para grupos grandes, llámanos directamente.
            </p>
            <div className="pt-4 space-y-3">
              <p className="flex items-center gap-3 text-slate-400 font-bold uppercase tracking-widest text-xs">
                <svg className="size-5 text-primary" fill="currentColor" viewBox="0 -960 960 960"><path d="M798-120q-125 0-247-54.5T329-329Q229-429 174.5-551T120-798q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T387-387q31 31 65.5 58.5T524-281l98-97q9-9 20-11t27 1l140 26q13 2 22.5 13t9.5 25v162q0 18-12 30t-30 12Z" /></svg>
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
                    type="date" required min={new Date().toLocaleDateString('en-CA', { timeZone: 'Atlantic/Canary' })} value={formData.date} onChange={e => {
                      const newDate = e.target.value;
                      handleChange('date', newDate);
                      const times = getAvailableTimes(newDate);
                      if (times.length > 0 && !times.includes(formData.time)) {
                        handleChange('time', times[0]);
                      }
                    }} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-white/5 pb-5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600 dark:text-slate-300">Hora <span className="text-primary">*</span></label>
                  <div className="relative">
                    <select className="bg-transparent w-full text-lg font-light text-slate-900 dark:text-white border-none focus:ring-0 p-0 appearance-none cursor-pointer"
                      required value={formData.time} onChange={e => handleChange('time', e.target.value)}>
                      {getAvailableTimes(formData.date).length > 0 ? (
                        getAvailableTimes(formData.date).map(t => <option key={t} value={t}>{t} h</option>)
                      ) : (
                        <option value="">Cerrado este día</option>
                      )}
                    </select>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-primary">
                      <svg className="size-5" fill="currentColor" viewBox="0 -960 960 960"><path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z" /></svg>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-white/5 pb-5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600 dark:text-slate-300">Invitados</label>
                  <div className="relative">
                    <select className="bg-transparent w-full text-lg font-light text-slate-900 dark:text-white border-none focus:ring-0 p-0 appearance-none cursor-pointer"
                      value={formData.guests} onChange={e => handleChange('guests', e.target.value)}>
                      <option value="1">1 Persona</option>
                      <option value="2">2 Personas</option>
                      <option value="3">3 Personas</option>
                      <option value="4">4 Personas</option>
                      <option value="5">5 Personas</option>
                      <option value="6">6 Personas</option>
                      <option value="7">7 Personas</option>
                      <option value="8">8 Personas</option>
                      <option value="9">Más de 8 (contactar)</option>
                    </select>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-primary">
                      <svg className="size-5" fill="currentColor" viewBox="0 -960 960 960"><path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z" /></svg>
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
                      <option>Mesas altas</option>
                      <option>Terraza exterior</option>
                    </select>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-primary">
                      <svg className="size-5" fill="currentColor" viewBox="0 -960 960 960"><path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z" /></svg>
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

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <input type="checkbox" id="policies" required className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary/20 bg-slate-50 dark:bg-white/5 dark:border-white/10"
                  checked={formData.acceptPolicies} onChange={e => handleChange('acceptPolicies', e.target.checked)} />
                <label htmlFor="policies" className="text-xs font-light text-slate-600 dark:text-slate-300 cursor-pointer">
                  He leído y acepto los <a href="/aviso-legal" target="_blank" className="text-primary hover:underline font-medium">Términos y Condiciones</a> y la <a href="/privacidad" target="_blank" className="text-primary hover:underline font-medium">Política de Privacidad</a> *
                </label>
              </div>

              <div className="pt-6">
                {formData.guests === '9' ? (
                  <div className="space-y-4">
                    <p className="text-amber-500 dark:text-amber-400 text-sm font-medium text-center mb-4">
                      Para grupos de más de 8 personas, por favor contacta directamente con nosotros:
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <a href="tel:+34928584422" className="flex-1 h-16 flex items-center justify-center gap-3 bg-slate-900 dark:bg-white/10 hover:bg-slate-800 dark:hover:bg-white/20 text-white rounded-2xl transition-all shadow-xl font-bold uppercase tracking-wider text-sm">
                        <svg className="size-5" fill="currentColor" viewBox="0 -960 960 960"><path d="M798-120q-125 0-247-54.5T329-329Q229-429 174.5-551T120-798q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T387-387q31 31 65.5 58.5T524-281l98-97q9-9 20-11t27 1l140 26q13 2 22.5 13t9.5 25v162q0 18-12 30t-30 12Z"/></svg>
                        Llamar ahora
                      </a>
                      <a href="https://wa.me/34928584422" target="_blank" rel="noopener noreferrer" className="flex-1 h-16 flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl transition-all shadow-xl shadow-emerald-500/20 font-bold uppercase tracking-wider text-sm">
                        <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.319 1.592 5.548 0 10.058-4.51 10.06-10.058 0-2.693-1.047-5.225-2.951-7.13-1.905-1.903-4.434-2.952-7.128-2.952-5.55 0-10.061 4.51-10.062 10.059 0 2.112.566 4.166 1.634 5.923l-1.073 3.918 4.141-1.085zM17.47 15.39c-.313-.156-1.854-.914-2.141-1.018-.287-.104-.497-.156-.705.156-.208.312-.807 1.018-.989 1.226-.182.208-.364.234-.677.078-.313-.156-1.32-.486-2.515-1.55-.93-.829-1.558-1.854-1.74-2.165-.182-.313-.02-.481.137-.637.141-.14.313-.364.469-.546.156-.182.208-.312.313-.52.104-.208.052-.39-.026-.546-.078-.156-.705-1.7-.966-2.329-.254-.613-.513-.53-.705-.54-.182-.008-.39-.011-.598-.011-.208 0-.547.078-.833.39-.286.313-1.094 1.069-1.094 2.603 0 1.534 1.12 3.016 1.276 3.224.156.208 2.203 3.364 5.336 4.717.745.322 1.325.515 1.777.659.748.237 1.429.204 1.967.123.6-.091 1.854-.755 2.115-1.485.26-.73.26-1.353.182-1.485-.077-.132-.286-.208-.6-.364z"/></svg>
                        WhatsApp
                      </a>
                    </div>
                  </div>
                ) : (
                  <button type="submit" disabled={isSubmitting || !formData.acceptPolicies} className="relative w-full h-16 overflow-hidden group rounded-2xl shadow-2xl shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                    <div className="absolute inset-0 bg-primary transition-transform duration-500 group-hover:scale-110"></div>
                    <span className="relative z-10 text-white font-bold uppercase tracking-[0.3em] text-sm">
                      {isSubmitting ? 'Procesando...' : 'Realizar Reserva'}
                    </span>
                  </button>
                )}
              </div>

              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                <p className="text-xs text-center text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  Las reservas están sujetas a disponibilidad. <br /> Te contactaremos personalmente para confirmar tu solicitud.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
