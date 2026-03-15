import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface Dish {
  id: number;
  num: string;
  price: string;
  title: string;
  img: string;
  desc: string;
}

const DishCard = ({ dish, idx, scrollYProgress }: { dish: Dish; idx: number; scrollYProgress: any }) => {
  const center = idx / 3;
  const cardProgress = [
    Math.max(0, center - 0.2),
    center,
    Math.min(1, center + 0.2)
  ];

  const scale = useTransform(scrollYProgress, cardProgress, [0.8, 1, 0.8]);
  const opacity = useTransform(scrollYProgress, cardProgress, [0.4, 1, 0.4]);

  return (
    <motion.div 
      style={{ scale, opacity }}
      className="flex flex-col gap-10 group w-[500px] flex-shrink-0 relative"
    >
      <span className="absolute -top-12 -left-8 text-8xl font-black text-white/5 select-none z-0">{dish.num}</span>
      <div className="relative aspect-[16/10] overflow-hidden rounded-[3rem] border-2 border-white/10 shadow-2xl glass-dark">
        <img 
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" 
          src={dish.img} 
          alt={dish.title}
        />
        <div className="absolute top-8 left-8 bg-primary px-6 py-2 rounded-full text-white font-black text-xl shadow-xl">{dish.price}</div>
      </div>
      <div className="space-y-4 z-10 px-4">
        <h3 className="text-5xl font-black tracking-tighter uppercase leading-none text-white group-hover:text-primary transition-colors">{dish.title}</h3>
        <p className="text-2xl text-slate-400 font-light leading-relaxed max-w-md">{dish.desc}</p>
      </div>
    </motion.div>
  );
};

