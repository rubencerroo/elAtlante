import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useCallback, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Carta from './pages/Carta';
import Reservations from './pages/Reservations';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import WaiterPanel from './pages/WaiterPanel';
import SetPassword from './pages/SetPassword';
import ConfirmReservation from './pages/ConfirmReservation';
import CancelReservation from './pages/CancelReservation';
import LegalNotice from './pages/LegalNotice';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import NotFound from './pages/NotFound';
import { registerSW } from 'virtual:pwa-register';
import CookieBanner from './components/CookieBanner';
import { useIdleTimer } from './hooks/useIdleTimer';
import { isTabletAuthorized, setActiveStaffId, getActiveStaffId, getStaffRole, signOut } from './services/authStore';
import { useNavigate } from 'react-router-dom';
import { loadTables } from './utils/tableConfig';
import SleepModeScreen from './components/admin/SleepModeScreen';

function PWASetup() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  useEffect(() => {
    if (isAdmin) {
      // 1. Add manifest link
      let manifestLink = document.querySelector('link[rel="manifest"]');
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.setAttribute('rel', 'manifest');
        manifestLink.setAttribute('href', '/manifest.webmanifest');
        document.head.appendChild(manifestLink);
      }

      // 2. Add PWA meta tags
      const metaTags = [
        { name: 'theme-color', content: '#1e3a8a' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
      ];

      metaTags.forEach(tag => {
        let meta = document.querySelector(`meta[name="${tag.name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', tag.name);
          meta.setAttribute('content', tag.content);
          document.head.appendChild(meta);
        }
      });

      let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
      if (!appleIcon) {
        appleIcon = document.createElement('link');
        appleIcon.setAttribute('rel', 'apple-touch-icon');
        appleIcon.setAttribute('href', '/apple-touch-icon.png');
        document.head.appendChild(appleIcon);
      }

      // 3. Register SW
      registerSW({ immediate: true });
    }
  }, [isAdmin]);

  return null;
}

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
  const navigate = useNavigate();
  const isAdmin = pathname.startsWith('/admin');
  const isCartaRoute = pathname === '/carta';

  // Sleep mode state
  const [isSleepMode, setIsSleepMode] = useState(false);
  const [sleepRole, setSleepRole] = useState<'owner' | 'waiter' | null>(null);

  // Activate sleep mode (captures current role before locking)
  const activateSleep = useCallback(() => {
    if (isTabletAuthorized() && getActiveStaffId()) {
      const role = getStaffRole();
      setSleepRole(role as 'owner' | 'waiter' | null);
      setIsSleepMode(true);
    }
  }, []);

  // Wake from sleep: fully sign out and go to login
  const handleWake = useCallback(async () => {
    setIsSleepMode(false);
    try { await signOut(); } catch { setActiveStaffId(null); }
    navigate('/admin');
  }, [navigate]);

  // Listen for manual sleep trigger from panels via custom event
  useEffect(() => {
    const handler = () => activateSleep();
    window.addEventListener('force-sleep-mode', handler);
    return () => window.removeEventListener('force-sleep-mode', handler);
  }, [activateSleep]);

  useIdleTimer({
    timeout: 15 * 60 * 1000, // 15 minutes
    onIdle: activateSleep,
    enabled: isAdmin && isTabletAuthorized() && pathname !== '/admin' && !isSleepMode
  });
  
  // Protection logic removed to allow SEO indexing

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark font-['Work_Sans',sans-serif] selection:bg-primary selection:text-white">
      {!isAdmin && !isCartaRoute && (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10"></div>
        </div>
      )}

      {!isAdmin && !isCartaRoute && <Header />}
      
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/carta" element={<Carta />} />
          <Route path="/reservar" element={<Reservations />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/owner" element={<AdminPanel />} />
          <Route path="/admin/waiter" element={<WaiterPanel />} />
          <Route path="/admin/set-password" element={<SetPassword />} />
          <Route path="/confirm" element={<ConfirmReservation />} />
          <Route path="/cancelada" element={<CancelReservation />} />
          <Route path="/aviso-legal" element={<LegalNotice />} />
          <Route path="/privacidad" element={<PrivacyPolicy />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!isAdmin && !isCartaRoute && <Footer />}
      <CookieBanner />

      {/* Sleep Mode Overlay */}
      {isSleepMode && (
        <SleepModeScreen role={sleepRole} onWake={handleWake} />
      )}
    </div>
  );
}

function App() {
  useEffect(() => {
    loadTables();
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <PWASetup />
      <AppLayout />
    </Router>
  );
}

export default App;
