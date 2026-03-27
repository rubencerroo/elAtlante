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
            <h1 
              className="text-white text-3xl md:text-5xl lg:text-7xl font-serif font-extrabold leading-[1.2] md:leading-[1.1] tracking-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] max-w-4xl mx-auto"
            >
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="inline-block"
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
                )}
              </motion.span>
              <br />
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                className="italic font-medium opacity-90 text-white/90 inline-block"
              >
                {t('hero.titulo2')}
              </motion.span>
            </h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-white/90 text-sm md:text-lg lg:text-xl font-light leading-relaxed max-w-3xl mx-auto drop-shadow-lg px-4 md:px-8 tracking-wide"
            >
              {t('hero.subtitulo')}
            </motion.p>
            <div className="flex flex-wrap gap-4 justify-center mt-4 w-full sm:w-auto">
              <Link to="/reservar" className="group flex w-full sm:w-auto min-w-[180px] cursor-pointer items-center justify-center rounded-full h-12 px-7 btn-primary-high text-xs font-bold uppercase tracking-[0.15em] hover:scale-105 transition-all shadow-2xl">
                {t('hero.cta')}
              </Link>
              <a
                href={i18n.language.startsWith('en')
                  ? (document.documentElement.classList.contains('dark') ? '/assets/pdf/carta_en_dark.pdf' : '/assets/pdf/carta_en.pdf')
                  : (document.documentElement.classList.contains('dark') ? '/assets/pdf/carta_es_dark.pdf' : '/assets/pdf/carta_es.pdf')
                }
                target="_blank" rel="noopener noreferrer" 
                className="group flex w-full sm:w-auto min-w-[180px] cursor-pointer items-center justify-center rounded-full h-12 px-7 border border-white/30 text-white/70 hover:border-white/60 hover:text-white text-xs font-bold uppercase tracking-[0.15em] hover:scale-105 transition-all backdrop-blur-sm"
              >
                {t('hero.ctaCarta')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Bar */}
      <div className="relative z-20 bg-slate-50 dark:bg-background-dark py-10 lg:py-12 border-y border-slate-200/60 dark:border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
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

      {/* Info & Hours - Abyssal Elegance (Stitch Design) */}
      <section className="pt-16 pb-32 px-6 lg:px-28 bg-[#FBFBF9] dark:bg-background-dark relative overflow-hidden">
        {/* Editorial Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[40%] h-[120%] bg-slate-50 dark:bg-white/[0.02] -z-10 translate-x-1/4 -skew-x-12 border-l border-slate-100 dark:border-white/5" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-x-24 lg:gap-y-20">

            {/* Hours Block - FIRST on Mobile */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-7 order-1 lg:order-2 space-y-8"
            >
              <div className="flex items-center gap-4 pb-4">
                <span className="text-primary dark:text-sky-400 font-bold tracking-[0.5em] uppercase text-[12px]">{t('horarios.label')}</span>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${isOpen ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-red-50 border-red-100 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'}`}>
                  <span className={`size-1 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  {isOpen ? t('hero.abierto') : t('hero.cerrado')}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
                {[
                  { day: t('horarios.lunes'), hours: '12:30 - 23:00', days: [1] },
                  { day: t('horarios.martesMiercoles'), hours: t('horarios.cerrado'), days: [2, 3] },
                  { day: t('horarios.juevesSabado'), hours: '12:30 - 23:00', days: [4, 5, 6] },
                  { day: t('horarios.domingo'), hours: '12:30 - 16:30', days: [0] }
                ].map((item, idx) => {
                  const currentDay = new Date().getDay();
                  const isToday = item.days.includes(currentDay);
                  return (
                    <div key={idx} className="space-y-1 group">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3 transition-colors group-hover:border-primary">
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isToday ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
                          {item.day}
                        </span>
                        {isToday && <span className="size-1 bg-primary rounded-full"></span>}
                      </div>
                      <div className={`text-xl font-light pt-2 transition-all duration-300 group-hover:pl-1 ${isToday ? 'text-primary italic font-medium' : 'text-slate-800 dark:text-slate-200'}`}>
                        {item.hours}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Map Column - SECOND on Mobile, LEFT on Desktop */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-5 lg:row-span-2 order-2 lg:order-1 flex flex-col gap-10"
            >
              <div className="space-y-6">


                <div className="relative w-full h-[300px] md:h-[360px] mt-8 rounded-3xl overflow-hidden shadow-[0_15px_40px_-15px_rgba(0,0,0,0.15)] border border-slate-200 dark:border-white/10 group transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] hover:border-slate-300 dark:hover:border-white/20">
                  {/* Tint Overlay to match site aesthetic */}
                  <div className="absolute inset-0 bg-primary/5 dark:bg-accent-blue/10 pointer-events-none mix-blend-multiply dark:mix-blend-color z-10 transition-opacity duration-700 opacity-100 group-hover:opacity-0 ring-1 ring-inset ring-black/5 dark:ring-white/5"></div>

                  {/* Hide Google Maps UI by boldly pushing negative margins - specifically top to hide reviews */}
                  <div className="absolute -top-[125px] -left-[40px] w-[calc(100%+80px)] h-[calc(100%+170px)] md:-top-[140px] md:h-[calc(100%+190px)] pointer-events-none">
                    <iframe
                      title="Mapa de ubicación de Google"
                      src="https://maps.google.com/maps?q=Restaurante+El+Atlante+de+San+Cristóbal,+Las+Palmas&t=&z=16&ie=UTF8&iwloc=&output=embed"
                      className="w-full h-full grayscale-[40%] sepia-[15%] opacity-90 dark:invert dark:grayscale-[20%] dark:hue-rotate-[190deg] dark:contrast-[110%] dark:brightness-95 dark:opacity-85 transition-all duration-700 ease-in-out group-hover:grayscale-0 group-hover:sepia-0 group-hover:opacity-100 dark:group-hover:invert-0 dark:group-hover:hue-rotate-0 dark:group-hover:brightness-100 dark:group-hover:contrast-100"
                      style={{ border: 0 }}
                      allowFullScreen={false}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade">
                    </iframe>
                  </div>

                  {/* Elegant Floating Badge (Always Visible, Centered Bottom) */}
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Restaurante+El+Atlante+de+San+Cristobal+Las+Palmas"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-5 left-1/2 -translate-x-1/2 w-max max-w-[90%] z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-5 py-3 rounded-full shadow-xl border border-slate-200 dark:border-white/10 text-[10px] md:text-xs font-black uppercase tracking-[0.15em] text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2.5 transition-all duration-500 ease-out hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:border-primary hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <svg className="size-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span className="truncate">{t('contacto.verRuta', 'VER RUTA EN GOOGLE MAPS')}</span>
                  </a>
                </div>
              </div>

              <div className="pt-6">
                <Link to="/reservar" className="group inline-flex items-center gap-4 text-slate-900 dark:text-white">
                  <div className="size-14 bg-slate-900 dark:bg-white flex items-center justify-center transition-transform group-hover:scale-110">
                    <svg className="size-5 text-white dark:text-slate-900" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.3em] group-hover:text-primary transition-colors">
                    {t('horarios.reserveBtn')}
                  </span>
                </Link>
              </div>
            </motion.div>

            {/* Contact Info - THIRD on Mobile */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-12 order-3 lg:order-3"
            >
              <div className="space-y-4">
                <span className="text-slate-400 dark:text-slate-500 font-bold tracking-[0.4em] uppercase text-[9px] block">
                  {t('contacto.ubicacionLabel')}
                </span>
                <h3 className="text-2xl font-serif text-slate-900 dark:text-slate-100 leading-tight">
                  {t('contacto.direccion')}
                </h3>

              </div>

              <div className="space-y-4">
                <span className="text-slate-400 dark:text-slate-500 font-bold tracking-[0.4em] uppercase text-[9px] block">
                  {t('contacto.contactoLabel')}
                </span>
                <a
                  href={isOpen ? CONTACT_INFO.landline.link : CONTACT_INFO.mobile.link}
                  className="text-2xl font-serif text-slate-900 dark:text-slate-100 hover:text-primary transition-colors block leading-tight"
                >
                  {isOpen ? CONTACT_INFO.landline.display : CONTACT_INFO.mobile.display}
                </a>
                <div className="flex gap-4 pt-1">
                  <a href="https://www.instagram.com/restaurante_elatlante" target="_blank" rel="noopener noreferrer" aria-label="Síguenos en Instagram" className="text-slate-300 hover:text-pink-500 transition-colors">
                    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                  </a>
                  <a href="https://www.facebook.com/elatlantedesancristobal/" target="_blank" rel="noopener noreferrer" aria-label="Síguenos en Facebook" className="text-slate-300 hover:text-blue-500 transition-colors">
                    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


    </>
  );
}
