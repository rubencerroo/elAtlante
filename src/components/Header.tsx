import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();

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
        <Link to="/" className="flex items-center gap-3 text-primary group">
          <div className="size-8 transition-transform group-hover:rotate-12">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z" fill="currentColor" fillRule="evenodd"></path>
            </svg>
          </div>
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-black tracking-tighter">El Atlante</h2>
        </Link>
        
        <nav className="hidden md:flex items-center gap-10">
          <Link className="text-slate-900 dark:text-slate-100 text-[10px] font-black uppercase tracking-[0.3em] hover:text-primary transition-colors" to="/">Inicio</Link>
          <a className="text-slate-900 dark:text-slate-100 text-[10px] font-black uppercase tracking-[0.3em] hover:text-primary transition-colors" href="/#carta" onClick={(e) => handleAnchorClick(e, '/#carta')}>Carta</a>
          <a className="text-slate-900 dark:text-slate-100 text-[10px] font-black uppercase tracking-[0.3em] hover:text-primary transition-colors" href="/#nosotros" onClick={(e) => handleAnchorClick(e, '/#nosotros')}>Nosotros</a>
        </nav>

        <Link to="/reservar" className="flex min-w-[120px] cursor-pointer items-center justify-center rounded-full h-10 px-6 bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20">
          Reservar
        </Link>
      </header>
    </div>
  );
}
