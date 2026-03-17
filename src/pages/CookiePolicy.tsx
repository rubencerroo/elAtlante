
export default function CookiePolicy() {
  return (
    <div className="min-h-screen pt-28 pb-24 px-6 lg:px-28 flex flex-col items-center bg-white dark:bg-slate-950 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px] -z-10"></div>

      <div className="max-w-3xl w-full relative z-10">
        <header className="mb-16">
          <span className="text-primary font-bold tracking-[0.4em] uppercase text-[10px]">Configuración</span>
          <h1 className="text-slate-900 dark:text-slate-100 text-3xl md:text-4xl lg:text-5xl font-black mt-4 tracking-tight leading-tight">
            Política de <span className="text-primary italic">Cookies</span>
          </h1>
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-slate-600 dark:text-slate-400 font-light leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">1. Responsable</h2>
            <p>
              El responsable de esta página web y de las cookies que se instalan es FELRODEZ S.L., con NIF B76254267 y domicilio en Calle León y Castillo, 199, 35280 Santa Lucía de Tirajana, Las Palmas.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">2. ¿Qué son las Cookies?</h2>
            <p>
              Una cookie es un fichero que se descarga en su ordenador al acceder a determinadas páginas web. Las cookies permiten a una página web, entre otras cosas, almacenar y recuperar información sobre los hábitos de navegación de un usuario o de su equipo.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">3. Tipos de Cookies utilizadas</h2>
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                <h3 className="text-slate-900 dark:text-white font-bold mb-2">Cookies Técnicas (Necesarias)</h3>
                <p className="text-sm">Son aquellas que permiten al usuario la navegación a través de una página web y la utilización de las diferentes opciones o servicios que en ella existan como, por ejemplo, controlar el tráfico y la comunicación de datos o realizar la solicitud de inscripción en un evento.</p>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                <h3 className="text-slate-900 dark:text-white font-bold mb-2">Cookies de Personalización</h3>
                <p className="text-sm">Son aquellas que permiten al usuario acceder al servicio con algunas características de carácter general predefinidas en función de una serie de criterios en el terminal del usuario como por ejemplo el idioma o el tipo de navegador.</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">4. Desactivación de Cookies</h2>
            <p>
              Usted puede permitir, bloquear o eliminar las cookies instaladas en su equipo mediante la configuración de las opciones del navegador instalado en su ordenador:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Google Chrome</li>
              <li>Mozilla Firefox</li>
              <li>Internet Explorer/Edge</li>
              <li>Safari</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
