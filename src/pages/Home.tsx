import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import heroImage from '../assets/elatlantePaisaje.jpg';
import AboutSlider from '../components/AboutSlider';
import { CONTACT_INFO } from '../constants/contact';
import { isRestaurantOpenNow } from '../utils/reservationUtils';



function useIsOpen() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(isRestaurantOpenNow());

    const interval = setInterval(() => {
      setIsOpen(isRestaurantOpenNow());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return isOpen;
}

export default function Home() {

  const { t, i18n } = useTranslation();
  const isOpen = useIsOpen();

  return (
    <>
      <SEO
        description="Tradición pesquera y producto Km 0 en un entorno inigualable frente al Atlántico. Disfruta del mejor pescado fresco en Las Palmas."
        ogImage="/og-image.jpg"
      />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Restaurant",
          "name": "El Atlante de San Cristóbal",
          "image": "https://elatlantedesancristobal.com/logo-icon.svg",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Calle Marina, 81",
            "addressLocality": "Las Palmas de Gran Canaria",
            "postalCode": "35001",
            "addressCountry": "ES"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 28.0934,
            "longitude": -15.4165
          },
          "url": "https://elatlantedesancristobal.com",
          "telephone": CONTACT_INFO.landline.raw,
          "servesCuisine": "Canaria, Pescado, Mariscos",
          "priceRange": "€€",
          "menu": "https://elatlantedesancristobal.com/carta",
          "description": "Restaurante especializado en pescado fresco y gastronomía canaria en San Cristóbal, Las Palmas. Tradición pesquera y producto Km 0 con terraza frente al mar.",
          "openingHoursSpecification": [
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday", "Thursday", "Friday", "Saturday"],
              "opens": "12:30",
              "closes": "23:00"
            },
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": "Sunday",
              "opens": "12:30",
              "closes": "16:30"
            }
          ]
        })}
      </script>
      {/* Hero Section */}
      <section className="@container" id="inicio">
        <div className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden"
          style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.75) 100%), url('${heroImage}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          
          {/* Subtle radial darkening behind text for extra elegance and readability */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.4)_0%,transparent_70%)] pointer-events-none z-0" />

          <div className="flex flex-col gap-6 text-center max-w-[850px] z-10 p-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-white text-3xl md:text-5xl lg:text-7xl font-serif font-extrabold leading-[1.2] md:leading-[1.1] tracking-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] max-w-4xl mx-auto"
            >
              {i18n.language.startsWith('es') ? (
                <>
                  {t('hero.titulo1_pre')}
                  <span className="canary-flag-hover cursor-default">{t('hero.titulo1_word')}</span>
                </>
              ) : (
                <>
                  <span className="canary-flag-hover cursor-default">{t('hero.titulo1_pre')}</span>
                  {t('hero.titulo1_word')}
                </>
              )} <br />
              <span className="italic font-medium opacity-90 text-white/90">
                {t('hero.titulo2')}
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-white/90 text-sm md:text-lg lg:text-xl font-light leading-relaxed max-w-3xl mx-auto drop-shadow-lg px-4 md:px-8 tracking-wide"
            >
              {t('hero.subtitulo')}
            </motion.p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4 w-full sm:w-auto">
              <Link to="/reservar" className="group flex w-full sm:w-auto cursor-pointer items-center justify-center rounded-full h-14 px-8 btn-primary-high text-xs font-black uppercase tracking-[0.15em] hover:scale-105 transition-all shadow-2xl">
                {t('hero.cta')}
              </Link>
              <a
                href={i18n.language.startsWith('en')
                  ? (document.documentElement.classList.contains('dark') ? '/assets/pdf/carta_en_dark.pdf' : '/assets/pdf/carta_en.pdf')
                  : (document.documentElement.classList.contains('dark') ? '/assets/pdf/carta_es_dark.pdf' : '/assets/pdf/carta_es.pdf')
                }
                target="_blank" rel="noopener noreferrer" className="group flex w-full sm:w-auto cursor-pointer items-center justify-center rounded-full h-12 px-7 border border-white/30 text-white/70 hover:border-white/60 hover:text-white text-xs font-semibold uppercase tracking-[0.15em] hover:scale-105 transition-all backdrop-blur-sm">
                {t('hero.ctaCarta')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Bar */}
      <div className="relative z-20 bg-slate-50 dark:bg-background-dark py-10 lg:py-12 border-y border-slate-200/60 dark:border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-wrap items-center justify-center gap-x-6 md:gap-x-12 gap-y-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500 opacity-80">
            {t('hero.siguenos')}
          </span>
          <div className="flex items-center gap-10">
            <motion.a
              href="https://www.instagram.com/restaurante_elatlante"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-4 group"
            >
              <div className="size-11 flex items-center justify-center rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-400 shadow-sm group-hover:bg-gradient-to-tr group-hover:from-[#f9ce34] group-hover:via-[#ee2a7b] group-hover:to-[#6228d7] group-hover:text-white group-hover:border-transparent group-hover:shadow-xl group-hover:shadow-pink-500/20 transition-all duration-500">
                <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-slate-100 group-hover:text-[#ee2a7b] transition-colors">Instagram</span>
            </motion.a>

            <motion.a
              href="https://www.facebook.com/elatlantedesancristobal/"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-4 group"
            >
              <div className="size-11 flex items-center justify-center rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-400 shadow-sm group-hover:bg-[#1877f2] group-hover:text-white group-hover:border-[#1877f2] group-hover:shadow-xl group-hover:shadow-blue-500/20 transition-all duration-500">
                <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-slate-100 group-hover:text-[#1877f2] transition-colors">Facebook</span>
            </motion.a>
          </div>
        </div>
      </div>

      {/* About Us Section */}
      <section className="px-6 lg:px-28 pt-12 pb-20 @container overflow-hidden border-b border-slate-200/60 dark:border-white/5" id="nosotros">
        <div className="max-w-4xl mx-auto flex flex-col gap-16">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-3">
              <span className="text-primary font-bold tracking-[0.3em] uppercase text-xs">{t('nosotros.label')}</span>
              <h2 className="text-slate-900 dark:text-slate-100 text-3xl md:text-5xl font-black leading-tight tracking-tight">
                {t('nosotros.titulo')} <span className="text-primary italic">{t('nosotros.tituloDestacado')}</span> {t('nosotros.tituloFin')}
              </h2>
            </div>
            <div className="space-y-6">
              <p className="text-slate-700 dark:text-slate-300 text-lg md:text-xl leading-relaxed font-light">
                {t('nosotros.descripcion1')}
              </p>
              <div className="w-16 h-px bg-primary/40" />
              <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed font-light">
                  {t('nosotros.descripcion2')}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg leading-relaxed font-light italic">
                  {t('nosotros.descripcion3')}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full mt-16 lg:mt-24 relative">
          <AboutSlider />
        </div>
      </section>

      {/* Info & Hours */}
      <section className="py-14 md:py-20 px-6 lg:px-28 border-t border-slate-100 dark:border-white/5">
        <div className="max-w-5xl mx-auto">

          {/* Single card — horarios + ubicación */}
          <div className="bg-background-light dark:bg-white/[0.03] border border-slate-200 dark:border-white/8 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none overflow-hidden">
            <div className="flex flex-col md:flex-row">

              {/* Horarios */}
              <div className="flex-1 p-6 md:p-8 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">{t('horarios.label')}</span>
                  <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                    isOpen
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                      : 'bg-red-50 border-red-100 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'
                  }`}>
                    <span className={`size-1.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    {isOpen ? t('hero.abierto') : t('hero.cerrado')}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {[
                    { day: t('horarios.lunes'),          hours: '12:30 – 23:00', days: [1]       },
                    { day: t('horarios.martesMiercoles'), hours: t('horarios.cerrado'), days: [2, 3], muted: true },
                    { day: t('horarios.juevesSabado'),   hours: '12:30 – 23:00', days: [4, 5, 6] },
                    { day: t('horarios.domingo'),        hours: '12:30 – 16:30', days: [0]       },
                  ].map((item, idx) => {
                    const isToday = item.days.includes(new Date().getDay());
                    return (
                      <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <span className={`text-xs font-medium ${
                          isToday             ? 'text-primary dark:text-sky-400'
                          : (item as any).muted ? 'text-slate-300 dark:text-slate-600'
                          : 'text-slate-500 dark:text-slate-400'
                        }`}>{item.day}</span>
                        <span className={`text-sm tabular-nums ${
                          isToday             ? 'text-primary dark:text-sky-400 font-semibold'
                          : (item as any).muted ? 'text-slate-300 dark:text-slate-600 font-light'
                          : 'text-slate-700 dark:text-slate-300 font-light'
                        }`}>{item.hours}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5">
                  <Link
                    to="/reservar"
                    className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold uppercase tracking-[0.2em] hover:opacity-90 transition-opacity"
                  >
                    {t('horarios.reserveBtn')}
                    <svg className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px bg-slate-100 dark:bg-white/5" />
              <div className="md:hidden h-px bg-slate-100 dark:bg-white/5" />

              {/* Ubicación */}
              <div className="flex-1 p-6 md:p-8 flex flex-col gap-5 justify-center">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">{t('contacto.ubicacionLabel')}</span>

                <div>
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug">{CONTACT_INFO.address.street}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-light mt-0.5">{CONTACT_INFO.address.city}</p>
                </div>

                <a
                  href={isOpen ? CONTACT_INFO.landline.link : CONTACT_INFO.mobile.link}
                  className="text-xl font-semibold text-slate-900 dark:text-slate-100 hover:text-primary dark:hover:text-sky-400 transition-colors tracking-tight"
                >
                  {isOpen ? CONTACT_INFO.landline.display : CONTACT_INFO.mobile.display}
                </a>

                <a
                  href="https://www.google.com/maps/search/?api=1&query=Restaurante+El+Atlante+de+San+Cristobal+Las+Palmas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-primary dark:hover:text-sky-400 transition-colors"
                >
                  <svg className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {t('contacto.verRuta')}
                </a>
              </div>

            </div>
          </div>

        </div>
      </section>



    </>
  );
}
