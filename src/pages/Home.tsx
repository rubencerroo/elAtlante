import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

  const { t } = useTranslation();
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
                <a href="#carta" className="group flex min-w-[150px] cursor-pointer items-center justify-center rounded-full h-14 px-8 btn-vibrant-blue text-xs font-black uppercase tracking-[0.15em] hover:scale-105 transition-all shadow-xl">
                  {t('hero.ctaCarta')}
                </a>
              </div>
            </div>
          </div>
      </section>

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

      {/* Info & Hours - Integrated Layout */}
      <section className="py-24 lg:py-32 px-6 lg:px-28 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <div className="space-y-10">
            <div className="mb-8">
              <h1 className="text-primary font-bold tracking-[0.4em] uppercase text-[10px]">{t('horarios.label')}</h1>
            </div>
            
            <div className="space-y-0 divide-y divide-slate-100 dark:divide-white/5">
              {[
                { day: t('horarios.lunes'), hours: '12:30 - 23:00' },
                { day: t('horarios.martesMiercoles'), hours: t('horarios.cerrado'), highlight: true },
                { day: t('horarios.juevesSabado'), hours: '12:30 - 23:00' },
                { day: t('horarios.domingo'), hours: '12:30 - 16:30' }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-5 first:pt-0">
                  <span className={`font-bold uppercase tracking-wider text-sm ${item.highlight ? 'text-primary' : 'text-slate-900 dark:text-slate-100'}`}>{item.day}</span>
                  <span className={`font-normal text-lg ${item.highlight ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>{item.hours}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:pl-16 lg:border-l border-slate-100 dark:border-white/5">
            <div className="space-y-14">
              <div>
                <span className="text-slate-400 font-bold tracking-widest uppercase text-[10px] mb-4 block">{t('contacto.ubicacionLabel')}</span>
                <p className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-snug" style={{ whiteSpace: 'pre-line' }}>
                  {t('contacto.direccion')}
                </p>
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=El+Atlante+San+Cristobal+Las+Palmas" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-block mt-8 px-6 py-3 bg-slate-900 dark:bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-all"
                >
                  {t('contacto.verRuta')}
                </a>
              </div>

              <div>
                <span className="text-slate-400 font-bold tracking-widest uppercase text-[10px] mb-4 block">{t('contacto.contactoLabel')}</span>
                <p className="text-2xl md:text-3xl font-black tracking-tight text-primary">
                  {isOpen ? CONTACT_INFO.landline.display : CONTACT_INFO.mobile.display}
                </p>
                <div className="flex gap-8 mt-6">
                   <a 
                     href="https://www.instagram.com/restaurante_elatlante" 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="text-slate-500 hover:text-primary transition-colors font-bold uppercase tracking-widest text-xs"
                   >
                     Instagram
                   </a>
                   <a 
                     href="https://www.facebook.com/elatlantedesancristobal/" 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="text-slate-500 hover:text-primary transition-colors font-bold uppercase tracking-widest text-xs"
                   >
                     Facebook
                   </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


    </>
  );
}
