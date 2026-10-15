import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ChevronRight, AlertTriangle, Home, MessageCircle, GraduationCap, ExternalLink } from 'lucide-react';
import HudCorners from '@/components/ui/HudCorners';
import type { TeamType, Participant, StartupIdea } from '@/types';

const WHATSAPP_GROUP_URL =
  'https://chat.whatsapp.com/IhxMLThxl5zIMDegXRhYIh?s=cl&p=a&mlu=4&ilr=4';

interface PendingRegistration {
  teamType: TeamType;
  participants: Participant[];
  idea: StartupIdea;
  draftId: string;
  /** Set only when the backend confirmed the registration */
  registrationId?: string;
  registrationNumber?: number;
  createdAt?: string;
}

function RegistrationConfirmation() {
  const [data, setData] = useState<PendingRegistration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('pendingRegistration');
    if (stored) {
      const parsed = JSON.parse(stored);
      setData(parsed);
    }
    setLoading(false);
  }, []);

  /** True when we received a confirmed registrationId from the backend */
  const isConfirmed = Boolean(data?.registrationId);

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center pt-24 pb-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Success header */}
        <div className="relative steel-panel p-8 text-center clip-angular sm:p-12">
          <HudCorners className="absolute inset-0" />

          {/* Success icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-laser-cyan/50 bg-laser-cyan/10">
            <CheckCircle className="h-10 w-10 text-laser-cyan" />
          </div>

          <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-text-primary sm:text-4xl">
            {loading
              ? 'Loading Registration...'
              : data
              ? isConfirmed
                ? 'Registration Confirmed'
                : 'Submission Saved Locally'
              : 'Registration Not Found'}
          </h1>
          <p className="mt-4 text-text-secondary">
            {loading
              ? 'Checking for your registration details.'
              : data
              ? isConfirmed
                ? 'Your registration has been successfully submitted and confirmed by the server.'
                : 'Your details are saved in this browser as a draft. This is not an official event registration; final status will be available once the registration system is connected.'
              : 'No registration data was found. Please complete the registration form first.'}
          </p>

          {/* Details */}
          {loading ? null : data ? (
            <div className="mt-8 space-y-4 text-left">
              {/* Physical certificate benefit */}
              <div className="flex items-start gap-3 border border-laser-violet/30 bg-laser-violet/5 p-4">
                <GraduationCap className="h-5 w-5 shrink-0 text-laser-violet" aria-hidden="true" />
                <div>
                  <p className="font-display text-sm font-semibold uppercase tracking-wider text-text-primary">
                    Physical Certificate Benefit
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                    {isConfirmed
                      ? 'You will receive a physical copy of your certificate according to the event\u2019s certificate distribution process.'
                      : 'Once your registration is officially completed, you will be eligible to receive a physical copy of your certificate according to the event\u2019s certificate distribution process.'}
                  </p>
                </div>
              </div>

              {/* Registration details grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label={isConfirmed ? 'Registration Number' : 'Draft Reference ID'}
                  value={isConfirmed ? `#${data.registrationNumber}` : data.draftId}
                  mono
                />
                <DetailItem label="Team Type" value={data.teamType === 'solo' ? 'Solo' : 'Duo'} />
                <DetailItem label="Startup Idea Title" value={data.idea.title} />
                <DetailItem label="Domain" value={data.idea.domain || '—'} />
              </div>

              {/* Participant names */}
              <div className="border-t border-gunmetal pt-4">
                <span className="mb-2 block font-display text-xs uppercase tracking-wider text-text-secondary">
                  Participants
                </span>
                {data.participants.map((p, i) => (
                  <p key={i} className="text-sm text-text-primary">
                    {p.fullName || `Member ${i + 1}`}
                    {p.email && <span className="text-text-secondary"> — {p.email}</span>}
                  </p>
                ))}
              </div>

              {/* ── WhatsApp Group Invitation (only for confirmed registrations) ── */}
              {isConfirmed ? (
                <div className="overflow-hidden border border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.08)]">
                  {/* Section header */}
                  <div className="flex items-center gap-3 border-b border-emerald-500/20 bg-emerald-500/10 px-5 py-3">
                    <MessageCircle className="h-5 w-5 text-emerald-400" />
                    <h2 className="font-display text-sm font-bold uppercase tracking-wider text-emerald-300">
                      Join Our Official WhatsApp Group
                    </h2>
                  </div>
                  {/* Body */}
                  <div className="px-5 py-5 space-y-4">
                    <p className="text-sm leading-relaxed text-text-secondary">
                      Join our official WhatsApp group to receive important Startupthon
                      announcements, event updates, deadlines, instructions, and other
                      important information.
                    </p>
                    <a
                      href={WHATSAPP_GROUP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      id="whatsapp-group-link"
                      className="btn-laser btn-pressed focus-cyan group inline-flex items-center justify-center gap-2.5 border border-emerald-500/60 bg-emerald-500/15 px-7 py-3.5 font-display text-sm font-semibold uppercase tracking-wider text-emerald-300 transition-all hover:bg-emerald-500/25 hover:shadow-[0_0_24px_rgba(16,185,129,0.3)] clip-angular-sm"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Join Our Official WhatsApp Group
                      <ExternalLink className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-0.5" />
                    </a>
                    <p className="text-xs text-text-secondary/70">
                      Clicking the button above will open the WhatsApp group invitation
                      in a new tab. Your registration is already saved — joining the
                      group does not create another registration.
                    </p>
                  </div>
                </div>
              ) : (
                /* Placeholder when backend has not confirmed */
                <div className="flex items-start gap-3 border border-laser-violet/20 bg-laser-violet/5 p-4">
                  <MessageCircle className="h-5 w-5 shrink-0 text-laser-violet" />
                  <div>
                    <p className="font-display text-sm font-semibold uppercase tracking-wider text-text-primary">
                      Official WhatsApp Group
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      The official WhatsApp group link will be available here once your
                      registration is confirmed by the server. Presentation details will
                      be communicated through WhatsApp.
                    </p>
                  </div>
                </div>
              )}

              {/* Draft notice — only shown when NOT confirmed */}
              {!isConfirmed && (
                <div className="flex items-start gap-3 border border-yellow-500/20 bg-yellow-500/5 p-4">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-400" />
                  <div>
                    <p className="text-xs text-text-secondary">
                      This is a draft confirmation. The Reference ID shown above is
                      temporary and will be replaced with an official Registration
                      Number once the server confirms your submission.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-8 border border-gunmetal bg-bg-primary/40 p-6 text-left">
              <p className="text-sm text-text-secondary">
                If you arrived here without submitting the form, please complete your registration first.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/register"
              className="btn-laser inline-flex items-center justify-center gap-2 border border-metallic/30 bg-gunmetal/40 px-6 py-3 font-display text-sm font-semibold uppercase tracking-wider text-text-primary transition-all hover:border-metallic/60"
            >
              Register Another Idea
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              to="/"
              className="btn-laser inline-flex items-center justify-center gap-2 border border-laser-cyan/50 bg-laser-cyan/10 px-6 py-3 font-display text-sm font-semibold uppercase tracking-wider text-laser-cyan transition-all hover:bg-laser-cyan/20"
            >
              <Home className="h-4 w-4" />
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="border border-gunmetal bg-bg-primary/40 p-4">
      <span className="mb-1 block font-display text-xs uppercase tracking-wider text-text-secondary">
        {label}
      </span>
      <span className={`${mono ? 'font-mono' : 'font-body'} text-sm text-text-primary break-words`}>
        {value}
      </span>
    </div>
  );
}

export default RegistrationConfirmation;
