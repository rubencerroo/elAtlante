import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import heroImage from '../assets/elatlantePaisaje.jpg';
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
        title="Sabor del Mar en San Cristóbal"
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
          "priceRange": "$$",
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
               style={{backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%), url('${heroImage}')`, backgroundSize: 'cover', backgroundPosition: 'center'}}>

            
            {/* Open/closed badge – floating */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20">
              <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full backdrop-blur-md border shadow-sm ${isOpen ? 'bg-emerald-500/30 border-emerald-400/40 text-emerald-200' : 'bg-red-500/30 border-red-400/40 text-red-200'}`}>
                <span className={`size-2 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                {isOpen ? t('hero.abierto') : t('hero.cerrado')}
              </span>
            </div>
            <div className="flex flex-col gap-6 text-center max-w-[850px] z-10 p-4">
              <h1 className="text-white text-4xl md:text-6xl lg:text-7xl font-serif font-extrabold leading-tight tracking-tight drop-shadow-2xl">
                {t('hero.titulo1')} <br/>
                <span className="italic opacity-90">{t('hero.titulo2')}</span>
              </h1>
              <p className="text-white/95 text-base md:text-xl font-light leading-relaxed max-w-2xl mx-auto drop-shadow-lg">
                {t('hero.subtitulo')}
              </p>
              <div className="flex flex-wrap gap-4 justify-center mt-4">
                <Link to="/reservar" className="group flex min-w-[180px] cursor-pointer items-center justify-center rounded-full h-14 px-8 btn-primary-high text-xs font-black uppercase tracking-[0.15em] hover:scale-105 transition-all shadow-2xl">
                  {t('hero.cta')}
                </Link>
                <a 
                  href={i18n.language.startsWith('en') 
                    ? (document.documentElement.classList.contains('dark') ? '/assets/pdf/carta_en_dark.pdf' : '/assets/pdf/carta_en.pdf')
                    : (document.documentElement.classList.contains('dark') ? '/assets/pdf/carta_es_dark.pdf' : '/assets/pdf/carta_es.pdf')
                  } 
                  target="_blank" rel="noopener noreferrer" className="group flex min-w-[150px] cursor-pointer items-center justify-center rounded-full h-14 px-8 btn-vibrant-blue text-xs font-black uppercase tracking-[0.15em] hover:scale-105 transition-all shadow-xl">
                  {t('hero.ctaCarta')}
                </a>
              </div>
            </div>
          </div>
      </section>
      
      {/* Social Media Bar */}
      <div className="relative z-20 bg-slate-50 dark:bg-background-dark py-12 lg:py-16 border-t border-slate-200 dark:border-white/10">
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
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
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
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-slate-100 group-hover:text-[#1877f2] transition-colors">Facebook</span>
            </motion.a>
          </div>
        </div>
      </div>

      {/* About Us Section */}
      <section className="px-6 lg:px-28 py-24 @container overflow-hidden" id="nosotros">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1 w-full relative">
            <div className="aspect-[16/10] rounded-2xl md:rounded-[2.5rem] bg-cover bg-center shadow-[0_30px_80px_-15px_rgba(0,0,0,0.25)] border border-white dark:border-white/5" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDHN_4hnzs64uVTD9pNvyjzMd0gmF4u7d9jlcgGRfAeXVF6xYmg615NSyZS8rGp-W024Q6a7_VHAgETZykcP6iOmw5Q_bM7W4ySND3PfvJ0dKZeFEnZF7doKn5ut9QjDorkWL-tX8aPlHIukSpo6etujfLfe3dPBQuh8rfJoeS4UG_U9KSG3Y8sWtncAfSc0vaVFDKhnSKbOSMbQEx7lxCR4ub3_jIV_J89xZN_YklPuNB5zQlixYXbykzNRiO5ihIRGpKeVAtcraQ')"}}></div>
          </div>
          <div className="flex flex-col gap-8 flex-1">
            <div className="flex flex-col gap-3">
              <span className="text-primary font-bold tracking-[0.3em] uppercase text-xs">{t('nosotros.label')}</span>
              <h2 className="text-slate-900 dark:text-slate-100 text-3xl md:text-4xl font-black leading-tight tracking-tight">
                {t('nosotros.titulo')} <span className="text-primary italic">{t('nosotros.tituloDestacado')}</span> {t('nosotros.tituloFin')}
              </h2>
            </div>
            <p className="text-slate-700 dark:text-slate-300 text-base md:text-lg leading-relaxed font-light">
              {t('nosotros.descripcion')}
            </p>
            <div className="space-y-8 mt-2">
              <div className="flex items-start gap-5 group">
                <div className="size-14 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner flex-shrink-0">
                  <svg className="size-7" fill="currentColor" viewBox="0 -960 960 960"><path d="M440-160v-487L216-431l-56-57 280-280 280 280-56 57-224-216v487h-80Z"/></svg>
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 uppercase tracking-tight mb-1">{t('nosotros.pilar1Titulo')}</h4>
                  <p className="text-slate-500 dark:text-slate-400 font-light text-sm max-w-sm">{t('nosotros.pilar1Desc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-5 group">
                <div className="size-14 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner flex-shrink-0">
                  <svg className="size-7" fill="currentColor" viewBox="0 -960 960 960"><path d="M280-80v-366q-51-14-85.5-56.5T160-600v-280h80v280h40v-280h80v280h40v-280h80v280q0 55-34.5 97.5T360-446v366h-80Zm400 0v-320H560v-280q0-83 58.5-141.5T760-880v800h-80Z"/></svg>
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 uppercase tracking-tight mb-1">{t('nosotros.pilar2Titulo')}</h4>
                  <p className="text-slate-500 dark:text-slate-400 font-light text-sm max-w-sm">{t('nosotros.pilar2Desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Info & Hours - Abyssal Elegance (Stitch Design) */}
      <section className="py-24 lg:py-40 px-6 lg:px-28 bg-[#FBFBF9] dark:bg-background-dark relative overflow-hidden">
        {/* Editorial Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[40%] h-[120%] bg-slate-50 dark:bg-white/[0.02] -z-10 translate-x-1/4 -skew-x-12 border-l border-slate-100 dark:border-white/5" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
            
            {/* Title & Description Column */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-5 space-y-10"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-primary dark:text-sky-400 font-bold tracking-[0.5em] uppercase text-[9px]">{t('horarios.label')}</span>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${isOpen ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-red-50 border-red-100 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'}`}>
                    <span className={`size-1 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    {isOpen ? t('hero.abierto') : t('hero.cerrado')}
                  </div>
                </div>
                <h2 className="text-5xl md:text-7xl font-serif text-slate-900 dark:text-slate-100 leading-[1.1] italic -tracking-wide">
                  {t('horarios.title')}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-light text-lg max-w-sm leading-relaxed">
                  Disfruta del auténtico sabor del Atlántico en un entorno privilegiado, donde el horizonte se funde con la gastronomía.
                </p>
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

            {/* Content Display Column */}
            <div className="lg:col-span-7 space-y-20 lg:pt-8">
              {/* Hours Grid */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
                  {[
                    { day: t('horarios.lunes'), hours: '12:30 - 23:00' },
                    { day: t('horarios.martesMiercoles'), hours: t('horarios.cerrado'), highlight: true },
                    { day: t('horarios.juevesSabado'), hours: '12:30 - 23:00' },
                    { day: t('horarios.domingo'), hours: '12:30 - 16:30' }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1 group">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3 transition-colors group-hover:border-primary">
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${item.highlight ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
                          {item.day}
                        </span>
                        {item.highlight && <span className="size-1 bg-primary rounded-full"></span>}
                      </div>
                      <div className={`text-xl font-light pt-2 transition-all duration-300 group-hover:pl-1 ${item.highlight ? 'text-primary italic font-medium' : 'text-slate-800 dark:text-slate-200'}`}>
                        {item.hours}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Contact Info */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-12"
              >
                <div className="space-y-4">
                  <span className="text-slate-400 dark:text-slate-500 font-bold tracking-[0.4em] uppercase text-[9px] block">
                    {t('contacto.ubicacionLabel')}
                  </span>
                  <h4 className="text-2xl font-serif text-slate-900 dark:text-slate-100 leading-tight">
                    {t('contacto.direccion')}
                  </h4>
                  <a 
                    href="https://www.google.com/maps/search/?api=1&query=El+Atlante+San+Cristobal+Las+Palmas" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 text-primary dark:text-sky-400 font-bold uppercase text-[9px] tracking-[0.2em] group border-b border-transparent hover:border-primary pb-1 transition-all"
                  >
                    {t('contacto.verRuta')}
                    <svg className="size-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </a>
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
                    <a href="https://www.instagram.com/restaurante_elatlante" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-pink-500 transition-colors">
                      <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                    <a href="https://www.facebook.com/elatlantedesancristobal/" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-blue-500 transition-colors">
                      <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>


    </>
  );
}
