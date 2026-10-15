import { Link } from 'react-router-dom';
import { Instagram, Linkedin, ChevronRight } from 'lucide-react';
import { Logo } from './Logo';

const QUICK_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/#about' },
  { label: 'Domains', to: '/#domains' },
  { label: 'Guidelines', to: '/#guidelines' },
  { label: 'FAQs', to: '/#faqs' },
  { label: 'Register', to: '/register' },
];

function Footer() {
  return (
    <footer className="relative z-10 border-t border-gunmetal bg-bg-secondary/50">
      {/* Top laser line */}
      <div className="h-px bg-gradient-to-r from-transparent via-laser-cyan/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-3">
              <Logo className="h-10 w-10" />
              <div className="flex flex-col leading-none">
                <span className="font-display text-base font-bold uppercase tracking-wider text-text-primary">
                  CodezY
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-laser-cyan/70">
                  Startup Pitch
                </span>
              </div>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-text-secondary">
              Engineer the future. Bring your startup ideas to life and showcase your vision through CodezY Startup Pitch.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-laser-cyan">
              Navigation
            </h3>
            <ul className="grid grid-cols-2 gap-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="group flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-laser-cyan"
                  >
                    <ChevronRight className="h-3 w-3 text-laser-cyan/50 transition-transform group-hover:translate-x-1" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-laser-cyan">
              Connect
            </h3>
            <p className="mb-4 text-sm text-text-secondary">
              Follow us on social media for updates and announcements.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/_codezy"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                className="flex h-10 w-10 items-center justify-center border border-gunmetal bg-bg-primary/50 text-text-secondary transition-all hover:border-laser-cyan/50 hover:text-laser-cyan"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/showcase/codezyrkgitm/home/"
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn"
                className="flex h-10 w-10 items-center justify-center border border-gunmetal bg-bg-primary/50 text-text-secondary transition-all hover:border-laser-cyan/50 hover:text-laser-cyan"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gunmetal pt-6 sm:flex-row">
          <p className="font-mono text-xs text-text-secondary">
            © {new Date().getFullYear()} CodezY Startup Pitch. All rights reserved.
          </p>
          <p className="font-mono text-xs text-text-secondary">
            Built with precision for the next generation of innovators.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
