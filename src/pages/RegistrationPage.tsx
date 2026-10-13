import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Upload, X, AlertCircle, Loader2, User, Users } from 'lucide-react';
import HudCorners from '@/components/ui/HudCorners';
import { DOMAINS, ACADEMIC_YEDS } from '@/data/content';
import { validateRegistration, validateFile, hasErrors } from '@/utils/validation';
import type {
  TeamType,
  Participant,
  StartupIdea,
  RegistrationErrors,
} from '@/types';

const EMPTY_PARTICIPANT: Participant = {
  fullName: '',
  academicYear: '',
  section: '',
  rollNumber: '',
  phone: '',
  email: '',
};

const EMPTY_IDEA: StartupIdea = {
  title: '',
  description: '',
  domain: '',
  prototypeAvailable: null,
  sketchFileName: null,
};

function RegistrationPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [teamType, setTeamType] = useState<TeamType>('solo');
  const [participants, setParticipants] = useState<Participant[]>([
    { ...EMPTY_PARTICIPANT },
  ]);
  const [idea, setIdea] = useState<StartupIdea>({ ...EMPTY_IDEA });
  const [errors, setErrors] = useState<RegistrationErrors | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleTeamTypeChange = (type: TeamType) => {
    setTeamType(type);
    if (type === 'solo' && participants.length > 1) {
      setParticipants([participants[0]]);
    } else if (type === 'duo' && participants.length < 2) {
      setParticipants([participants[0], { ...EMPTY_PARTICIPANT }]);
    }
    setErrors(null);
  };

  const updateParticipant = (index: number, field: keyof Participant, value: string) => {
    setParticipants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateIdea = (field: keyof StartupIdea, value: string | boolean | null) => {
    setIdea((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      updateIdea('sketchFileName', null);
      return;
    }
    const fileError = validateFile(file);
    if (fileError) {
      setErrors((prev) => ({
        participants: prev?.participants || participants.map(() => ({})),
        idea: { ...(prev?.idea || {}), sketchFile: fileError },
      }));
      return;
    }
    updateIdea('sketchFileName', file.name);
    if (errors?.idea.sketchFile) {
      setErrors((prev) => ({
        participants: prev?.participants || [],
        idea: { ...prev!.idea, sketchFile: undefined },
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validateRegistration(teamType, participants, idea);
    setErrors(validationErrors);

    if (hasErrors(validationErrors)) {
      setSubmitError('Please correct the highlighted fields before submitting.');
      return;
    }

    // Backend integration pending — navigate to confirmation with form data
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      const draftId = `DRAFT-${Date.now()}`;
      const payload = {
        teamType,
        participants,
        idea,
        draftId,
      };
      sessionStorage.setItem('pendingRegistration', JSON.stringify(payload));
      navigate('/registration-confirmation');
    }, 800);
  };

  return (
    <div className="relative z-10 min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="h-px w-8 bg-laser-cyan/50" />
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-laser-cyan/70">
              System Access
            </span>
            <span className="h-px w-8 bg-laser-cyan/50" />
          </div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-text-primary sm:text-4xl md:text-5xl">
            Registration Terminal
          </h1>
          <p className="mt-4 text-text-secondary">
            Submit your startup idea and team details to enter the CodezY Startup Pitch.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* === Team Type Selection === */}
          <div className="relative steel-panel p-6 clip-angular sm:p-8">
            <HudCorners className="absolute inset-0" />
            <div className="mb-6 flex items-center gap-3">
              <StepIndicator step={1} />
              <h2 className="font-display text-lg font-semibold uppercase tracking-wider text-laser-cyan">
                Participation Type
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(['solo', 'duo'] as TeamType[]).map((type) => {
                const isSelected = teamType === type;
                const Icon = type === 'solo' ? User : Users;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTeamTypeChange(type)}
                    className={`group relative flex items-center gap-4 border p-5 transition-all ${
                      isSelected
                        ? 'border-laser-cyan bg-laser-cyan/10 shadow-[0_0_20px_rgba(0,229,255,0.15)]'
                        : 'border-gunmetal bg-bg-primary/40 hover:border-metallic/40'
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center border ${
                        isSelected ? 'border-laser-cyan text-laser-cyan' : 'border-gunmetal text-text-secondary'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <span className="block font-display text-base font-semibold uppercase tracking-wider text-text-primary">
                        {type === 'solo' ? 'Solo' : 'Duo'}
                      </span>
                      <span className="text-sm text-text-secondary">
                        {type === 'solo' ? 'One participant' : 'Two members'}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-laser-cyan animate-laser-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* === Participant Forms === */}
          {participants.map((participant, index) => (
            <div key={index} className="relative steel-panel p-6 clip-angular sm:p-8">
              <HudCorners className="absolute inset-0" />
              <div className="mb-6 flex items-center gap-3">
                <StepIndicator step={index + 2} />
                <h2 className="font-display text-lg font-semibold uppercase tracking-wider text-laser-cyan">
                  {teamType === 'duo' ? `Member ${index + 1}` : 'Participant Details'}
                </h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label="Full Name"
                  required
                  value={participant.fullName}
                  onChange={(v) => updateParticipant(index, 'fullName', v)}
                  error={errors?.participants[index]?.fullName}
                  placeholder="John Doe"
                />
                <FormField
                  label="Academic Year"
                  required
                  value={participant.academicYear}
                  onChange={(v) => updateParticipant(index, 'academicYear', v)}
                  error={errors?.participants[index]?.academicYear}
                  placeholder="2nd Year"
                  options={ACADEMIC_YEDS}
                />
                <FormField
                  label="Section"
                  required
                  value={participant.section}
                  onChange={(v) => updateParticipant(index, 'section', v)}
                  error={errors?.participants[index]?.section}
                  placeholder="A"
                />
                <FormField
                  label="Roll Number"
                  required
                  value={participant.rollNumber}
                  onChange={(v) => updateParticipant(index, 'rollNumber', v)}
                  error={errors?.participants[index]?.rollNumber}
                  placeholder="21CS001"
                />
                <FormField
                  label="Phone Number"
                  required
                  type="tel"
                  value={participant.phone}
                  onChange={(v) => updateParticipant(index, 'phone', v)}
                  error={errors?.participants[index]?.phone}
                  placeholder="+91 98765 43210"
                />
                <FormField
                  label="Email Address"
                  required
                  type="email"
                  value={participant.email}
                  onChange={(v) => updateParticipant(index, 'email', v)}
                  error={errors?.participants[index]?.email}
                  placeholder="student@example.com"
                />
              </div>
            </div>
          ))}

          {/* === Startup Idea === */}
          <div className="relative steel-panel p-6 clip-angular sm:p-8">
            <HudCorners className="absolute inset-0" />
            <div className="mb-6 flex items-center gap-3">
              <StepIndicator step={teamType === 'duo' ? 4 : 3} />
              <h2 className="font-display text-lg font-semibold uppercase tracking-wider text-laser-cyan">
                Startup Idea
              </h2>
            </div>

            <div className="space-y-5">
              <FormField
                label="Idea Title"
                required
                value={idea.title}
                onChange={(v) => updateIdea('title', v)}
                error={errors?.idea.title}
                placeholder="AI-Powered Waste Sorter"
              />

              <div>
                <label className="mb-2 block font-display text-sm font-medium uppercase tracking-wider text-text-secondary">
                  Idea Description <span className="text-laser-cyan">*</span>
                </label>
                <textarea
                  value={idea.description}
                  onChange={(e) => updateIdea('description', e.target.value)}
                  rows={5}
                  placeholder="Describe your startup idea, the problem it solves, and your approach..."
                  className={`w-full resize-none bg-bg-primary/50 px-4 py-3 text-text-primary placeholder:text-text-secondary/40 border ${
                    errors?.idea.description ? 'border-red-500/50' : 'border-gunmetal'
                  } font-body text-sm transition-colors focus:border-laser-cyan focus:outline-none focus:shadow-[0_0_12px_rgba(0,229,255,0.15)]`}
                />
                {errors?.idea.description && <FieldError message={errors.idea.description} />}
              </div>

              <div>
                <label className="mb-2 block font-display text-sm font-medium uppercase tracking-wider text-text-secondary">
                  Domain Selection <span className="text-laser-cyan">*</span>
                </label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {DOMAINS.map((domain) => {
                    const isSelected = idea.domain === domain.id;
                    return (
                      <button
                        key={domain.id}
                        type="button"
                        onClick={() => updateIdea('domain', domain.id)}
                        className={`border px-4 py-3 text-left transition-all ${
                          isSelected
                            ? 'border-laser-cyan bg-laser-cyan/10 shadow-[0_0_12px_rgba(0,229,255,0.1)]'
                            : 'border-gunmetal bg-bg-primary/40 hover:border-metallic/40'
                        }`}
                      >
                        <span className={`block font-display text-sm font-medium ${isSelected ? 'text-laser-cyan' : 'text-text-primary'}`}>
                          {domain.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {errors?.idea.domain && <FieldError message={errors.idea.domain} />}
              </div>

              <div>
                <label className="mb-2 block font-display text-sm font-medium uppercase tracking-wider text-text-secondary">
                  Prototype Available <span className="text-laser-cyan">*</span>
                </label>
                <div className="flex gap-4">
                  {[
                    { label: 'Yes', value: true },
                    { label: 'No', value: false },
                  ].map((opt) => {
                    const isSelected = idea.prototypeAvailable === opt.value;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => updateIdea('prototypeAvailable', opt.value)}
                        className={`flex-1 border px-4 py-3 font-display text-sm font-semibold uppercase tracking-wider transition-all sm:flex-none sm:px-8 ${
                          isSelected
                            ? 'border-laser-cyan bg-laser-cyan/10 text-laser-cyan'
                            : 'border-gunmetal bg-bg-primary/40 text-text-secondary hover:border-metallic/40'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {errors?.idea.prototypeAvailable && <FieldError message={errors.idea.prototypeAvailable} />}
              </div>

              {/* File upload */}
              <div>
                <label className="mb-2 block font-display text-sm font-medium uppercase tracking-wider text-text-secondary">
                  Optional Sketch / Blueprint Upload
                </label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    className="sr-only"
                  />
                  {idea.sketchFileName ? (
                    <div className="flex items-center justify-between border border-laser-cyan/30 bg-laser-cyan/5 px-4 py-3">
                      <span className="truncate font-mono text-sm text-laser-cyan">
                        {idea.sketchFileName}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          updateIdea('sketchFileName', null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-text-secondary hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 border border-dashed border-gunmetal px-4 py-8 text-text-secondary transition-all hover:border-laser-cyan/40 hover:text-laser-cyan"
                    >
                      <Upload className="h-5 w-5" />
                      <span className="font-display text-sm uppercase tracking-wider">
                        Click to upload (PNG, JPEG, WebP, PDF — max 5MB)
                      </span>
                    </button>
                  )}
                </div>
                {errors?.idea.sketchFile && <FieldError message={errors.idea.sketchFile} />}
              </div>
            </div>
          </div>

          {/* === Submit Error === */}
          {submitError && (
            <div className="flex items-center gap-3 border border-red-500/30 bg-red-500/10 px-4 py-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
              <span className="text-sm text-red-300">{submitError}</span>
            </div>
          )}

          {/* === Submit Button === */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="btn-laser btn-pressed focus-cyan inline-flex w-full items-center justify-center gap-2 border border-laser-cyan/50 bg-laser-cyan/10 px-8 py-4 font-display text-base font-semibold uppercase tracking-wider text-laser-cyan transition-all hover:bg-laser-cyan/20 hover:shadow-[0_0_30px_rgba(0,229,255,0.35)] disabled:cursor-not-allowed disabled:opacity-50 clip-angular-sm sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Submit Registration
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>
            <p className="font-mono text-xs text-text-secondary">
              Backend integration pending — registration data is not yet stored.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

// === Reusable form field ===
interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  options?: string[];
}

function FormField({ label, value, onChange, error, placeholder, required, type = 'text', options }: FormFieldProps) {
  return (
    <div>
      <label className="mb-2 block font-display text-sm font-medium uppercase tracking-wider text-text-secondary">
        {label} {required && <span className="text-laser-cyan">*</span>}
      </label>
      {options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-bg-primary/50 px-4 py-3 text-text-primary border ${
            error ? 'border-red-500/50' : 'border-gunmetal'
          } font-body text-sm transition-colors focus:border-laser-cyan focus:outline-none focus:shadow-[0_0_12px_rgba(0,229,255,0.15)] focus-visible:ring-2 focus-visible:ring-laser-cyan/30`}
        >
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-bg-primary/50 px-4 py-3 text-text-primary placeholder:text-text-secondary/40 border ${
            error ? 'border-red-500/50' : 'border-gunmetal'
          } font-body text-sm transition-colors focus:border-laser-cyan focus:outline-none focus:shadow-[0_0_12px_rgba(0,229,255,0.15)] focus-visible:ring-2 focus-visible:ring-laser-cyan/30`}
        />
      )}
      {error && <FieldError message={error} />}
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-laser-cyan/30 bg-laser-cyan/5 font-display text-lg font-bold text-laser-cyan clip-angular-sm">
      {String(step).padStart(2, '0')}
    </div>
  );
}

export default RegistrationPage;
