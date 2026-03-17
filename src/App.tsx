import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Reservations from './pages/Reservations';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import WaiterPanel from './pages/WaiterPanel';
import LegalNotice from './pages/LegalNotice';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import ComingSoon from './pages/ComingSoon';
import { useState } from 'react';

// Scroll to top component to reset scroll on route change
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

function AppLayout() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  
  // Protection logic
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return localStorage.getItem('el_atlante_unlocked') === 'true';
  });

  const handleUnlock = () => {
    localStorage.setItem('el_atlante_unlocked', 'true');
    setIsUnlocked(true);
  };

  if (!isUnlocked) {
    return <ComingSoon onUnlock={handleUnlock} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark font-['Work_Sans',sans-serif] selection:bg-primary selection:text-white">
      {!isAdmin && (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10"></div>
        </div>
      )}

      {!isAdmin && <Header />}
      
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reservar" element={<Reservations />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/owner" element={<AdminPanel />} />
          <Route path="/admin/waiter" element={<WaiterPanel />} />
          <Route path="/aviso-legal" element={<LegalNotice />} />
          <Route path="/privacidad" element={<PrivacyPolicy />} />
          <Route path="/cookies" element={<CookiePolicy />} />
        </Routes>
      </main>

      {!isAdmin && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppLayout />
    </Router>
  );
}

export default App;
