import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight } from 'lucide-react';
import { Logo } from './Logo';

const NAV_LINKS = [
  { label: 'Home', to: '/', section: 'top' },
  { label: 'About', to: '/#about', section: 'about' },
  { label: 'Domains', to: '/#domains', section: 'domains' },
  { label: 'Guidelines', to: '/#guidelines', section: 'guidelines' },
  { label: 'FAQs', to: '/#faqs', section: 'faqs' },
];

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('top');
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);

      // Detect active section
      const sections = ['about', 'domains', 'guidelines', 'faqs'];
      let current = 'top';
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom >= 120) {
            current = id;
            break;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (section: string) => {
    if (location.pathname !== '/') return false;
    return activeSection === section;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top laser line */}
      <div className="h-px bg-gradient-to-r from-transparent via-laser-cyan/50 to-transparent" />

      <nav
        className={`steel-panel border-x-0 border-t-0 transition-all duration-300 ${
          scrolled ? 'bg-bg-secondary/95 shadow-[0_4px_24px_rgba(0,0,0,0.4)]' : ''
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <Logo className="h-9 w-9" />
            <div className="flex flex-col leading-none">
              <span className="font-display text-sm font-bold uppercase tracking-wider text-text-primary">
                CodezY
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-laser-cyan/70">
                Startup Pitch
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`group relative px-4 py-2 font-display text-sm font-medium uppercase tracking-wider transition-colors ${
                  isActive(link.section)
                    ? 'text-laser-cyan'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {link.label}
                <span
                  className={`absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 bg-laser-cyan transition-all duration-300 ${
                    isActive(link.section) ? 'w-8' : 'w-0 group-hover:w-6'
                  }`}
                />
              </Link>
            ))}
            <Link
              to="/register"
              className="btn-laser btn-pressed focus-cyan ml-3 inline-flex items-center gap-1.5 border border-laser-cyan/50 bg-laser-cyan/10 px-5 py-2 font-display text-sm font-semibold uppercase tracking-wider text-laser-cyan transition-all hover:bg-laser-cyan/20 hover:shadow-[0_0_20px_rgba(0,229,255,0.25)] clip-angular-sm"
            >
              Register Now
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="flex items-center justify-center p-2 text-text-primary transition-colors hover:text-laser-cyan lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-gunmetal bg-bg-secondary/95 backdrop-blur-md lg:hidden">
            <div className="flex flex-col gap-1 px-4 py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between border-l-2 px-4 py-3 font-display text-sm font-medium uppercase tracking-wider transition-all hover:bg-gunmetal/30 hover:text-laser-cyan ${
                    isActive(link.section)
                      ? 'border-laser-cyan bg-laser-cyan/5 text-laser-cyan'
                      : 'border-transparent text-text-secondary hover:border-laser-cyan'
                  }`}
                >
                  {link.label}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ))}
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="mt-2 inline-flex items-center justify-center gap-1.5 border border-laser-cyan/50 bg-laser-cyan/10 px-5 py-3 font-display text-sm font-semibold uppercase tracking-wider text-laser-cyan clip-angular-sm"
              >
                Register Now
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
