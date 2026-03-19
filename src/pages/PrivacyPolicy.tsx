import SEO from '../components/SEO';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen pt-28 pb-24 px-6 lg:px-28 flex flex-col items-center bg-white dark:bg-slate-950 relative overflow-hidden">
      <SEO 
        title="Política de Privacidad"
        description="Información detallada sobre cómo tratamos tus datos personales en El Atlante de San Cristóbal."
        canonical="/privacidad"
      />
      {/* Background Decor ... existing code ... */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px] -z-10"></div>

      <div className="max-w-3xl w-full relative z-10">
        <header className="mb-16">
          <span className="text-primary dark:text-sky-400 font-bold tracking-[0.4em] uppercase text-[10px]">Privacidad</span>
          <h1 className="text-slate-900 dark:text-slate-100 text-3xl md:text-4xl lg:text-5xl font-black mt-4 tracking-tight leading-tight">
            Política de <span className="text-primary dark:text-sky-400 italic">Privacidad</span>
          </h1>
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-slate-600 dark:text-slate-400 font-light leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">1. Responsable del Tratamiento</h2>
            <p>
              El responsable del tratamiento de sus datos personales es FELRODEZ S.L., con domicilio en Calle León y Castillo, 199, 35280 Santa Lucía de Tirajana, Las Palmas.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">2. Finalidad del Tratamiento</h2>
            <p>
              Tratamos la información que nos facilita con las siguientes finalidades:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Gestión de Reservas:</strong> Tramitar y confirmar sus solicitudes de mesa en nuestro restaurante.</li>
              <li><strong>Atención al Cliente:</strong> Responder a sus consultas o peticiones de información.</li>
              <li><strong>Comunicaciones:</strong> En su caso, informar sobre cambios en su reserva o incidencias en el servicio.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">3. Legitimación</h2>
            <p>
              La base legal para el tratamiento de sus datos es la ejecución del servicio de reserva solicitado por usted y, en su caso, el consentimiento que nos otorga al marcar las casillas correspondientes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">4. Conservación de Datos</h2>
            <p>
              Los datos personales proporcionados se conservarán mientras se mantenga la relación comercial o durante los años necesarios para cumplir con las obligaciones legales.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">5. Derechos del Usuario</h2>
            <p>
              Usted tiene derecho a obtener confirmación sobre si estamos tratando sus datos personales, por tanto tiene derecho a acceder a sus datos personales, rectificar los datos inexactos o solicitar su supresión cuando los datos ya no sean necesarios.
              Para ejercer estos derechos, puede escribirnos a info@elatlante.com.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
