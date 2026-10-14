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

function AppLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="relative min-h-screen">
      <LaserBackground />
      <CursorLight />
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