export default function Home() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["1%", "-65%"]);

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
      {/* Hero Section */}
      <section className="@container" id="inicio">
        <div className="p-4 md:p-10">
          <div className="flex min-h-[85vh] flex-col rounded-[3rem] items-center justify-center p-6 relative overflow-hidden shadow-2xl" 
               style={{backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.5) 100%), url('https://lh3.googleusercontent.com/aida-public/AB6AXuCbv4Dv6O89wmDw82msQkmpHfAHMPyBL93oTKLgg6BLzFOHoT8UCD97FfOXr4tBZl1OWHN3p1YmhBWzaO5AI3QBqjKAF3Zmd13X_7oEPpToFNnChrgtMwjQFUBaqlRUW4o81Il-AJvJgbQ4FhEftHiJDUXMBCXX1pGRcnWgqIKmMgA69vIECpIOUvLe-muTBbb67DG9yCUSKeJJxCAMH7fBQRnxqLEIljydJWZxT_bmSOdkx3JmMZEpDLQrKeAIL9IzT1uI5J312Pc')", backgroundSize: 'cover', backgroundPosition: 'center'}}>
            
            <div className="floating flex flex-col gap-8 text-center max-w-[900px] z-10 p-4">
              <span className="text-primary font-black tracking-[0.4em] uppercase text-[10px] bg-white/10 backdrop-blur-md px-4 py-2 rounded-full w-fit mx-auto border border-white/20">Experiencia Gastronómica</span>
              <h1 className="text-white text-6xl md:text-8xl font-black leading-tight tracking-tighter">
                El <span className="text-primary italic">sabor</span> del Mar <br/> San Cristóbal
              </h1>
              <p className="text-white/90 text-xl md:text-2xl font-light leading-relaxed max-w-2xl mx-auto">
                Tradición pesquera y producto Km 0 en un entorno inigualable frente al Atlántico.
              </p>
              <div className="flex flex-wrap gap-6 justify-center mt-6">
                <a href="#carta" className="group flex min-w-[200px] cursor-pointer items-center justify-center rounded-full h-16 px-10 bg-primary text-white text-sm font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-2xl shadow-primary/40">
                  Ver la Carta
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section - Integrated Layout (No Cards) */}
      <section className="px-6 lg:px-40 py-32 @container overflow-hidden" id="nosotros">
        <div className="flex flex-col lg:flex-row gap-24 items-center">
          <div className="flex-1 w-full relative">
            <div className="aspect-[16/10] rounded-[3rem] bg-cover bg-center shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] border-4 border-white dark:border-slate-800" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDHN_4hnzs64uVTD9pNvyjzMd0gmF4u7d9jlcgGRfAeXVF6xYmg615NSyZS8rGp-W024Q6a7_VHAgETZykcP6iOmw5Q_bM7W4ySND3PfvJ0dKZeFEnZF7doKn5ut9QjDorkWL-tX8aPlHIukSpo6etujfLfe3dPBQuh8rfJoeS4UG_U9KSG3Y8sWtncAfSc0vaVFDKhnSKbOSMbQEx7lxCR4ub3_jIV_J89xZN_YklPuNB5zQlixYXbykzNRiO5ihIRGpKeVAtcraQ')"}}></div>
          </div>
          <div className="flex flex-col gap-10 flex-1">
            <div className="flex flex-col gap-4">
              <span className="text-primary font-black tracking-[0.3em] uppercase text-xs">Sobre Nosotros</span>
              <h2 className="text-slate-900 dark:text-slate-100 text-5xl md:text-6xl font-black leading-none tracking-tighter">
                Felicidad <span className="text-primary italic">frente</span> al mar.
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xl leading-relaxed font-light">
              Desde hace generaciones, nuestra familia ha vivido del y para el mar. En El Atlante, trasladamos esa pasión a cada plato, utilizando técnicas tradicionales y el producto más fresco de la lonja de San Cristóbal.
            </p>
            <div className="space-y-12 mt-4">
              <div className="flex items-start gap-6 group">
                <div className="size-16 flex items-center justify-center rounded-3xl bg-slate-100 dark:bg-white/5 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                  <svg className="size-8" fill="currentColor" viewBox="0 -960 960 960"><path d="M440-160v-487L216-431l-56-57 280-280 280 280-56 57-224-216v487h-80Z"/></svg>
                </div>
                <div>
                  <h4 className="font-black text-xl text-slate-900 dark:text-slate-100 uppercase tracking-tighter mb-2">Producto Directo</h4>
                  <p className="text-slate-500 font-light max-w-sm">Sin intermediarios, de la lonja a tu mesa. Frescura en menos de 24h.</p>
                </div>
              </div>
              <div className="flex items-start gap-6 group">
                <div className="size-16 flex items-center justify-center rounded-3xl bg-slate-100 dark:bg-white/5 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                  <svg className="size-8" fill="currentColor" viewBox="0 -960 960 960"><path d="M280-80v-366q-51-14-85.5-56.5T160-600v-280h80v280h40v-280h80v280h40v-280h80v280q0 55-34.5 97.5T360-446v366h-80Zm400 0v-320H560v-280q0-83 58.5-141.5T760-880v800h-80Z"/></svg>
                </div>
                <div>
                  <h4 className="font-black text-xl text-slate-900 dark:text-slate-100 uppercase tracking-tighter mb-2">Cocina Brava</h4>
                  <p className="text-slate-500 font-light max-w-sm">Recetas con alma y potencia marina heredadas por décadas.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties - Sticky Scroll Carousel */}
      <section ref={targetRef} className="relative h-[400vh] bg-slate-950 px-6 lg:px-40" id="carta">
        {/* Parallax Background Elements */}
        <div className="sticky top-0 h-screen w-full overflow-hidden pointer-events-none">
          <motion.div 
            style={{ 
              y: useTransform(scrollYProgress, [0, 1], [0, -200]),
              opacity: useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 0.3, 0.3, 0])
             }}
            className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]"
          />
          <motion.div 
            style={{ 
              y: useTransform(scrollYProgress, [0, 1], [0, 200]),
              opacity: useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 0.2, 0.2, 0])
             }}
            className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px]"
          />
        </div>

        <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
          <div className="w-full flex flex-col md:flex-row justify-between items-end mb-16 gap-8 z-20">
            <div className="max-w-2xl">
              <span className="text-primary font-black tracking-[0.4em] uppercase text-xs">Exclusividad</span>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="text-6xl md:text-8xl font-black mt-4 tracking-tighter leading-none text-white"
              >
                Joyas <br/><span className="text-primary italic underline decoration-4 underline-offset-8">del Atlante</span>
              </motion.h2>
            </div>
            <p className="text-slate-400 font-light text-xl max-w-sm">Platos icónicos que definen nuestra identidad gastronómica sin artificios.</p>
          </div>

          <motion.div style={{ x }} className="flex gap-20 w-fit items-center px-[5vw]">
            {dishes.map((dish, idx) => (
              <DishCard key={dish.id} dish={dish} idx={idx} scrollYProgress={scrollYProgress} />
            ))}
          </motion.div>

          {/* Section Progress Bar */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-64 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              style={{ scaleX: scrollYProgress, transformOrigin: "left" }}
              className="w-full h-full bg-primary"
            />
          </div>
        </div>
      </section>




      {/* Info & Hours - Integrated Layout */}
      <section className="py-40 px-6 lg:px-40 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-start">
          <div className="space-y-16">
            <div>
              <span className="text-primary font-black tracking-[0.5em] uppercase text-[10px]">Cuándo Venir</span>
              <h2 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-slate-100 mt-6 tracking-tighter leading-none">Horarios <br/><span className="text-primary italic">Atlánticos</span></h2>
            </div>
            
            <div className="space-y-8 divide-y divide-slate-100 dark:divide-white/5">
              {[
                { day: 'Lunes', hours: '12:30 - 23:00' },
                { day: 'Martes & Miércoles', hours: 'Cerrado', highlight: true },
                { day: 'Jueves - Sábado', hours: '12:30 - 23:00' },
                { day: 'Domingo', hours: '12:30 - 16:30' }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-8 first:pt-0">
                  <span className={`font-black uppercase tracking-widest text-lg ${item.highlight ? 'text-primary' : 'text-slate-900 dark:text-slate-100'}`}>{item.day}</span>
                  <span className={`font-light text-2xl ${item.highlight ? 'text-primary' : 'text-slate-500'}`}>{item.hours}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:pl-20 border-l border-slate-100 dark:border-white/5">
            <div className="space-y-20">
              <div>
                <span className="text-slate-400 font-black tracking-widest uppercase text-[10px] mb-6 block">Ubicación</span>
                <p className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-slate-100">
                  Calle Marina, 81 <br/>
                  Barrio Marinero de San Cristóbal <br/>
                  Las Palmas de G.C.
                </p>
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=El+Atlante+San+Cristobal+Las+Palmas" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-block mt-10 px-8 py-4 bg-slate-900 dark:bg-primary text-white text-xs font-black uppercase tracking-widest rounded-full hover:scale-105 transition-all"
                >
                  Ver ruta en Google Maps
                </a>
              </div>

              <div>
                <span className="text-slate-400 font-black tracking-widest uppercase text-[10px] mb-6 block">Contacto Directo</span>
                <p className="text-3xl md:text-5xl font-black tracking-tighter text-primary">+34 928 58 44 22</p>
                <div className="flex gap-10 mt-10">
                   <a 
                     href="https://www.instagram.com/restaurante_elatlante" 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="text-slate-500 hover:text-primary transition-colors font-black uppercase tracking-widest text-xs"
                   >
                     Instagram
                   </a>
                   <a 
                     href="https://www.facebook.com/elatlantedesancristobal/" 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="text-slate-500 hover:text-primary transition-colors font-black uppercase tracking-widest text-xs"
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
      <section id="mapa" className="relative h-[600px] w-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
        <div className="absolute inset-0 opacity-30" style={{backgroundImage: "radial-gradient(#1162d4 2px, transparent 2px)", backgroundSize: "60px 60px"}}></div>
        <div className="relative z-10 text-center max-w-2xl px-6">
           <div className="bg-primary/10 backdrop-blur-3xl p-16 md:p-24 rounded-[5rem] border border-primary/20">
              <h4 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 text-slate-900 dark:text-white leading-none">Te esperamos <br/> en el Paseo</h4>
              <p className="text-slate-500 font-light text-xl mb-12">Justo donde rompen las olas, en el corazón marinero de la ciudad.</p>
              <span className="px-8 py-3 bg-primary text-white font-black rounded-full text-xs uppercase tracking-[0.3em] inline-block shadow-2xl shadow-primary/40">Abierto Ahora</span>
           </div>
        </div>
      </section>
    </>
  );
}
