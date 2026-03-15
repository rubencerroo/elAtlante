import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Reservations from './pages/Reservations';

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

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-slate-50 dark:bg-background-dark font-['Work_Sans',sans-serif] selection:bg-primary selection:text-white">
        {/* Dynamic Background Gradients */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10"></div>
        </div>

        <Header />
        
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/reservar" element={<Reservations />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
