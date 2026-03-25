import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { addReservation, getReservationById, type Reservation } from '../services/reservationStore';
import GuestCounter from '../components/GuestCounter';
import Calendar from '../components/Calendar';
import CustomSelect from '../components/CustomSelect';
import SEO from '../components/SEO';
import { getAvailableTimes, isDateValid, getTodayDateString, isDayClosed, isRestaurantOpenNow, isReservationTimeValid, getDefaultReservationDateTime } from '../utils/reservationUtils';
import { CONTACT_INFO } from '../constants/contact';

export default function Reservations() {
  const { t, i18n } = useTranslation();
  const isOpen = isRestaurantOpenNow();
  const [searchParams] = useSearchParams();
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastReservation, setLastReservation] = useState<Reservation | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const defaultDateTime = getDefaultReservationDateTime();
  const [formData, setFormData] = useState({
    name: '', email: '', date: defaultDateTime.date, time: defaultDateTime.time,
    guests: 2, preference: 'Indiferente' as const,
    hasPet: false, notes: '', acceptPolicies: false,
  });

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

  useEffect(() => {
    const isConfirmed = searchParams.get('confirmed') === 'true';
    const reservationId = searchParams.get('id');
    const errorParam = searchParams.get('error');

    if (errorParam === 'failed_to_confirm') {
      alert(t('reservas.alerts.failedToConfirm'));
    } else if (errorParam === 'reservation_cancelled') {
      alert(t('reservas.alerts.reservationCancelled'));
    }

    if (isConfirmed && reservationId && !submitted) {
      getReservationById(reservationId).then(res => {
        if (res) {
          setLastReservation(res);
          setSubmitted(true);
        } else {
          alert(t('reservas.alerts.notFoundConfirmed'));
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
      alert(t('reservas.alerts.invalidPhone'));
      return;
    }

    if (!isDateValid(formData.date, formData.time)) {
      alert(t('reservas.alerts.restaurantClosed'));
      return;
    }

    if (!isReservationTimeValid(formData.date, formData.time)) {
      alert(t('reservas.alerts.tooSoon'));
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
        alert(t('reservas.alerts.errorProcessing'));
      }
    } catch (err: any) {
      console.error('Reservation submission error:', err);
      if (err.message === 'DUPLICATE_RESERVATION') {
        alert(t('reservas.alerts.duplicateReservation'));
      } else {
        alert(t('reservas.alerts.errorProcessingWithReason', { reason: err.message || t('reservas.alerts.unknownError') }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
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
                {lastReservation.status === 'confirmed' ? t('reservas.success.titleConfirmed') : t('reservas.success.titleRegistered')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
                {lastReservation.status === 'confirmed'
                  ? t('reservas.success.descConfirmed')
                  : t('reservas.success.descRegistered', { email: lastReservation.email })}
              </p>
            </div>
            {lastReservation.status !== 'confirmed' && (
              <p className="text-primary dark:text-coastal-sand font-medium text-xs bg-primary/5 dark:bg-white/5 py-3 px-6 rounded-full inline-block border border-primary/10">
                {t('reservas.success.confirmPlease')}
              </p>
            )}
          </div>

          {/* Booking Number Card */}
          <div className="bg-white dark:bg-white/5 rounded-3xl p-8 border border-slate-100 dark:border-white/5 text-center space-y-3 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">{t('reservas.success.locator')}</span>
            <p className="text-4xl font-serif text-primary dark:text-slate-200 tracking-widest select-all">{lastReservation.bookingNumber}</p>
          </div>

          {/* Details Card */}
          <div className="bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-3xl p-8 space-y-6 border border-slate-100 dark:border-white/5 shadow-sm">
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{t('reservas.success.guestName')}</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{lastReservation.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{t('reservas.success.contact')}</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{lastReservation.phone}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{t('reservas.success.date')}</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{formatDate(lastReservation.date)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{t('reservas.success.time')}</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{lastReservation.time} h</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{t('reservas.success.guests')}</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{lastReservation.guests} {lastReservation.guests === 1 ? t('reservas.success.person') : t('reservas.success.people')}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{t('reservas.success.location')}</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{lastReservation.preference}</p>
              </div>
            </div>

            {(lastReservation.hasPet || lastReservation.notes) && (
              <div className="pt-6 border-t border-slate-100 dark:border-white/5 space-y-4">
                {lastReservation.hasPet && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 italic">{t('reservas.success.includesPet')}</span>
                )}
                {lastReservation.notes && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block">{t('reservas.success.specialRequests')}</span>
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
                const newDefault = getDefaultReservationDateTime();
                setFormData({ name: '', email: '', date: newDefault.date, time: newDefault.time, guests: 2, preference: 'Indiferente', hasPet: false, notes: '', acceptPolicies: false });
                setPhone('');
              }}
              className="text-primary dark:text-slate-300 text-sm font-medium hover:text-coastal-sea transition-colors flex items-center gap-2 group"
            >
              <span>{t('reservas.success.makeAnother')}</span>
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
        title={t('reservas.seo.title')}
        description={t('reservas.seo.description')}
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
                <span className="text-primary/60 dark:text-slate-400 font-medium tracking-[0.4em] uppercase text-[10px]">{t('reservas.form.subtitle')}</span>
                <h1 className="text-primary dark:text-slate-100 text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-[1.1] tracking-tight">
                  <span dangerouslySetInnerHTML={{ __html: t('reservas.form.titlePart1') }} /><span className="italic text-coastal-sea opacity-90">{t('reservas.form.titlePart2')}</span>.
                </h1>
                <div className="w-16 h-px bg-primary/20"></div>
              </div>


            </div>


          </div>

          {/* Right Column: Form */}
          <div className="w-full lg:w-14/25 p-5 md:p-12 lg:p-20 relative bg-[#F9FAFB] dark:bg-transparent">

            {/* Mobile-only compact header */}
            <div className="lg:hidden mb-6">
              <span className="text-primary/60 dark:text-slate-400 font-medium tracking-[0.4em] uppercase text-[10px]">{t('reservas.form.subtitle')}</span>
              <h1 className="text-primary dark:text-slate-100 text-3xl font-serif font-bold leading-tight tracking-tight mt-1">
                <span dangerouslySetInnerHTML={{ __html: t('reservas.form.titlePart1').replace(/<br \/>/g, '') }} /><span className="italic text-coastal-sea opacity-90">{t('reservas.form.titlePart2')}</span>.
              </h1>
            </div>

            <form className="space-y-7 md:space-y-16" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7 md:gap-x-12 md:gap-y-12 items-end">
                <div className="flex flex-col gap-2 md:gap-4 group">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 group-focus-within:text-primary transition-colors">{t('reservas.form.fullName')} <span className="text-coastal-sea">*</span></label>
                  <input className="bg-transparent text-base md:text-lg font-light text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 focus:border-primary dark:focus:border-slate-400 focus:ring-0 p-0 pb-2 md:pb-3 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    placeholder={t('reservas.form.namePlaceholder')} type="text" required value={formData.name} onChange={e => handleChange('name', e.target.value)} />
                </div>
                <div className="flex flex-col gap-2 md:gap-4 group">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 group-focus-within:text-primary transition-colors">{t('reservas.form.email')} <span className="text-coastal-sea">*</span></label>
                  <input className="bg-transparent text-base md:text-lg font-light text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 focus:border-primary dark:focus:border-slate-400 focus:ring-0 p-0 pb-2 md:pb-3 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    placeholder={t('reservas.form.emailPlaceholder')} type="email" required value={formData.email} onChange={e => handleChange('email', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7 md:gap-x-12 md:gap-y-12 items-end">
                <div className="flex flex-col gap-2 md:gap-4 group">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 group-focus-within:text-primary transition-colors">{t('reservas.form.phone')} <span className="text-coastal-sea">*</span></label>
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
                <div className="flex flex-col gap-2 md:gap-4 group relative" ref={calendarRef}>
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 group-focus-within:text-primary transition-colors">{t('reservas.form.date')} <span className="text-coastal-sea">*</span></label>
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="flex justify-between items-center bg-transparent text-left text-base md:text-lg font-light text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 focus:border-primary dark:focus:border-slate-400 focus:ring-0 p-0 pb-2 transition-all w-full relative"
                  >
                    <span>{formData.date ? formatDate(formData.date) : ''}</span>
                    <svg className={`size-5 text-slate-400 transition-transform duration-300 ${showCalendar ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
                  </button>

                  <AnimatePresence>
                    {showCalendar && (
                      <>
                        {/* Mobile: full-screen modal overlay */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center p-4"
                          onClick={() => setShowCalendar(false)}
                        >
                          <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 30, scale: 0.95 }}
                            transition={{ duration: 0.25 }}
                            className="w-full max-w-sm"
                            onClick={e => e.stopPropagation()}
                          >
                            <div className="flex justify-between items-center mb-3 px-1">
                              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">{t('reservas.form.date')}</span>
                              <button
                                type="button"
                                onClick={() => setShowCalendar(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-slate-400 hover:text-white transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                            <Calendar
                              selectedDate={formData.date}
                              onSelect={(date) => {
                                handleChange('date', date);
                                const times = getAvailableTimes(date, 15);
                                if (times.length > 0 && (!formData.time || !times.includes(formData.time))) {
                                  handleChange('time', times[0]);
                                } else if (times.length === 0) {
                                  handleChange('time', '');
                                }
                                setShowCalendar(false);
                              }}
                              minDate={getTodayDateString()}
                            />
                          </motion.div>
                        </motion.div>

                        {/* Desktop: dropdown */}
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="hidden md:block absolute top-full -left-4 mt-4 z-50 overflow-hidden"
                        >
                          <Calendar
                            selectedDate={formData.date}
                            onSelect={(date) => {
                              handleChange('date', date);
                              const times = getAvailableTimes(date, 15);
                              if (times.length > 0 && (!formData.time || !times.includes(formData.time))) {
                                handleChange('time', times[0]);
                              } else if (times.length === 0) {
                                handleChange('time', '');
                              }
                              setShowCalendar(false);
                            }}
                            minDate={getTodayDateString()}
                          />
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>

                  {formData.date && isDayClosed(formData.date) && (
                    <p className="text-[10px] text-red-500 font-medium italic mt-1 animate-pulse">
                      {t('reservas.form.dateClosedError')}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-7 md:gap-x-12 md:gap-y-12">
                <div className="flex flex-col gap-2 md:gap-4 group h-full justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 group-focus-within:text-primary transition-colors">{t('reservas.form.time')} <span className="text-coastal-sea">*</span></label>
                  <div className="flex-1 flex flex-col justify-end">
                    <CustomSelect
                      value={formData.time}
                      onChange={v => handleChange('time', v)}
                      options={getAvailableTimes(formData.date, 15).map(time => ({ value: time, label: `${time} h` }))}
                      placeholder={t('reservas.form.closedThisDay')}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:gap-4 group relative h-full justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 group-focus-within:text-primary transition-colors">{t('reservas.form.guestsAmount')}</label>
                  <div className="border-b border-slate-100 dark:border-white/5 group-focus-within:border-primary dark:group-focus-within:border-slate-400 pb-2 transition-all flex-1 flex flex-col justify-end">
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
                        {t('reservas.form.groupWarning')}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-7 md:gap-x-12 md:gap-y-12 items-end">
                <div className="flex flex-col gap-2 md:gap-4 group">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 group-focus-within:text-primary transition-colors">{t('reservas.form.zonePreference')}</label>
                  <CustomSelect
                    value={formData.preference}
                    onChange={v => handleChange('preference', v)}
                    options={[
                      { value: 'Indiferente', label: t('reservas.form.zones.Indiferente') },
                      { value: 'Interior', label: t('reservas.form.zones.Interior') },
                      { value: 'Mesas altas', label: t('reservas.form.zones.Mesas altas') },
                      { value: 'Terraza exterior', label: t('reservas.form.zones.Terraza exterior') },
                    ]}
                  />
                </div>
                <div className="flex flex-col justify-end pb-3">
                  <div className="flex items-center gap-4 group cursor-pointer" onClick={() => handleChange('hasPet', !formData.hasPet)}>
                    <div className={`w-10 h-6 rounded-full relative transition-all duration-300 ${formData.hasPet ? 'bg-coastal-sea' : 'bg-slate-200 dark:bg-white/10'}`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${formData.hasPet ? 'translate-x-4' : ''}`}></div>
                    </div>
                    <label className="text-sm font-light text-slate-600 dark:text-slate-400 cursor-pointer">{t('reservas.form.withPet')}</label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 md:gap-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">{t('reservas.form.additionalNotes')}</label>
                <textarea className="bg-slate-50/50 dark:bg-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 text-sm md:text-base font-light text-slate-900 dark:text-white border border-slate-100 dark:border-white/5 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none"
                  placeholder={t('reservas.form.notesPlaceholder')} rows={2} value={formData.notes} onChange={e => handleChange('notes', e.target.value)}></textarea>
              </div>

              <div className="space-y-5 md:space-y-8 pt-2 md:pt-8">
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="policies" required className="mt-0.5 md:mt-1 w-6 h-6 md:w-5 md:h-5 shrink-0 cursor-pointer rounded border-slate-300 text-primary focus:ring-primary/20 bg-slate-50 dark:bg-white/5 dark:border-white/10 transition-all hover:ring-2 hover:ring-primary/20"
                    checked={formData.acceptPolicies} onChange={e => handleChange('acceptPolicies', e.target.checked)} />
                  <label htmlFor="policies" className="text-[11px] font-light text-slate-500 dark:text-slate-400 leading-relaxed cursor-pointer select-none">
                    {t('reservas.form.acceptTerms1')}<a href="/aviso-legal" target="_blank" className="text-primary dark:text-sky-400 hover:text-coastal-sea underline underline-offset-2 relative z-10">{t('reservas.form.terms')}</a>{t('reservas.form.acceptTerms2')}<a href="/privacidad" target="_blank" className="text-primary dark:text-sky-400 hover:text-coastal-sea underline underline-offset-2 relative z-10">{t('reservas.form.privacy')}</a>{t('reservas.form.acceptTerms3')}
                  </label>
                </div>

                <div>
                  {formData.guests >= 9 ? (
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-8 rounded-3xl border border-amber-100/50 dark:border-amber-900/10 space-y-6">
                      <p className="text-amber-800 dark:text-amber-300 text-sm font-medium text-center">
                        {t('reservas.form.groupLargeMsg')}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <a href={isOpen ? CONTACT_INFO.landline.link : CONTACT_INFO.mobile.link} className="flex-1 h-14 flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white rounded-2xl transition-all shadow-lg font-bold uppercase tracking-widest text-[11px]">
                          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" /></svg>
                          {t('reservas.form.call')}
                        </a>
                        <a href={CONTACT_INFO.whatsapp.link} target="_blank" rel="noopener noreferrer" className="flex-1 h-14 flex items-center justify-center gap-3 border border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all font-bold uppercase tracking-widest text-[11px]">
                          {t('reservas.form.whatsapp')}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <button type="submit" disabled={isSubmitting || !formData.acceptPolicies} className="w-full h-14 md:h-16 rounded-xl md:rounded-2xl btn-primary-high disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                      <span className="relative z-10 font-bold uppercase tracking-[0.4em] text-[11px]">
                        {isSubmitting ? t('reservas.form.processing') : t('reservas.form.confirmBtn')}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2 md:pt-8 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-medium leading-loose">
                  {t('reservas.form.disclaimer1')}<br />
                  {t('reservas.form.disclaimer2')}
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
