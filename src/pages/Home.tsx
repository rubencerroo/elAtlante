import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import SEO from '../components/SEO';

interface Dish {
// ... existing Dish interface ...
  id: number;
  num: string;
  price: string;
  title: string;
  img: string;
  desc: string;
}

const DishCard = ({ dish, idx }: { dish: Dish; idx: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay: idx * 0.15, ease: [0.22, 1, 0.36, 1] }}
    className="flex flex-col gap-5 group relative"
  >
    <span className="absolute -top-6 -left-3 text-5xl font-black text-white/5 select-none z-0">{dish.num}</span>
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-slate-900/60 backdrop-blur-lg">
      <img
        className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
        src={dish.img}
        alt={dish.title}
      />
      <div className="absolute top-4 left-4 bg-primary px-4 py-1.5 rounded-full text-white font-bold text-sm shadow-xl">{dish.price}</div>
    </div>
    <div className="space-y-1.5 z-10 px-1">
      <h3 className="text-lg md:text-xl font-black tracking-tight uppercase leading-tight text-white group-hover:text-primary transition-colors">{dish.title}</h3>
      <p className="text-sm text-slate-300 font-light leading-relaxed">{dish.desc}</p>
    </div>
  </motion.div>
);

function useIsOpen() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkIsOpen = () => {
      const now = new Date();
      try {
        const optionsFormatter = new Intl.DateTimeFormat('es-ES', {
          timeZone: 'Atlantic/Canary',
          weekday: 'long',
          hour: 'numeric',
          minute: 'numeric',
          hour12: false
        });
        
        const parts = optionsFormatter.formatToParts(now);
        const day = parts.find(p => p.type === 'weekday')?.value.toLowerCase();
        const hourStr = parts.find(p => p.type === 'hour')?.value;
        const minuteStr = parts.find(p => p.type === 'minute')?.value;
        
        if (!day || !hourStr || !minuteStr) return false;
        
        const currentMinutes = parseInt(hourStr) * 60 + parseInt(minuteStr);
        
        const timeToMinutes = (timeStr: string) => {
          const [h, m] = timeStr.split(':').map(Number);
          return h * 60 + m;
        };

        let openTime = 0;
        let closeTime = 0;

        // remove accents for safe matching
        const normalizedDay = day.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        switch (normalizedDay) {
          case 'lunes':
          case 'jueves':
          case 'viernes':
          case 'sabado':
            openTime = timeToMinutes('12:30');
            closeTime = timeToMinutes('23:00');
            break;
          case 'domingo':
            openTime = timeToMinutes('12:30');
            closeTime = timeToMinutes('16:30');
            break;
          case 'martes':
          case 'miercoles':
            return false;
          default:
            return false;
        }

        return currentMinutes >= openTime && currentMinutes <= closeTime;
      } catch (error) {
        console.error("Error calculating open status", error);
        return false;
      }
    };

    setIsOpen(checkIsOpen());

    const interval = setInterval(() => {
      setIsOpen(checkIsOpen());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return isOpen;
}

export default function Home() {

  const isOpen = useIsOpen();

  const dishes: Dish[] = [
    {
      id: 1,
      num: "01",
      price: "18.50€",
      title: "Pulpo a la Carmela",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuASPA5TLAixzGQ_chKJpLWS3FCrToejJfUwVG929Arm009v8EgR_GUVSBkgl1S1dl_1dX4Ar7Bgno9D6WHl0jsHjAW0Y2IG2xlgi5-cMsU9culVRgTSyntMhX90wE8I-ysZ0WuIj4h6ZeFuYR5oUNaq3n719dWhtDZZtebZDNsMHv2nI5CF0e_BeUsZKWwl9uQnFulGodZWypH92ahJ_9LwlDUFwUqLL1vhJHiepsPDBTbwPmXMRWFubsthe3QoRyc5EYIwKLYMCtI",
      desc: "Nuestra preparación más emblemática, servida con pimientos de la tierra y pimentón premium."
    },
    {
      id: 2,
      num: "02",
      price: "12.00€",
      title: "Croquetas de Pulpo",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAv-Kc3olwCXW9fY121lwgmv8V4LJanrii0pwFbMDIC-JNbT91eQE5Ik7i7FxsogghaxT1WcnGs6SXM8Hc6fU64WQFyYbJ35Q-jY5OqAOWfbfAC3B8KNlQAF2qTTAJUK7J0eSXmdOe6Nsgf65F1enCGZ3F2svw8C8ZzsoRQlbgkeYILccpZjaXv8EifAG3jc0zIMWrZzgdUkdPnMCLYnIJsUsPRP3cmzIGhz1TX-iqZfRuAPlHpJgCa8wahUR5e8Nj3RLOfUVhXFsc",
      desc: "Explosión marina en cada bocado. Bechamel extra-cremosa elaborada diariamente."
    },
    {
      id: 3,
      num: "03",
      price: "S/M",
      title: "Pescado del día",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWEehAd1kce9ROdaR-LdtDl-2Dw3zXOQYNCj5VFIb6ZWwk0OA0e7mtgdnhPcQZWHbjIqV8S8RCHBjV7nS8c3x0TeXIa4g4-EAVGo9sCsqgiOCyUKAb1TOl9VHytE-_szExJ4xtxOY22f_gjZdHH__Mfnldz849fkuQHa8sBgSNTUFa5KEg78DwghvcSF4Y-Tr3yvmVbClEcDSgMVWC93vBc2TehYR6tInZN4Q_t_SoARuU085jiHFyOxKjCqQ40JmI3ZP1kbtrT2I",
      desc: "Selección directa de los barcos de San Cristóbal. Preparación tradicional o al gusto del chef."
    },
    {
      id: 4,
      num: "04",
      price: "6.50€",
      title: "Polvito Uruguayo",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBVkdJ-VeaxHZcR_5L2lTNP2FVcf_f-mPUB4Y2ItKsjy7hQPteOzKglgvF41ipCoA25Onwd1GIhDQvpQ3eG_TZeRfyWRp7BHdPCIoG3TujmV7K2zhZQYgneBkwrXBkroXbtokclopEy8JOdG18f-NqfoqDojv4dwwmvnppleDQzyDqqP3XTQt_lcDSiu2BAsMRqJES-yGWuRHntiyNKWVAsdrRuLpvfTW1xVtBXI8lfSzEEEyCWG4Z5dH250UAdK6xmctCmr1Ktrfc",
      desc: "El postre canario por excelencia. Capas de suspiro, galleta y el mejor dulce de leche."
    }
  ];

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
          "telephone": "+34928584422",
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
        <div className="p-4 md:p-10">
          <div className="flex min-h-[85vh] flex-col rounded-[2rem] md:rounded-[3rem] items-center justify-center p-6 relative overflow-hidden shadow-2xl" 
               style={{backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.5) 100%), url('https://lh3.googleusercontent.com/aida-public/AB6AXuCbv4Dv6O89wmDw82msQkmpHfAHMPyBL93oTKLgg6BLzFOHoT8UCD97FfOXr4tBZl1OWHN3p1YmhBWzaO5AI3QBqjKAF3Zmd13X_7oEPpToFNnChrgtMwjQFUBaqlRUW4o81Il-AJvJgbQ4FhEftHiJDUXMBCXX1pGRcnWgqIKmMgA69vIECpIOUvLe-muTBbb67DG9yCUSKeJJxCAMH7fBQRnxqLEIljydJWZxT_bmSOdkx3JmMZEpDLQrKeAIL9IzT1uI5J312Pc')", backgroundSize: 'cover', backgroundPosition: 'center'}}>
            
            <div className="floating flex flex-col gap-6 text-center max-w-[750px] z-10 p-4">
              <span className="text-primary font-bold tracking-[0.3em] uppercase text-[10px] bg-white/20 dark:bg-white/10 backdrop-blur-md px-4 py-2 rounded-full w-fit mx-auto border sm:border-2 border-white/50 dark:border-white/20 shadow-sm">Experiencia Gastronómica</span>
              <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
                El <span className="text-primary italic">sabor</span> del Mar <br/> San Cristóbal
              </h1>
              <p className="text-white/90 text-base md:text-lg font-light leading-relaxed max-w-xl mx-auto">
                Tradición pesquera y producto Km 0 en un entorno inigualable frente al Atlántico.
              </p>
              <div className="flex flex-wrap gap-4 justify-center mt-4">
                <a href="#carta" className="group flex min-w-[180px] cursor-pointer items-center justify-center rounded-full h-14 px-8 bg-primary text-white text-xs font-bold uppercase tracking-[0.15em] hover:scale-105 transition-all shadow-2xl shadow-primary/40">
                  Ver la Carta
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*
        About Us Section
        <section className="px-6 lg:px-28 py-24 @container overflow-hidden" id="nosotros">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="flex-1 w-full relative">
              <div className="aspect-[16/10] rounded-2xl md:rounded-[2.5rem] bg-cover bg-center shadow-[0_30px_80px_-15px_rgba(0,0,0,0.25)] border-2 border-white dark:border-slate-800" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDHN_4hnzs64uVTD9pNvyjzMd0gmF4u7d9jlcgGRfAeXVF6xYmg615NSyZS8rGp-W024Q6a7_VHAgETZykcP6iOmw5Q_bM7W4ySND3PfvJ0dKZeFEnZF7doKn5ut9QjDorkWL-tX8aPlHIukSpo6etujfLfe3dPBQuh8rfJoeS4UG_U9KSG3Y8sWtncAfSc0vaVFDKhnSKbOSMbQEx7lxCR4ub3_jIV_J89xZN_YklPuNB5zQlixYXbykzNRiO5ihIRGpKeVAtcraQ')"}}></div>
            </div>
            <div className="flex flex-col gap-8 flex-1">
              <div className="flex flex-col gap-3">
                <span className="text-primary font-bold tracking-[0.3em] uppercase text-xs">Sobre Nosotros</span>
                <h2 className="text-slate-900 dark:text-slate-100 text-3xl md:text-4xl font-black leading-tight tracking-tight">
                  Felicidad <span className="text-primary italic">frente</span> al mar.
                </h2>
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-base md:text-lg leading-relaxed font-light">
                Desde hace generaciones, nuestra familia ha vivido del y para el mar. En El Atlante, trasladamos esa pasión a cada plato, utilizando técnicas tradicionales y el producto más fresco de la lonja de San Cristóbal.
              </p>
              <div className="space-y-8 mt-2">
                <div className="flex items-start gap-5 group">
                  <div className="size-14 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner flex-shrink-0">
                    <svg className="size-7" fill="currentColor" viewBox="0 -960 960 960"><path d="M440-160v-487L216-431l-56-57 280-280 280 280-56 57-224-216v487h-80Z"/></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 uppercase tracking-tight mb-1">Producto Directo</h4>
                    <p className="text-slate-500 dark:text-slate-400 font-light text-sm max-w-sm">Sin intermediarios, de la lonja a tu mesa. Frescura en menos de 24h.</p>
                  </div>
                </div>
                <div className="flex items-start gap-5 group">
                  <div className="size-14 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner flex-shrink-0">
                    <svg className="size-7" fill="currentColor" viewBox="0 -960 960 960"><path d="M280-80v-366q-51-14-85.5-56.5T160-600v-280h80v280h40v-280h80v280h40v-280h80v280q0 55-34.5 97.5T360-446v366h-80Zm400 0v-320H560v-280q0-83 58.5-141.5T760-880v800h-80Z"/></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 uppercase tracking-tight mb-1">Cocina Brava</h4>
                    <p className="text-slate-500 dark:text-slate-400 font-light text-sm max-w-sm">Recetas con alma y potencia marina heredadas por décadas.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      */}

      {/*




      {/* Info & Hours - Integrated Layout */}
      <section className="py-24 lg:py-32 px-6 lg:px-28 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <div className="space-y-10">
            <div className="mb-8">
              <h1 className="text-primary font-bold tracking-[0.4em] uppercase text-[10px]">Horario de Apertura</h1>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
              {/* Card Horarios */}
              <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-lg p-6 flex flex-col items-center border border-slate-100 dark:border-white/10">
                <svg className="mb-2 text-primary" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 2v2M8 2v2M3 10h18"/><circle cx="8.5" cy="14.5" r="1.5"/><circle cx="15.5" cy="14.5" r="1.5"/></svg>
                <span className="font-bold text-lg text-slate-900 dark:text-slate-100">Lunes</span>
                <span className="text-primary font-semibold text-xl mt-1">12:30 - 23:00</span>
              </div>
              <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-lg p-6 flex flex-col items-center border border-slate-100 dark:border-white/10">
                <svg className="mb-2 text-primary" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 2v2M8 2v2M3 10h18"/><circle cx="8.5" cy="14.5" r="1.5"/><circle cx="15.5" cy="14.5" r="1.5"/></svg>
                <span className="font-bold text-lg text-primary">Martes & Miércoles</span>
                <span className="text-red-500 font-semibold text-xl mt-1">Cerrado</span>
              </div>
              <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-lg p-6 flex flex-col items-center border border-slate-100 dark:border-white/10">
                <svg className="mb-2 text-primary" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 2v2M8 2v2M3 10h18"/><circle cx="8.5" cy="14.5" r="1.5"/><circle cx="15.5" cy="14.5" r="1.5"/></svg>
                <span className="font-bold text-lg text-slate-900 dark:text-slate-100">Jueves - Sábado</span>
                <span className="text-primary font-semibold text-xl mt-1">12:30 - 23:00</span>
              </div>
              <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-lg p-6 flex flex-col items-center border border-slate-100 dark:border-white/10">
                <svg className="mb-2 text-primary" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 2v2M8 2v2M3 10h18"/><circle cx="8.5" cy="14.5" r="1.5"/><circle cx="15.5" cy="14.5" r="1.5"/></svg>
                <span className="font-bold text-lg text-slate-900 dark:text-slate-100">Domingo</span>
                <span className="text-primary font-semibold text-xl mt-1">12:30 - 16:30</span>
              </div>
            </div>
          </div>

          <div className="lg:pl-16 lg:border-l border-slate-100 dark:border-white/5">
            <div className="space-y-14">
              <div>
                <span className="text-slate-400 font-bold tracking-widest uppercase text-[10px] mb-4 block">Ubicación</span>
                <p className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-snug">
                  Calle Marina, 81 <br/>
                  Barrio Marinero de San Cristóbal <br/>
                  Las Palmas de G.C.
                </p>
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=El+Atlante+San+Cristobal+Las+Palmas" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-block mt-8 px-6 py-3 bg-slate-900 dark:bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-all"
                >
                  Ver ruta en Google Maps
                </a>
              </div>

              <div>
                <span className="text-slate-400 font-bold tracking-widest uppercase text-[10px] mb-4 block">Contacto Directo</span>
                <p className="text-2xl md:text-3xl font-black tracking-tight text-primary">+34 928 58 44 22</p>
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

      {/* Map - Abstract Non-Card Full Width */}
      <section id="mapa" className="relative h-[450px] w-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: "radial-gradient(#1162d4 1.5px, transparent 1.5px)", backgroundSize: "50px 50px"}}></div>
        <div className="relative z-10 text-center max-w-xl px-6">
           <div className="bg-primary/10 backdrop-blur-3xl p-12 md:p-16 rounded-[3rem] border border-primary/20">
              <h4 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-4 text-slate-900 dark:text-white leading-tight">Te esperamos <br/>en el Paseo</h4>
              <p className="text-slate-500 font-light text-base mb-8">Justo donde rompen las olas, en el corazón marinero de la ciudad.</p>
              <span className={`px-6 py-2.5 ${isOpen ? 'bg-primary' : 'bg-red-500'} text-white font-bold rounded-full text-xs uppercase tracking-[0.2em] inline-block shadow-2xl ${isOpen ? 'shadow-primary/40' : 'shadow-red-500/40'}`}>
                {isOpen ? 'Abierto Ahora' : 'Cerrado'}
              </span>
           </div>
        </div>
      </section>
    </>
  );
}
