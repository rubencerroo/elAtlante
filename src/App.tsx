
function App() {
  return (
    <div className="relative flex min-h-screen flex-col group/design-root overflow-x-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <div className="layout-container flex h-full grow flex-col">
        {/* Top Navigation Bar - Glass Pill */}
        <div className="fixed top-6 left-0 right-0 z-[100] flex justify-center px-4">
          <header className="glass flex items-center justify-between w-full max-w-5xl rounded-full px-6 py-3">
            <div className="flex items-center gap-3 text-primary">
              <div className="size-8">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z" fill="currentColor" fillRule="evenodd"></path>
                </svg>
              </div>
              <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold tracking-tight">El Atlante</h2>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a className="text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors" href="#inicio">Inicio</a>
              <a className="text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors" href="#carta">Carta</a>
              <a className="text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors" href="#nosotros">Nosotros</a>
              <a className="text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors" href="#reservar">Reservar</a>
            </nav>
            <button className="flex min-w-[120px] cursor-pointer items-center justify-center rounded-full h-10 px-4 bg-primary text-white text-xs font-bold uppercase tracking-widest hover:shadow-lg hover:shadow-primary/40 transition-all">
              Reservar
            </button>
          </header>
        </div>

        <main className="pt-24">
          {/* Hero Section - Elevated Glass */}
          <section className="@container" id="inicio">
            <div className="p-4 md:p-10">
              <div className="flex min-h-[750px] flex-col rounded-[2rem] items-center justify-center p-6 relative overflow-hidden shadow-2xl" 
                   style={{backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.4) 100%), url('https://lh3.googleusercontent.com/aida-public/AB6AXuCbv4Dv6O89wmDw82msQkmpHfAHMPyBL93oTKLgg6BLzFOHoT8UCD97FfOXr4tBZl1OWHN3p1YmhBWzaO5AI3QBqjKAF3Zmd13X_7oEPpToFNnChrgtMwjQFUBaqlRUW4o81Il-AJvJgbQ4FhEftHiJDUXMBCXX1pGRcnWgqIKmMgA69vIECpIOUvLe-muTBbb67DG9yCUSKeJJxCAMH7fBQRnxqLEIljydJWZxT_bmSOdkx3JmMZEpDLQrKeAIL9IzT1uI5J312Pc')", backgroundSize: 'cover', backgroundPosition: 'center'}}>
                
                <div className="glass-dark floating flex flex-col gap-6 text-center max-w-[850px] z-10 p-10 md:p-16 rounded-[2.5rem] border border-white/10 backdrop-blur-xl">
                  <span className="text-primary font-bold tracking-[0.3em] uppercase text-xs">Experiencia Gastronómica</span>
                  <h1 className="text-white text-5xl md:text-7xl font-black leading-tight tracking-tighter">
                    El auténtico <span className="text-primary italic">sabor</span> del Mar Atlántico
                  </h1>
                  <p className="text-white/80 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto">
                    Pescado fresco y tradición canaria en el corazón del emblemático barrio marinero de San Cristóbal.
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center mt-4">
                    <button className="flex min-w-[180px] cursor-pointer items-center justify-center rounded-full h-14 px-8 bg-primary text-white text-sm font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-primary/30">
                      Ver Carta
                    </button>
                    <button className="flex min-w-[180px] cursor-pointer items-center justify-center rounded-full h-14 px-8 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-bold uppercase tracking-widest hover:bg-white/20 transition-all">
                      Ubicación
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* About Us Section */}
          <section className="flex flex-col gap-10 px-6 lg:px-40 py-20 @container" id="nosotros">
            <div className="flex flex-col md:flex-row gap-16 items-center">
              <div className="flex flex-col gap-8 flex-1">
                <div className="flex flex-col gap-2">
                  <span className="text-primary font-bold tracking-[0.2em] uppercase text-xs">Nuestra Esencia</span>
                  <h2 className="text-slate-900 dark:text-slate-100 tracking-tight text-4xl md:text-5xl font-black leading-tight">
                    Del mar a la mesa, <br/><span className="text-primary">sin intermediarios.</span>
                  </h2>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed font-light">
                  Ubicados en el emblemático barrio de San Cristóbal, defendemos la filosofía de frescura absoluta. Cada mañana, seleccionamos las mejores capturas de los pescadores locales para ofrecerte una experiencia honesta.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                  <div className="glass p-6 rounded-2xl flex items-start gap-4 hover:scale-105 transition-transform duration-500">
                    <div className="bg-primary/20 p-3 rounded-xl shadow-inner">
                      <svg className="size-6 text-primary" fill="currentColor" viewBox="0 -960 960 960" xmlns="http://www.w3.org/2000/svg">
                        <path d="M440-160v-487L216-431l-56-57 280-280 280 280-56 57-224-216v487h-80Z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100">Producto Local</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Km 0 real del barrio marinero.</p>
                    </div>
                  </div>
                  <div className="glass p-6 rounded-2xl flex items-start gap-4 hover:scale-105 transition-transform duration-500">
                    <div className="bg-primary/20 p-3 rounded-xl shadow-inner">
                      <svg className="size-6 text-primary" fill="currentColor" viewBox="0 -960 960 960" xmlns="http://www.w3.org/2000/svg">
                        <path d="M280-80v-366q-51-14-85.5-56.5T160-600v-280h80v280h40v-280h80v280h40v-280h80v280q0 55-34.5 97.5T360-446v366h-80Zm400 0v-320H560v-280q0-83 58.5-141.5T760-880v800h-80Z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100">Recetas Abuelas</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Sabor casero transmitido por décadas.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full relative">
                <div className="absolute -inset-4 bg-primary/10 rounded-[3rem] blur-3xl -z-10"></div>
                <div className="aspect-[4/5] rounded-[2.5rem] bg-cover bg-center shadow-2xl image-container border-8 border-white dark:border-slate-800 ring-1 ring-slate-200" data-alt="Picturesque coastal view of San Cristobal fishing village" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDHN_4hnzs64uVTD9pNvyjzMd0gmF4u7d9jlcgGRfAeXVF6xYmg615NSyZS8rGp-W024Q6a7_VHAgETZykcP6iOmw5Q_bM7W4ySND3PfvJ0dKZeFEnZF7doKn5ut9QjDorkWL-tX8aPlHIukSpo6etujfLfe3dPBQuh8rfJoeS4UG_U9KSG3Y8sWtncAfSc0vaVFDKhnSKbOSMbQEx7lxCR4ub3_jIV_J89xZN_YklPuNB5zQlixYXbykzNRiO5ihIRGpKeVAtcraQ')"}}></div>
              </div>
            </div>
          </section>
          {/* Featured Menu Section */}
          <section className="py-24 px-6 lg:px-40" id="carta">
            <div className="text-center mb-20">
              <h2 className="text-slate-900 dark:text-slate-100 text-4xl md:text-5xl font-black mb-4">Nuestras Especialidades</h2>
              <div className="h-1.5 w-24 bg-primary mx-auto rounded-full"></div>
              <p className="text-slate-500 dark:text-slate-400 mt-6 text-lg font-light">Los platos que nos han hecho un referente en la costa.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
              {/* Card 1 */}
              <div className="group glass rounded-[2.5rem] p-4 hover:shadow-2xl transition-all duration-500 hover:-translate-y-4">
                <div className="h-72 w-full rounded-[2rem] overflow-hidden mb-6 relative">
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold backdrop-blur-sm z-10">Ver Detalle</div>
                  <div className="w-full h-full bg-center bg-cover transition-transform duration-700 group-hover:scale-110" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuASPA5TLAixzGQ_chKJpLWS3FCrToejJfUwVG929Arm009v8EgR_GUVSBkgl1S1dl_1dX4Ar7Bgno9D6WHl0jsHjAW0Y2IG2xlgi5-cMsU9culVRgTSyntMhX90wE8I-ysZ0WuIj4h6ZeFuYR5oUNaq3n719dWhtDZZtebZDNsMHv2nI5CF0e_BeUsZKWwl9uQnFulGodZWypH92ahJ_9LwlDUFwUqLL1vhJHiepsPDBTbwPmXMRWFubsthe3QoRyc5EYIwKLYMCtI')"}}></div>
                </div>
                <div className="px-4 pb-4">
                  <h3 className="text-slate-900 dark:text-slate-100 text-xl font-bold mb-2">Pulpo a la Carmela</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-light">Nuestra receta estrella con el punto perfecto de cocción.</p>
                </div>
              </div>
              {/* Card 2 */}
              <div className="group glass rounded-[2.5rem] p-4 hover:shadow-2xl transition-all duration-500 hover:-translate-y-4">
                <div className="h-72 w-full rounded-[2rem] overflow-hidden mb-6 relative">
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold backdrop-blur-sm z-10">Ver Detalle</div>
                  <div className="w-full h-full bg-center bg-cover transition-transform duration-700 group-hover:scale-110" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAv-Kc3olwCXW9fY121lwgmv8V4LJanrii0pwFbMDIC-JNbT91eQE5Ik7i7FxsogghaxT1WcnGs6SXM8Hc6fU64WQFyYbJ35Q-jY5OqAOWfbfAC3B8KNlQAF2qTTAJUK7J0eSXmdOe6Nsgf65F1enCGZ3F2svw8C8ZzsoRQlbgkeYILccpZjaXv8EifAG3jc0zIMWrZzgdUkdPnMCLYnIJsUsPRP3cmzIGhz1TX-iqZfRuAPlHpJgCa8wahUR5e8Nj3RLOfUVhXFsc')"}}></div>
                </div>
                <div className="px-4 pb-4">
                  <h3 className="text-slate-900 dark:text-slate-100 text-xl font-bold mb-2">Croquetas de Pulpo</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-light">Bechamel cremosa con intenso sabor a mar y trozos de pulpo.</p>
                </div>
              </div>
              {/* Card 3 */}
              <div className="group glass rounded-[2.5rem] p-4 hover:shadow-2xl transition-all duration-500 hover:-translate-y-4">
                <div className="h-72 w-full rounded-[2rem] overflow-hidden mb-6 relative">
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold backdrop-blur-sm z-10">Ver Detalle</div>
                  <div className="w-full h-full bg-center bg-cover transition-transform duration-700 group-hover:scale-110" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCWEehAd1kce9ROdaR-LdtDl-2Dw3zXOQYNCj5VFIb6ZWwk0OA0e7mtgdnhPcQZWHbjIqV8S8RCHBjV7nS8c3x0TeXIa4g4-EAVGo9sCsqgiOCyUKAb1TOl9VHytE-_szExJ4xtxOY22f_gjZdHH__Mfnldz849fkuQHa8sBgSNTUFa5KEg78DwghvcSF4Y-Tr3yvmVbClEcDSgMVWC93vBc2TehYR6tInZN4Q_t_SoARuU085jiHFyOxKjCqQ40JmI3ZP1kbtrT2I')"}}></div>
                </div>
                <div className="px-4 pb-4">
                  <h3 className="text-slate-900 dark:text-slate-100 text-xl font-bold mb-2">Pescado fresco del día</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-light">La mejor captura de la jornada: Vieja, Cherne o Samas.</p>
                </div>
              </div>
              {/* Card 4 */}
              <div className="group glass rounded-[2.5rem] p-4 hover:shadow-2xl transition-all duration-500 hover:-translate-y-4">
                <div className="h-72 w-full rounded-[2rem] overflow-hidden mb-6 relative">
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold backdrop-blur-sm z-10">Ver Detalle</div>
                  <div className="w-full h-full bg-center bg-cover transition-transform duration-700 group-hover:scale-110" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBVkdJ-VeaxHZcR_5L2lTNP2FVcf_f-mPUB4Y2ItKsjy7hQPteOzKglgvF41ipCoA25Onwd1GIhDQvpQ3eG_TZeRfyWRp7BHdPCIoG3TujmV7K2zhZQYgneBkwrXBkroXbtokclopEy8JOdG18f-NqfoqDojv4dwwmvnppleDQzyDqqP3XTQt_lcDSiu2BAsMRqJES-yGWuRHntiyNKWVAsdrRuLpvfTW1xVtBXI8lfSzEEEyCWG4Z5dH250UAdK6xmctCmr1Ktrfc')"}}></div>
                </div>
                <div className="px-4 pb-4">
                  <h3 className="text-slate-900 dark:text-slate-100 text-xl font-bold mb-2">Polvito Uruguayo</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-light">Suspiro, galleta y dulce de leche para el final perfecto.</p>
                </div>
              </div>
            </div>
            <div className="mt-20 text-center">
              <button className="bg-slate-900 dark:bg-primary text-white font-bold py-5 px-12 rounded-full hover:scale-105 transition-all shadow-xl tracking-widest uppercase text-xs">Descargar Carta Completa (PDF)</button>
            </div>
          </section>
          {/* Info & Hours Section */}
          <section className="py-24 px-6 lg:px-40 grid grid-cols-1 md:grid-cols-2 gap-20 items-start">
            <div className="glass p-10 rounded-[2.5rem]">
              <h2 className="text-2xl font-black mb-10 flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-lg">
                  <svg className="size-6 text-primary" fill="currentColor" viewBox="0 -960 960 960" xmlns="http://www.w3.org/2000/svg">
                    <path d="m612-292 234-234-56-56-178 178-96-96-56 56 152 152ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
                  </svg>
                </div>
                Horarios de Apertura
              </h2>
              <div className="space-y-6">
                <div className="flex justify-between items-center py-4 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-bold">Lunes</span>
                  <span className="text-slate-500 font-light">12:30 - 23:00</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-slate-200 dark:border-slate-800 bg-primary/10 px-4 rounded-xl">
                  <span className="font-black text-primary">Martes & Miércoles</span>
                  <span className="text-primary font-black uppercase text-xs tracking-widest">Descanso Personal</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-bold">Jueves - Sábado</span>
                  <span className="text-slate-500 font-light">12:30 - 23:00</span>
                </div>
                <div className="flex justify-between items-center py-4">
                  <span className="font-bold">Domingo</span>
                  <span className="text-slate-500 font-light">12:30 - 16:30</span>
                </div>
              </div>
              
              <div className="mt-12 space-y-4">
                <p className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                  <div className="size-10 glass flex items-center justify-center rounded-xl text-primary">
                    <svg className="size-5" fill="currentColor" viewBox="0 -960 960 960" xmlns="http://www.w3.org/2000/svg">
                      <path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 400Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 117-79.5 234.5T480-80Z"/>
                    </svg>
                  </div>
                  <span className="font-light">Calle Marina, 81, Las Palmas de G.C.</span>
                </p>
                <p className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                  <div className="size-10 glass flex items-center justify-center rounded-xl text-primary">
                    <svg className="size-5" fill="currentColor" viewBox="0 -960 960 960" xmlns="http://www.w3.org/2000/svg">
                      <path d="M798-120q-125 0-247-54.5T329-329Q229-429 174.5-551T120-798q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T387-387q31 31 65.5 58.5T524-281l98-97q9-9 20-11t27 1l140 26q13 2 22.5 13t9.5 25v162q0 18-12 30t-30 12Z"/>
                    </svg>
                  </div>
                  <span className="font-light">+34 928 58 44 22</span>
                </p>
              </div>
            </div>

            <div className="glass p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden" id="reservar">
              <div className="absolute top-0 right-0 p-8 opacity-10 -rotate-12 translate-x-4 -translate-y-4">
                <svg className="size-32 text-primary" fill="currentColor" viewBox="0 -960 960 960">
                   <path d="M280-80v-366q-51-14-85.5-56.5T160-600v-280h80v280h40v-280h80v280h40v-280h80v280q0 55-34.5 97.5T360-446v366h-80Zm400 0v-320H560v-280q0-83 58.5-141.5T760-880v800h-80Z"/>
                </svg>
              </div>
              <h2 className="text-3xl font-black mb-8">Solicitar Reserva</h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nombre</label>
                    <input className="glass h-14 rounded-2xl px-6 focus:ring-2 focus:ring-primary/50 border-none placeholder:text-slate-400 font-light" placeholder="Tu nombre" type="text" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Teléfono</label>
                    <input className="glass h-14 rounded-2xl px-6 focus:ring-2 focus:ring-primary/50 border-none placeholder:text-slate-400 font-light" placeholder="+34 000 000 000" type="tel" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Fecha</label>
                    <input className="glass h-14 rounded-2xl px-6 focus:ring-2 focus:ring-primary/50 border-none font-light" type="date" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Comensales</label>
                    <select className="glass h-14 rounded-2xl px-6 focus:ring-2 focus:ring-primary/50 border-none font-light appearance-none">
                      <option>2 personas</option>
                      <option>3 personas</option>
                      <option>4 personas</option>
                      <option>5+ personas</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Observaciones</label>
                  <textarea className="glass rounded-2xl p-6 focus:ring-2 focus:ring-primary/50 border-none placeholder:text-slate-400 font-light" placeholder="¿Alguna alergia o preferencia?" rows={3}></textarea>
                </div>
                <button className="w-full bg-primary text-white font-black py-5 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/30 uppercase tracking-[0.2em] text-xs mt-4" type="submit">Solicitar Mesa</button>
                <p className="text-[10px] text-center text-slate-400 mt-6 font-light italic leading-relaxed">
                  * Las reservas online deben realizarse con al menos 24h de antelación. <br/> Sujeto a disponibilidad y confirmación telefónica.
                </p>
              </form>
            </div>
          </section>

          {/* Map Integration - Stylized Glass */}
          <section className="px-6 lg:px-40 pb-24">
            <div className="glass-dark h-[500px] rounded-[3rem] relative overflow-hidden group shadow-2xl border-4 border-white/5">
              {/* Abstract map background visual */}
              <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-1000" 
                   style={{backgroundImage: "radial-gradient(#1162d4 2px, transparent 2px)", backgroundSize: "40px 40px"}}></div>
              
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="glass floating text-center z-10 p-10 md:p-14 rounded-[3rem] border border-white/20 max-w-lg">
                  <div className="bg-primary/20 size-16 mx-auto rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                    <svg className="size-8 text-primary" fill="currentColor" viewBox="0 -960 960 960" xmlns="http://www.w3.org/2000/svg">
                      <path d="m600-120-240-84-186 72q-20 8-37-4.5T120-170v-560q0-13 7.5-23t20.5-15l212-72 240 84 186-72q20-8 37 4.5t17 33.5v560q0 13-7.5 23T832-192l-232 72Zm-40-98v-468l-160-56v468l160 56Zm80 0 120-36v-474l-120 48v462ZM200-204l120-48v-462l-120 36v474Zm440-484Zm-120-42Z"/>
                    </svg>
                  </div>
                  <h4 className="font-black text-2xl mb-4 tracking-tight">Encuéntranos en el Paseo</h4>
                  <p className="text-slate-500 font-light mb-8 text-lg">Barrio Marinero de San Cristóbal, <br/> Las Palmas de Gran Canaria</p>
                  <button className="px-10 py-5 bg-slate-900 dark:bg-primary text-white text-xs font-black uppercase tracking-[0.2em] rounded-full hover:shadow-2xl transition-all">Cómo llegar</button>
                </div>
              </div>
              <div className="absolute bottom-10 left-10 glass px-6 py-3 rounded-full text-xs font-bold text-primary animate-pulse">
                Abierto Ahora
              </div>
            </div>
          </section>
        </main>

        {/* Footer - Premium Dark */}
        <footer className="bg-slate-950 text-white pt-24 pb-12 px-6 lg:px-40">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 border-b border-white/5 pb-16 mb-12">
            <div>
              <div className="flex items-center gap-3 text-primary mb-6">
                <div className="size-8">
                  <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z" fill="currentColor"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-black tracking-tighter">El Atlante</h2>
              </div>
              <p className="text-slate-500 font-light leading-relaxed">
                Honrando la tradición pesquera de San Cristóbal con el producto más fresco del Atlántico.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-[0.3em] mb-8 text-primary">Navegación</h4>
              <ul className="space-y-4 text-slate-400 font-light">
                <li><a className="hover:text-white transition-colors" href="#inicio">Inicio</a></li>
                <li><a className="hover:text-white transition-colors" href="#carta">La Carta</a></li>
                <li><a className="hover:text-white transition-colors" href="#nosotros">Nosotros</a></li>
                <li><a className="hover:text-white transition-colors" href="#reservar">Reservar</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-[0.3em] mb-8 text-primary">Contacto</h4>
              <ul className="space-y-4 text-slate-400 font-light">
                <li>Calle Marina, 81</li>
                <li>San Cristóbal, Las Palmas</li>
                <li>+34 928 58 44 22</li>
                <li>info@elatlante.com</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-slate-600 uppercase tracking-[0.4em] font-bold">
            <p>© 2024 El Atlante de San Cristóbal</p>
            <div className="flex gap-10">
              <a className="hover:text-primary transition-colors" href="#">Legal</a>
              <a className="hover:text-primary transition-colors" href="#">Privacidad</a>
              <a className="hover:text-primary transition-colors" href="#">Cookies</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
