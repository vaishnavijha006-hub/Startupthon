import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Domains from '@/components/sections/Domains';
import Guidelines from '@/components/sections/Guidelines';
import Faqs from '@/components/sections/Faqs';
import SectionSeparator from '@/components/ui/SectionSeparator';
import { Award, PhoneOff } from 'lucide-react';
import { ORGANIZERS } from '@/data/organizers';
import { isValidOrganizerPhone, getTelHref, formatDisplayPhone } from '@/utils/organizerPhone';

// ---------------------------------------------------------------------------
// Phone icon SVG (reused across cards)
// ---------------------------------------------------------------------------
function PhoneIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 5.91 5.91l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// ContactSection — validates each organizer's phone with ^[0-9]{10}$ before
// rendering. Invalid / missing numbers show a graceful fallback card with no
// tel: link — no broken "Call Now" button is ever produced.
// ---------------------------------------------------------------------------
function ContactSection() {
  return (
    <section className="relative z-10 px-4 pb-16 pt-4 sm:px-6 lg:px-8" aria-label="Contact">
      <div className="mx-auto max-w-4xl text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-laser-cyan/70 mb-2">
          Support
        </p>
        <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-text-primary sm:text-3xl mb-3">
          For Further Queries
        </h2>
        <p className="text-text-secondary mb-8">
          Feel free to reach out to our coordinators — we're happy to help!
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {ORGANIZERS.map((organizer) => {
            // Strict validation: phone MUST match ^[0-9]{10}$ exactly.
            const valid = isValidOrganizerPhone(organizer.phone);
            const telHref = valid ? getTelHref(organizer.phone) : null;
            const displayPhone = valid ? formatDisplayPhone(organizer.phone) : null;

            // --- Invalid / missing number: graceful fallback (no tel: link) ---
            if (!valid || !telHref || !displayPhone) {
              return (
                <div
                  key={organizer.name}
                  className="flex items-center gap-4 border border-gunmetal/40 bg-gunmetal/5 px-6 py-4 clip-angular w-full sm:w-auto opacity-60"
                  aria-label={`${organizer.name} — contact unavailable`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-gunmetal/40 bg-gunmetal/10 text-text-secondary clip-angular-sm">
                    <PhoneOff className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="text-left">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-text-secondary/70">Coordinator</p>
                    <p className="font-display font-bold text-text-primary">{organizer.name}</p>
                    <p className="font-mono text-sm text-text-secondary/60">Contact unavailable</p>
                  </div>
                </div>
              );
            }

            // --- Valid 10-digit number: render clickable tel: card ---
            return (
              <a
                key={organizer.name}
                href={telHref}
                className="flex items-center gap-4 border border-laser-cyan/40 bg-laser-cyan/5 px-6 py-4 shadow-[0_0_16px_rgba(0,229,255,0.06)] clip-angular hover:bg-laser-cyan/10 transition-colors group w-full sm:w-auto"
                aria-label={`Call ${organizer.name} at ${displayPhone}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-laser-cyan/40 bg-laser-cyan/10 text-laser-cyan clip-angular-sm">
                  <PhoneIcon />
                </div>
                <div className="text-left">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-laser-cyan/70">Coordinator</p>
                  <p className="font-display font-bold text-text-primary group-hover:text-laser-cyan transition-colors">
                    {organizer.name}
                  </p>
                  <p className="font-mono text-sm text-text-secondary">{displayPhone}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LandingPage() {
  return (
    <>
      <Hero />
      <section className="relative z-10 px-4 pb-10 sm:px-6 lg:px-8" aria-label="Physical certificate benefit">
        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-4 border border-laser-cyan/40 bg-laser-cyan/5 px-6 py-6 text-center shadow-[0_0_24px_rgba(0,229,255,0.08)] clip-angular sm:flex-row sm:px-8 sm:py-7 sm:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-laser-cyan/40 bg-laser-cyan/10 text-laser-cyan clip-angular-sm">
            <Award className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-laser-cyan/70">
              Participant Benefit
            </p>
            <p className="mt-1 font-display text-lg font-bold uppercase leading-snug tracking-wider text-text-primary sm:text-xl">
              Physical certificate for every successfully registered participant
            </p>
          </div>
        </div>
      </section>
      <About />
      <SectionSeparator />
      <Domains />
      <SectionSeparator />
      <Guidelines />
      <SectionSeparator />
      <Faqs />
      <SectionSeparator />
      <ContactSection />
    </>
  );
}

export default LandingPage;
