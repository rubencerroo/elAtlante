import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { addReservation, getReservationById, type Reservation } from '../services/reservationStore';
import GuestCounter from '../components/GuestCounter';
import SEO from '../components/SEO';
import { getAvailableTimes, isDateValid, getTodayDateString, isDayClosed, isRestaurantOpenNow } from '../utils/reservationUtils';
import { CONTACT_INFO } from '../constants/contact';

export default function Reservations() {
  const isOpen = isRestaurantOpenNow();
  const [searchParams] = useSearchParams();
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastReservation, setLastReservation] = useState<Reservation | null>(null);
  const [formData, setFormData] = useState({
    name: '', email: '', date: '', time: '13:00',
    guests: 2, preference: 'Indiferente' as const,
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

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    try {
      const reservation = await addReservation({
        name: formData.name,
        email: formData.email,
        phone,
        date: formData.date,
        time: formData.time,
        guests: formData.guests,
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
      console.error('Reservation submission error:', err);
      if (err.message === 'DUPLICATE_RESERVATION') {
        alert('Ya tienes una reserva para esta misma fecha y hora. Si necesitas modificarla, por favor contáctanos por teléfono.');
      } else {
        alert(`Hubo un error al procesar tu reserva: ${err.message || 'Error desconocido'}. Por favor, inténtalo de nuevo.`);
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
      <div className="min-h-screen pt-28 pb-24 px-6 lg:px-28 flex flex-col items-center justify-center bg-background-light dark:bg-background-dark relative overflow-hidden font-sans">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-coastal-sea/5 rounded-full blur-[100px] -z-10"></div>

        <div className="max-w-lg w-full space-y-10">
          {/* Success Header */}
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-coastal-sea/10 flex items-center justify-center animate-[pulse_3s_ease-in-out_infinite]">
              <svg className="w-12 h-12 text-coastal-sea" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-primary dark:text-white text-3xl font-serif font-bold">
                {lastReservation.status === 'confirmed' ? '¡Reserva confirmada!' : '¡Reserva registrada!'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
                {lastReservation.status === 'confirmed'
                  ? 'Tu mesa está asegurada. Prepárate para una experiencia inolvidable frente al mar.'
                  : `Hemos enviado un correo a su bandeja de entrada (${lastReservation.email}) para confirmar su asistencia.`}
              </p>
            </div>
            {lastReservation.status !== 'confirmed' && (
              <p className="text-primary dark:text-coastal-sand font-medium text-xs bg-primary/5 dark:bg-white/5 py-3 px-6 rounded-full inline-block border border-primary/10">
                Por favor, confirme su reserva pulsando el botón en el correo.
              </p>
            )}
          </div>

          {/* Booking Number Card */}
          <div className="bg-white dark:bg-white/5 rounded-3xl p-8 border border-slate-100 dark:border-white/5 text-center space-y-3 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Localizador de Reserva</span>
            <p className="text-4xl font-serif text-primary dark:text-slate-200 tracking-widest select-all">{lastReservation.bookingNumber}</p>
          </div>

          {/* Details Card */}
          <div className="bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-3xl p-8 space-y-6 border border-slate-100 dark:border-white/5 shadow-sm">
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Comensal</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{lastReservation.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Contacto</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{lastReservation.phone}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Fecha</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{formatDate(lastReservation.date)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Horario</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{lastReservation.time} h</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Invitados</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{lastReservation.guests} {lastReservation.guests === 1 ? 'persona' : 'personas'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Ubicación</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{lastReservation.preference}</p>
              </div>
            </div>

            {(lastReservation.hasPet || lastReservation.notes) && (
              <div className="pt-6 border-t border-slate-100 dark:border-white/5 space-y-4">
                {lastReservation.hasPet && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 italic">🐾 Incluye mascota en la reserva</span>
                )}
                {lastReservation.notes && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block">Peticiones especiales</span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{lastReservation.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center pt-4">
            <button
              onClick={() => {
                setSubmitted(false);
                setLastReservation(null);
                setFormData({ name: '', email: '', date: '', time: '13:00', guests: 2, preference: 'Indiferente', hasPet: false, notes: '', acceptPolicies: false });
                setPhone('');
              }}
              className="text-primary dark:text-slate-300 text-sm font-medium hover:text-coastal-sea transition-colors flex items-center gap-2 group"
            >
              <span>Realizar otra reserva</span>
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 md:pt-28 pb-12 md:pb-24 flex flex-col items-center bg-background-light dark:bg-background-dark relative overflow-hidden font-sans">
      <SEO
        title="Reservar Mesa"
        description="Reserva tu mesa online en El Atlante de San Cristóbal. Disfruta de la mejor gastronomía marinera frente al mar en Las Palmas."
        canonical="/reservar"
      />

      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] -z-10 opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-coastal-sea/5 rounded-full blur-[120px] -z-10 opacity-60"></div>

      <div className="max-w-7xl w-full relative z-10 px-4 md:px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row gap-0 items-stretch">

          {/* Left Column: Visual & Info — hidden on mobile */}
          <div className="hidden lg:flex lg:w-11/25 relative p-12 lg:p-20 flex-col justify-between overflow-hidden">
            {/* Texture/Overlay */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-primary/5 dark:bg-primary/20 mix-blend-multiply"></div>
              <img
                src="https://images.unsplash.com/photo-1551244072-5d12893278ab?auto=format&fit=crop&q=80&w=1200"
                alt="Coastal texture"
                className="w-full h-full object-cover opacity-30 grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background-light/80 to-background-light dark:via-background-dark/80 dark:to-background-dark"></div>
            </div>

            <div className="space-y-12 relative z-10">
              <div className="space-y-6">
                <span className="text-primary/60 dark:text-slate-400 font-medium tracking-[0.4em] uppercase text-[10px]">Reservaciones</span>
                <h1 className="text-primary dark:text-slate-100 text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-[1.1] tracking-tight">
                  Tu mesa <br />en el <span className="italic text-coastal-sea opacity-90">Atlántico</span>.
                </h1>
                <div className="w-16 h-px bg-primary/20"></div>
              </div>


            </div>


          </div>

          {/* Right Column: Form */}
          <div className="w-full lg:w-14/25 p-5 md:p-12 lg:p-20 relative bg-[#F9FAFB] dark:bg-transparent">

            {/* Mobile-only compact header */}
            <div className="lg:hidden mb-6">
              <span className="text-primary/60 dark:text-slate-400 font-medium tracking-[0.4em] uppercase text-[10px]">Reservaciones</span>
              <h1 className="text-primary dark:text-slate-100 text-3xl font-serif font-bold leading-tight tracking-tight mt-1">
                Tu mesa en el <span className="italic text-coastal-sea opacity-90">Atlántico</span>.
              </h1>
            </div>

            <form className="space-y-7 md:space-y-16" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7 md:gap-x-12 md:gap-y-12">
                <div className="flex flex-col gap-2 md:gap-4 group">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 group-focus-within:text-primary transition-colors">Nombre Completo <span className="text-coastal-sea">*</span></label>
                  <input className="bg-transparent text-base md:text-lg font-light text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 focus:border-primary dark:focus:border-slate-400 focus:ring-0 p-0 pb-2 md:pb-3 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    placeholder="Ej: Juan Pérez" type="text" required value={formData.name} onChange={e => handleChange('name', e.target.value)} />
                </div>
                <div className="flex flex-col gap-2 md:gap-4 group">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 group-focus-within:text-primary transition-colors">Email <span className="text-coastal-sea">*</span></label>
                  <input className="bg-transparent text-base md:text-lg font-light text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 focus:border-primary dark:focus:border-slate-400 focus:ring-0 p-0 pb-2 md:pb-3 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    placeholder="tu@email.com" type="email" required value={formData.email} onChange={e => handleChange('email', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7 md:gap-x-12 md:gap-y-12">
                <div className="flex flex-col gap-2 md:gap-4 group">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 group-focus-within:text-primary transition-colors">Teléfono <span className="text-coastal-sea">*</span></label>
                  <div className="border-b border-slate-100 dark:border-white/5 group-focus-within:border-primary dark:group-focus-within:border-slate-400 pb-2 transition-all">
                    <PhoneInput
                      defaultCountry="es"
                      value={phone}
                      onChange={setPhone}
                      className="phone-input-custom"
                      inputClassName="phone-input-field"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:gap-4 group relative">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 group-focus-within:text-primary transition-colors">Fecha <span className="text-coastal-sea">*</span></label>
                  <input
                    type="date"
                    required
                    min={getTodayDateString()}
                    value={formData.date}
                    onChange={e => {
                      const date = e.target.value;
                      handleChange('date', date);
                      const times = getAvailableTimes(date, 15);
                      if (times.length > 0 && !times.includes(formData.time)) {
                        handleChange('time', times[0]);
                      }
                    }}
                    className="bg-transparent text-base md:text-lg font-light text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 focus:border-primary dark:focus:border-slate-400 focus:ring-0 p-0 pb-2 transition-all w-full appearance-none"
                  />
                  {formData.date && isDayClosed(formData.date) && (
                    <p className="text-[10px] text-red-500 font-medium italic mt-1 animate-pulse">
                      El restaurante está cerrado este día. Por favor, selecciona otra fecha.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-7 md:gap-x-12 md:gap-y-12">
                <div className="flex flex-col gap-2 md:gap-4 group">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 group-focus-within:text-primary transition-colors">Hora <span className="text-coastal-sea">*</span></label>
                  <div className="relative border-b border-slate-100 dark:border-white/5 group-focus-within:border-primary dark:group-focus-within:border-slate-400 pb-3 transition-all">
                    <select className="bg-transparent w-full text-base md:text-lg font-light text-slate-900 dark:text-white border-none focus:ring-0 p-0 appearance-none cursor-pointer"
                      required value={formData.time} onChange={e => handleChange('time', e.target.value)}>
                      {getAvailableTimes(formData.date, 15).length > 0 ? (
                        getAvailableTimes(formData.date, 15).map(t => <option key={t} value={t}>{t} h</option>)
                      ) : (
                        <option value="">Cerrado este día</option>
                      )}
                    </select>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-primary/40 pointer-events-none">
                      <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:gap-4 group relative">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 group-focus-within:text-primary transition-colors">Invitados</label>
                  <div className="border-b border-slate-100 dark:border-white/5 group-focus-within:border-primary dark:group-focus-within:border-slate-400 pb-2 transition-all">
                    <GuestCounter
                      value={formData.guests}
                      onChange={n => handleChange('guests', n)}
                      max={9}
                      className="py-1"
                    />
                  </div>
                  <AnimatePresence>
                    {formData.guests >= 9 && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute -bottom-8 left-0 text-[10px] text-amber-600 font-medium italic w-full"
                      >
                        Para grupos de más de 8 personas, le recomendamos contactarnos vía telefónica.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-7 md:gap-x-12 md:gap-y-12">
                <div className="flex flex-col gap-2 md:gap-4 group">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 group-focus-within:text-primary transition-colors">Preferencia de Zona</label>
                  <div className="relative border-b border-slate-100 dark:border-white/5 group-focus-within:border-primary dark:group-focus-within:border-slate-400 pb-3 transition-all">
                    <select className="bg-transparent w-full text-base md:text-lg font-light text-slate-900 dark:text-white border-none focus:ring-0 p-0 appearance-none cursor-pointer"
                      value={formData.preference} onChange={e => handleChange('preference', e.target.value)}>
                      <option>Indiferente</option>
                      <option>Interior</option>
                      <option>Mesas altas</option>
                      <option>Terraza exterior</option>
                    </select>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-primary/40 pointer-events-none">
                      <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-end pb-3">
                  <div className="flex items-center gap-4 group cursor-pointer" onClick={() => handleChange('hasPet', !formData.hasPet)}>
                    <div className={`w-10 h-6 rounded-full relative transition-all duration-300 ${formData.hasPet ? 'bg-coastal-sea' : 'bg-slate-200 dark:bg-white/10'}`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${formData.hasPet ? 'translate-x-4' : ''}`}></div>
                    </div>
                    <label className="text-sm font-light text-slate-600 dark:text-slate-400 cursor-pointer">Vengo con mascota</label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 md:gap-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Notas Adicionales</label>
                <textarea className="bg-slate-50/50 dark:bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 text-sm md:text-base font-light text-slate-900 dark:text-white border border-slate-100 dark:border-white/5 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none"
                  placeholder="¿Alguna alergia o preferencia especial?" rows={2} value={formData.notes} onChange={e => handleChange('notes', e.target.value)}></textarea>
              </div>

              <div className="space-y-5 md:space-y-8 pt-2 md:pt-8">
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="policies" required className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 bg-slate-50 dark:bg-white/5 dark:border-white/10"
                    checked={formData.acceptPolicies} onChange={e => handleChange('acceptPolicies', e.target.checked)} />
                  <label htmlFor="policies" className="text-[11px] font-light text-slate-500 dark:text-slate-400 leading-relaxed cursor-pointer">
                    He leído y acepto los <a href="/aviso-legal" target="_blank" className="text-primary dark:text-sky-400 hover:text-coastal-sea underline underline-offset-2">Términos y Condiciones</a> y la <a href="/privacidad" target="_blank" className="text-primary dark:text-sky-400 hover:text-coastal-sea underline underline-offset-2">Política de Privacidad</a> *
                  </label>
                </div>

                <div>
                  {formData.guests >= 9 ? (
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-8 rounded-3xl border border-amber-100/50 dark:border-amber-900/10 space-y-6">
                      <p className="text-amber-800 dark:text-amber-300 text-sm font-medium text-center">
                        Para grupos de más de 8 personas, por favor contacte directamente con el restaurante para asegurar su mesa:
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <a href={isOpen ? CONTACT_INFO.landline.link : CONTACT_INFO.mobile.link} className="flex-1 h-14 flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white rounded-2xl transition-all shadow-lg font-bold uppercase tracking-widest text-[11px]">
                          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" /></svg>
                          Llamar
                        </a>
                        <a href={CONTACT_INFO.whatsapp.link} target="_blank" rel="noopener noreferrer" className="flex-1 h-14 flex items-center justify-center gap-3 border border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all font-bold uppercase tracking-widest text-[11px]">
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  ) : (
                    <button type="submit" disabled={isSubmitting || !formData.acceptPolicies} className="w-full h-14 md:h-16 rounded-xl md:rounded-2xl btn-primary-high disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                      <span className="relative z-10 font-bold uppercase tracking-[0.4em] text-[11px]">
                        {isSubmitting ? 'Procesando...' : 'Confirmar Reserva'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2 md:pt-8 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-medium leading-loose">
                  Las solicitudes online están sujetas a confirmación.<br />
                  Le enviaremos un email tan pronto como procesemos su mesa.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
