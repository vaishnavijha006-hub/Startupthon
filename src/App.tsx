import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import LaserBackground from '@/components/LaserBackground';
import CursorLight from '@/components/CursorLight';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LandingPage from '@/pages/LandingPage';
import RegistrationPage from '@/pages/RegistrationPage';
import RegistrationConfirmation from '@/pages/RegistrationConfirmation';
import AdminLogin from '@/pages/AdminLogin';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';

/**
 * Handles scroll behaviour on route / hash changes:
 *  – Hash present (e.g. /#about) → smooth-scroll to the element.
 *  – Pathname changed, no hash  → scroll to top.
 */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (hash) {
      // Small delay so the DOM is ready after a route transition
      const id = hash.replace('#', '');
      const timeout = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
      return () => clearTimeout(timeout);
    }

    // Only scroll to top when the path itself changes (not on initial mount)
    if (prevPathname.current !== pathname) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
    prevPathname.current = pathname;
  }, [pathname, hash]);

  return null;
}

function AppLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="relative min-h-screen">
      <LaserBackground />
      <CursorLight />
      <ScrollManager />
      <Navbar />
      <main className="relative z-10">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/registration-confirmation" element={<RegistrationConfirmation />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<AdminRouteGuard />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
