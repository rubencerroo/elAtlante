import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logoWhite from '../assets/logowhite.png';

import { useSystemTheme } from '../hooks/useTheme';

export default function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('inicio');
  const isDark = useSystemTheme();

  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveSection('');
      return;
    }

    const observerOptions = {
      root: null,
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    const sections = ['inicio', 'nosotros'];
    sections.forEach(id => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [location.pathname]);

  useSystemTheme();

  useEffect(() => {
    let scrollTimer: ReturnType<typeof setTimeout> | null = null;

    const controlNavbar = () => {
      const currentScrollY = window.scrollY;

      setIsAtTop(currentScrollY < 50);

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);

      // Hide solid background while scrolling, show it only when stopped
      setIsScrolling(true);
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => setIsScrolling(false), 150);
    };

    window.addEventListener('scroll', controlNavbar, { passive: true });
    return () => {
      window.removeEventListener('scroll', controlNavbar);
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, [lastScrollY]);

  // Handle anchor link clicks for Home page
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const id = target.replace('/#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const navLink = (section: string, label: string, href: string, isLink = false, isExternal = false) => {
    const isActive = activeSection === section || (href !== '/' && location.pathname === href);
    const cls = `text-[11px] font-semibold tracking-widest uppercase transition-colors duration-200 whitespace-nowrap ${isActive ? 'text-white' : 'text-white/40 hover:text-white/80'
      }`;
    return isExternal
      ? <a key={section} className={cls} href={href} target="_blank" rel="noopener noreferrer">{label}</a>
      : isLink
        ? <Link key={section} className={cls} to={href}>{label}</Link>
        : <a key={section} className={cls} href={href} onClick={(e) => handleAnchorClick(e, href)}>{label}</a>;
  };

  const pdfUrl = i18n.language.startsWith('en')
    ? (isDark ? '/assets/pdf/carta_en_dark.pdf' : '/assets/pdf/carta_en.pdf')
    : (isDark ? '/assets/pdf/carta_es_dark.pdf' : '/assets/pdf/carta_es.pdf');

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] transition-transform duration-500 ease-in-out
      ${isVisible || isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>

      <div className={`transition-all duration-300
        ${isMobileMenuOpen
          ? 'bg-gradient-to-b from-black/80 to-transparent backdrop-blur-md'
          : isAtTop || isScrolling
            ? 'bg-gradient-to-b from-black/60 to-transparent'
            : 'bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/[0.04]'
        }`}>

        {/* ── DESKTOP ── */}
        <div className="hidden md:flex relative items-center px-12 h-[64px]">
          <nav className="flex items-center gap-10 flex-1">
            {navLink('inicio', t('nav.inicio'), '/', true)}
            {navLink('nosotros', t('nav.nosotros'), '/#nosotros')}
            {navLink('carta', t('nav.carta'), pdfUrl, false, true)}
          </nav>
          <Link to="/" className="absolute left-1/2 -translate-x-1/2">
            <img src={logoWhite} alt="El Atlante" className="h-20 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-5 flex-1 justify-end">
            <div className="flex items-center gap-3">
              {(['ES', 'EN'] as const).map((l, i) => (
                <span key={l} className="flex items-center gap-3">
                  {i > 0 && <span className="w-px h-3 bg-white/20 block" />}
                  <button
                    onClick={() => { i18n.changeLanguage(l.toLowerCase()); localStorage.setItem('lang', l.toLowerCase()); }}
                    className={`text-[11px] font-semibold tracking-widest uppercase transition-colors duration-200 ${i18n.language.toUpperCase() === l ? 'text-white' : 'text-white/35 hover:text-white/60'
                      }`}
                  >{l}</button>
                </span>
              ))}
            </div>
            {location.pathname !== '/reservar' && (
              <Link to="/reservar" className="inline-flex items-center h-9 px-5 rounded-full bg-white/10 border border-white/15 text-white text-[11px] font-semibold tracking-wide hover:bg-white hover:text-black transition-all duration-300">
                {t('nav.reservar')}
              </Link>
            )}
          </div>
        </div>

        {/* ── MOBILE ── row 1: logo centrado + hamburger; row 2: nav expandible */}
        <div className="flex md:hidden flex-col overflow-hidden">

          {/* Fila 1: logo centrado + hamburger */}
          <div className="relative flex items-center justify-center h-[64px] px-4">
            {/* Logo siempre centrado */}
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="z-10"
            >
              <img src={logoWhite} alt="El Atlante" className="h-10 w-auto object-contain" />
            </Link>

            {/* Hamburger → X, anclado a la derecha */}
            <button
              className="absolute right-4 flex flex-col justify-center items-center w-8 h-8 gap-[5px]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menú"
            >
              <span className={`block w-5 h-[1.5px] bg-white transition-all duration-300 origin-center ${isMobileMenuOpen ? 'rotate-45 translate-y-[6.5px]' : ''}`} />
              <span className={`block h-[1.5px] bg-white transition-all duration-300 ${isMobileMenuOpen ? 'w-0 opacity-0' : 'w-5'}`} />
              <span className={`block w-5 h-[1.5px] bg-white transition-all duration-300 origin-center ${isMobileMenuOpen ? '-rotate-45 -translate-y-[6.5px]' : ''}`} />
            </button>
          </div>

          {/* Fila 2: nav + idioma, se expande/contrae */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-24 opacity-100 pb-4' : 'max-h-0 opacity-0'
              }`}
          >
            <div className="flex items-center justify-center gap-6 px-4">
              {[
                { section: 'inicio', label: t('nav.inicio'), href: '/', isLink: true as const },
                { section: 'nosotros', label: t('nav.nosotros'), href: '/#nosotros', isLink: false as const },
                { section: 'carta', label: t('nav.carta'), href: pdfUrl, isExternal: true as const },
              ].map(({ section, label, href, isLink, isExternal }, i) => {
                const isActive = activeSection === section || (href !== '/' && location.pathname === href);
                const cls = `text-[12px] font-semibold tracking-widest uppercase whitespace-nowrap transition-colors duration-200 ${isActive ? 'text-white' : 'text-white/45'}`;
                const style = { transitionDelay: isMobileMenuOpen ? `${i * 40}ms` : '0ms' };
                return isExternal
                  ? <a key={section} href={href} target="_blank" rel="noopener noreferrer" className={cls} style={style} onClick={() => setIsMobileMenuOpen(false)}>{label}</a>
                  : isLink
                    ? <Link key={section} to={href} className={cls} style={style} onClick={() => setIsMobileMenuOpen(false)}>{label}</Link>
                    : <a key={section} href={href} className={cls} style={style} onClick={(e) => { setIsMobileMenuOpen(false); handleAnchorClick(e, href); }}>{label}</a>;
              })}

              {/* Separador */}
              <span className="w-px h-4 bg-white/20 block" />

              {/* Idioma */}
              {(['ES', 'EN'] as const).map((l, i) => (
                <span key={l} className="flex items-center gap-2">
                  {i > 0 && <span className="w-px h-3 bg-white/20 block" />}
                  <button
                    onClick={() => { i18n.changeLanguage(l.toLowerCase()); localStorage.setItem('lang', l.toLowerCase()); }}
                    className={`text-[11px] font-semibold tracking-widest uppercase transition-colors duration-200 ${i18n.language.toUpperCase() === l ? 'text-white' : 'text-white/35 hover:text-white/60'
                      }`}
                  >{l}</button>
                </span>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
