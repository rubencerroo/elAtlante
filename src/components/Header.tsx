import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoWhite from '../assets/logowhite.png';
import logoBlack from '../assets/logoblack.png';

export default function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('inicio');

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
    
    const sections = ['inicio', 'nosotros', 'carta'];
    sections.forEach(id => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [location.pathname]);

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        return 'dark';
      }
      return 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      
      // At the very top
      setIsAtTop(currentScrollY < 50);

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // scrolling down
        setIsVisible(false);
      } else {
        // scrolling up
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlNavbar, { passive: true });
    return () => {
      window.removeEventListener('scroll', controlNavbar);
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

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] flex justify-center px-4 pt-6 transition-all duration-500 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 fill-mode-forwards'}`}>
      <header className={`glass flex items-center justify-between w-full max-w-5xl rounded-full px-6 py-3 transition-all duration-300 ${isAtTop ? 'bg-white/10' : 'bg-white/40 shadow-2xl shadow-black/10'}`}>
        <div className="flex items-center gap-4">
          <button 
            className="md:hidden text-slate-800 dark:text-slate-200"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? (
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <Link to="/" className="flex items-center gap-3 text-primary group" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="h-10 transition-transform group-hover:scale-105">
            <img 
              src={theme === 'dark' ? logoWhite : logoBlack} 
              alt="El Atlante" 
              className="h-full w-auto object-contain"
            />
          </div>
        </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-10">
          <Link 
            className={`relative text-[10px] font-black uppercase tracking-[0.3em] transition-colors hover:text-primary ${activeSection === 'inicio' ? 'text-primary after:scale-x-100' : 'text-slate-900 dark:text-slate-100 after:scale-x-0'} after:content-[''] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:bg-primary after:transition-transform after:duration-300`} 
            to="/"
          >
            Inicio
          </Link>
          <a 
            className={`relative text-[10px] font-black uppercase tracking-[0.3em] transition-colors hover:text-primary ${activeSection === 'nosotros' ? 'text-primary after:scale-x-100' : 'text-slate-900 dark:text-slate-100 after:scale-x-0'} after:content-[''] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:bg-primary after:transition-transform after:duration-300`} 
            href="/#nosotros" 
            onClick={(e) => handleAnchorClick(e, '/#nosotros')}
          >
            Nosotros
          </a>
          <a 
            className={`relative text-[10px] font-black uppercase tracking-[0.3em] transition-colors hover:text-primary ${activeSection === 'carta' ? 'text-primary after:scale-x-100' : 'text-slate-900 dark:text-slate-100 after:scale-x-0'} after:content-[''] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:bg-primary after:transition-transform after:duration-300`} 
            href="/#carta" 
            onClick={(e) => handleAnchorClick(e, '/#carta')}
          >
            Carta
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors"
            aria-label="Toggle Dark Mode"
          >
            {theme === 'dark' ? (
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          {location.pathname !== '/reservar' && (
            <Link to="/reservar" className="flex min-w-[120px] cursor-pointer items-center justify-center rounded-full h-10 px-6 btn-primary-high text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
              Reservar
            </Link>
          )}
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-[80px] left-4 right-4 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-slate-100 dark:border-white/5 z-[90]">
          <nav className="flex flex-col py-6 px-8 gap-6">
            <Link 
              className={`text-sm font-black uppercase tracking-[0.2em] w-full border-b border-slate-200 dark:border-white/10 pb-4 transition-colors ${activeSection === 'inicio' ? 'text-primary' : 'text-slate-900 dark:text-white'}`} 
              to="/" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Inicio
            </Link>
            <a 
              className={`text-sm font-black uppercase tracking-[0.2em] w-full border-b border-slate-200 dark:border-white/10 pb-4 transition-colors ${activeSection === 'nosotros' ? 'text-primary' : 'text-slate-900 dark:text-white'}`} 
              href="/#nosotros" 
              onClick={(e) => { setIsMobileMenuOpen(false); handleAnchorClick(e, '/#nosotros'); }}
            >
              Nosotros
            </a>
            <a 
              className={`text-sm font-black uppercase tracking-[0.2em] w-full pb-2 transition-colors ${activeSection === 'carta' ? 'text-primary' : 'text-slate-900 dark:text-white'}`} 
              href="/#carta" 
              onClick={(e) => { setIsMobileMenuOpen(false); handleAnchorClick(e, '/#carta'); }}
            >
              Carta
            </a>
          </nav>
        </div>
      )}
    </div>
  );
}
