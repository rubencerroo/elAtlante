import SEO from '../components/SEO';

export default function LegalNotice() {
  return (
    <div className="min-h-screen pt-28 pb-24 px-6 lg:px-28 flex flex-col items-center bg-white dark:bg-slate-950 relative overflow-hidden">
      <SEO 
        title="Aviso Legal"
        description="Aviso legal y términos de uso del sitio web oficial de El Atlante de San Cristóbal."
        canonical="/aviso-legal"
      />
      {/* Background Decor ... existing code ... */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px] -z-10"></div>

      <div className="max-w-3xl w-full relative z-10">
        <header className="mb-16">
          <span className="text-primary font-bold tracking-[0.4em] uppercase text-[10px]">Información Legal</span>
          <h1 className="text-slate-900 dark:text-slate-100 text-3xl md:text-4xl lg:text-5xl font-black mt-4 tracking-tight leading-tight">
            Aviso <span className="text-primary italic">Legal</span>
          </h1>
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-slate-600 dark:text-slate-400 font-light leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">1. Datos Identificativos</h2>
            <p>
              En cumplimiento con el deber de información recogido en artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico, a continuación se reflejan los siguientes datos:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Titular:</strong> FELRODEZ S.L.</li>
              <li><strong>NIF:</strong> B76254267</li>
              <li><strong>Domicilio:</strong> Calle León y Castillo, 199, 35280 Santa Lucía de Tirajana, Las Palmas</li>
              <li><strong>Email:</strong> info@elatlante.com</li>
              <li><strong>Teléfono:</strong> +34 928 58 44 22</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">2. Usuarios</h2>
            <p>
              El acceso y/o uso de este portal atribuye la condición de USUARIO, que acepta, desde dicho acceso y/o uso, las Condiciones Generales de Uso aquí reflejadas. Las citadas Condiciones serán de aplicación independientemente de las Condiciones Generales de Contratación que en su caso resulten de obligado cumplimiento.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">3. Uso del Portal</h2>
            <p>
              El portal proporciona el acceso a multitud de informaciones, servicios, programas o datos (en adelante, "los contenidos") en Internet pertenecientes a El Atlante o a sus licenciantes a los que el USUARIO pueda tener acceso.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">4. Propiedad Intelectual e Industrial</h2>
            <p>
              El Atlante por sí o como cesionaria, es titular de todos los derechos de propiedad intelectual e industrial de su página web, así como de los elementos contenidos en la misma (a título enunciativo, imágenes, sonido, audio, vídeo, software o textos; marcas o logotipos, combinaciones de colores, estructura y diseño, selección de materiales usados, programas de ordenador necesarios para su funcionamiento, acceso y uso, etc.).
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
