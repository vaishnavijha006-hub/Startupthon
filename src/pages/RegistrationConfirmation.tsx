import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ChevronRight, AlertTriangle, Home, MessageCircle } from 'lucide-react';
import HudCorners from '@/components/ui/HudCorners';
import type { TeamType, Participant, StartupIdea } from '@/types';

interface PendingRegistration {
  teamType: TeamType;
  participants: Participant[];
  idea: StartupIdea;
  draftId: string;
}

function RegistrationConfirmation() {
  const [data, setData] = useState<PendingRegistration | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('pendingRegistration');
    if (stored) {
      setData(JSON.parse(stored));
    }
  }, []);

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
            Registration Received
          </h1>
          <p className="mt-4 text-text-secondary">
            Your submission has been recorded locally. Final confirmation will be issued
            once the backend registration system is connected.
          </p>

          {/* Details */}
          {data ? (
            <div className="mt-8 space-y-4 text-left">
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem label="Draft Reference ID" value={data.draftId} mono />
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

              {/* WhatsApp notice */}
              <div className="flex items-start gap-3 border border-laser-violet/20 bg-laser-violet/5 p-4">
                <MessageCircle className="h-5 w-5 shrink-0 text-laser-violet" />
                <div>
                  <p className="font-display text-sm font-semibold uppercase tracking-wider text-text-primary">
                    Official WhatsApp Group
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    The official WhatsApp group link will be shared here once the
                    backend is connected. Presentation details will be communicated
                    through WhatsApp.
                  </p>
                </div>
              </div>

              {/* Notice */}
              <div className="flex items-start gap-3 border border-yellow-500/20 bg-yellow-500/5 p-4">
                <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-400" />
                <div>
                  <p className="text-xs text-text-secondary">
                    This is a draft confirmation. The Registration ID shown above is
                    temporary and will be replaced with an official ID once the backend
                    registration system is active.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 border border-gunmetal bg-bg-primary/40 p-6 text-left">
              <p className="text-sm text-text-secondary">
                No registration data found. If you arrived here without submitting the
                form, please complete your registration first.
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
