export default function Reservations() {
  return (
    <div className="min-h-screen pt-32 pb-32 px-6 lg:px-40 flex flex-col items-center bg-white dark:bg-slate-950 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-10"></div>

      <div className="max-w-5xl w-full relative z-10">
        <div className="flex flex-col lg:flex-row gap-20 items-start">
          
          <div className="lg:sticky lg:top-40 space-y-10 flex-1">
            <div>
              <span className="text-primary font-black tracking-[0.5em] uppercase text-[10px]">Reservaciones</span>
              <h1 className="text-slate-900 dark:text-slate-100 text-6xl md:text-7xl font-black mt-6 tracking-tighter leading-none">Tu mesa <br/>en el <span className="text-primary italic">Atlántico</span>.</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xl font-light leading-relaxed max-w-md">
              Asegura tu lugar en el barrio marinero. Cocina honesta, producto fresco y el sonido de las olas de fondo. Para grupos grandes, llámanos directamente.
            </p>
            <div className="pt-6 space-y-4">
               <p className="flex items-center gap-4 text-slate-400 font-bold uppercase tracking-widest text-xs">
                  <svg className="size-5 text-primary" fill="currentColor" viewBox="0 -960 960 960"><path d="M798-120q-125 0-247-54.5T329-329Q229-429 174.5-551T120-798q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T387-387q31 31 65.5 58.5T524-281l98-97q9-9 20-11t27 1l140 26q13 2 22.5 13t9.5 25v162q0 18-12 30t-30 12Z"/></svg>
                  +34 928 58 44 22
               </p>
            </div>
          </div>

          <div className="flex-[1.5] w-full border-l border-slate-100 dark:border-white/5 lg:pl-20 py-10">
            <form className="space-y-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-white/5 pb-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Nombre Completo</label>
                  <input className="bg-transparent text-2xl font-light text-slate-900 dark:text-white border-none focus:ring-0 p-0 placeholder:text-slate-200 dark:placeholder:text-slate-800" placeholder="Ej: Juan Pérez" type="text" />
                </div>
                <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-white/5 pb-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Teléfono</label>
                  <input className="bg-transparent text-2xl font-light text-slate-900 dark:text-white border-none focus:ring-0 p-0 placeholder:text-slate-200 dark:placeholder:text-slate-800" placeholder="+34 000 000 000" type="tel" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-white/5 pb-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Fecha</label>
                  <input className="bg-transparent text-2xl font-light text-slate-900 dark:text-white border-none focus:ring-0 p-0 appearance-none" type="date" />
                </div>
                <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-white/5 pb-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Invitados</label>
                  <div className="relative">
                    <select className="bg-transparent w-full text-2xl font-light text-slate-900 dark:text-white border-none focus:ring-0 p-0 appearance-none cursor-pointer">
                      <option>2 Personas</option>
                      <option>3 Personas</option>
                      <option>4 Personas</option>
                      <option>Más de 4</option>
                    </select>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-primary">
                      <svg className="size-6" fill="currentColor" viewBox="0 -960 960 960"><path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Notas Adicionales</label>
                <textarea className="bg-slate-50 dark:bg-white/5 rounded-[2rem] p-10 text-xl font-light text-slate-900 dark:text-white border-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-200" placeholder="¿Alguna alergia o preferencia de mesa?" rows={3}></textarea>
              </div>

              <div className="pt-10">
                <button className="relative w-full h-20 overflow-hidden group rounded-[2rem] shadow-2xl shadow-primary/30">
                  <div className="absolute inset-0 bg-primary transition-transform duration-500 group-hover:scale-110"></div>
                  <span className="relative z-10 text-white font-black uppercase tracking-[0.4em] text-sm">Confirmar Reserva</span>
                </button>
              </div>

              <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10">
                <p className="text-xs text-center text-slate-500 font-medium leading-relaxed">
                  Las reservas están sujetas a disponibilidad. <br/> Te contactaremos personalmente para confirmar tu solicitud.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
