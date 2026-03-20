import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';

export default function Carta() {
  const { t, i18n } = useTranslation();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 768 : true
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Decide which PDF to show based on the active language
  const pdfFileName = i18n.language.startsWith('en') ? 'carta_en.pdf' : 'carta_es.pdf';
  const downloadUrl = `/assets/pdf/${pdfFileName}`;
  const pdfUrl = `/assets/pdf/${pdfFileName}#toolbar=0&navpanes=0&scrollbar=0&view=${isMobile ? 'FitH' : 'Fit'}`;

  return (
    <div className="min-h-screen pt-[64px] flex flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
      <SEO 
        title={`${t('nav.carta')} - El Atlante de San Cristóbal`}
        description="Nuestra carta completa. Tradición pesquera y producto Km 0."
      />
      
      {/* Container with Tiled Logo Background */}
      <div 
        className="flex-1 w-full flex items-center justify-center overflow-hidden relative bg-slate-50 dark:bg-slate-900"
        style={{
          // Tiled logo background. It's faint so it doesn't distract from the PDF text.
          backgroundImage: `url('/assets/logoblack.png')`,
          backgroundSize: '150px',
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay to fade the tiled background so it's a subtle watermark */}
        <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 z-0 mix-blend-normal"></div>

        {/* Fallback & Loading UI: fades out once the iframe triggers onLoad */}
        <div className={`absolute inset-0 z-0 flex flex-col items-center justify-center p-6 text-center transition-opacity duration-700 ${isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <svg className="w-8 h-8 text-primary animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p className="mb-6 text-slate-700 dark:text-slate-300 max-w-md mx-auto text-sm leading-relaxed relative z-10">
              {i18n.language.startsWith('en') 
                ? "Loading the PDF menu... If it doesn't load automatically, you can download it below." 
                : "Cargando la carta... Si no carga automáticamente, puedes descargarla a continuación."}
            </p>
            <a 
              href={downloadUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-8 py-4 btn-primary-high text-xs font-black uppercase tracking-widest rounded-full shadow-lg hover:scale-105 transition-transform relative z-10"
            >
              {i18n.language.startsWith('en') ? "Download Menu" : "Descargar Carta"}
            </a>
        </div>

        {/* 
          Iframe with PDF.
          In light mode: mix-blend-multiply makes the white background of the PDF transparent,
          allowing the logo watermark to show through!
          In dark mode: we invert the PDF (so it's dark with light text), hue-rotate to fix colors, 
          and use mix-blend-screen to make the dark background transparent.
        */}
        <iframe 
          key={pdfUrl} // Add key to force iframe reload if view mode changes
          src={pdfUrl}
          title="Menu PDF Viewer"
          onLoad={() => setIsLoaded(true)}
          className={`absolute inset-0 w-full h-full border-none z-10 transition-opacity duration-1000 ${isLoaded ? 'opacity-95 mix-blend-multiply dark:mix-blend-screen dark:filter dark:invert dark:hue-rotate-180' : 'opacity-0'}`}
          style={{ backgroundColor: 'transparent' }}
        />
      </div>
    </div>
  );
}
