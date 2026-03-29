import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/core/lib/supabase';
import { ALLERGENS } from '@/core/lib/constants';
import { useAuth } from '@/core/contexts/AuthContext';
import { toast } from 'sonner';

// ─── Constants ───────────────────────────────────────────────────────────────

const LEONIDA_RED = '#b52619';
const API_BASE = import.meta.env.VITE_BACKEND_URL ?? '';

const AI_PLANS = ['self_coached_ai', 'coach_pro'];

const STEP_LABELS = ['ACCOUNT', 'BODY', 'FUEL', 'DRIVE'] as const;

// In RegistrationPage only — local addition for the "clear all" UX
const ALLERGENS_WITH_NONE = [
  ...ALLERGENS,
  { id: 'none' as const, label: 'NONE ✓' },
] as const;

const ACTIVITY_OPTIONS = [
  { id: 'desk', label: 'DESK', desc: 'Mostly sitting. Office or study.' },
  { id: 'light', label: 'LIGHT', desc: 'Regular walks, some movement.' },
  { id: 'moderate', label: 'MODERATE', desc: 'Physical job or regular sport.' },
  { id: 'very_active', label: 'VERY ACTIVE', desc: 'Manual labour or 2× training/day.' },
] as const;

const INTENSITY_LEVELS = [
  { key: 'very_conservative', label: 'VERY SLOW' },
  { key: 'conservative',      label: 'SLOW'      },
  { key: 'moderate',          label: 'MODERATE'  },
  { key: 'aggressive',        label: 'FAST'      },
  { key: 'very_aggressive',   label: 'MAX'       },
] as const;

type GoalRateKey = typeof INTENSITY_LEVELS[number]['key'];

const GOAL_RATE_DB_MAP: Record<GoalRateKey, 'conservative' | 'moderate' | 'aggressive'> = {
  very_conservative: 'conservative',
  conservative:      'conservative',
  moderate:          'moderate',
  aggressive:        'aggressive',
  very_aggressive:   'aggressive',
};

function getKcalDelta(goal: FormData['goal'], rate: GoalRateKey): string {
  const loseDeficits: Record<GoalRateKey, number> = {
    very_conservative: -150,
    conservative:      -300,
    moderate:          -500,
    aggressive:        -750,
    very_aggressive:   -1000,
  };
  const gainSurplus: Record<GoalRateKey, number> = {
    very_conservative: +50,
    conservative:      +150,
    moderate:          +300,
    aggressive:        +500,
    very_aggressive:   +700,
  };
  if (goal === 'lose_fat') {
    const d = loseDeficits[rate];
    return `${d} kcal/day`;
  }
  if (goal === 'build_muscle') {
    const s = gainSurplus[rate];
    return `+${s} kcal/day`;
  }
  return '±0 kcal/day';
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  email: string;
  password: string;
  sex: 'male' | 'female' | 'other' | null;
  dob: string;
  height: number;
  heightUnit: 'cm' | 'ft';
  weight: number;
  weightUnit: 'kg' | 'lbs';
  goal: 'lose_fat' | 'recomp' | 'build_muscle' | 'maintain' | null;
  goalRate: 'very_conservative' | 'conservative' | 'moderate' | 'aggressive' | 'very_aggressive';
  dietFramework: 'omnivore' | 'pescatarian' | 'vegetarian' | 'vegan' | null;
  mealsPerDay: 3 | 4 | 5 | null;
  hardNos: string[];
  activityLevel: 'desk' | 'light' | 'moderate' | 'very_active' | null;
  gymDaysPerWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6 | null;
}

interface InviteData {
  coach_name: string;
  invitee_email: string;
  status: string;
  expires_at: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block font-mono-manifesto text-xs tracking-widest uppercase text-black mb-2">
      {children}
    </span>
  );
}

function BottomRuleInput(props: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  const { hasError, className: _cls, style, ...rest } = props;
  return (
    <input
      {...rest}
      className="w-full bg-transparent border-0 border-b border-black outline-none focus:outline-none text-black py-1 text-base"
      style={{
        borderBottomColor: hasError ? LEONIDA_RED : undefined,
        borderBottomWidth: hasError ? 2 : undefined,
        ...style,
      }}
    />
  );
}

function SegBtn({
  label,
  selected,
  onClick,
  className = '',
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-mono-manifesto text-xs uppercase tracking-widest py-2 px-3 rounded-none border border-black transition-colors cursor-pointer ${
        selected ? 'bg-black text-white' : 'bg-white text-black'
      } ${className}`}
    >
      {label}
    </button>
  );
}

function PrimaryBtn({
  children,
  disabled,
  onClick,
  color = 'black',
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  color?: 'black' | 'red';
}) {
  const bg = color === 'red' ? LEONIDA_RED : '#000';
  const hoverBg = color === 'red' ? '#000' : '#fff';
  const hoverColor = color === 'red' ? '#fff' : '#000';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full font-mono-manifesto uppercase tracking-widest text-sm py-3 rounded-none border-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        backgroundColor: bg,
        borderColor: bg,
        color: '#fff',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.backgroundColor = hoverBg;
          el.style.borderColor = bg;
          el.style.color = hoverColor;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.backgroundColor = bg;
          el.style.borderColor = bg;
          el.style.color = '#fff';
        }
      }}
    >
      {children}
    </button>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center">
        {STEP_LABELS.map((_, i) => (
          <div key={i} className="flex items-center flex-1">
            {/* Segment before dot */}
            <div
              className="flex-1"
              style={{
                height: i < step ? 2 : 1,
                backgroundColor: i < step ? '#000' : '#d6d6d6',
              }}
            />
            {/* Dot */}
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 0,
                backgroundColor: i === step ? LEONIDA_RED : i < step ? '#000' : '#d6d6d6',
                flexShrink: 0,
              }}
            />
            {/* Segment after dot (only for non-last) */}
            {i < STEP_LABELS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: i < step ? 2 : 1,
                  backgroundColor: i < step ? '#000' : '#d6d6d6',
                }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex mt-2">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex-1 text-center">
            <span
              className="font-mono-manifesto uppercase tracking-widest"
              style={{
                fontSize: 10,
                color: i === step ? '#000' : '#aaa',
                fontWeight: i === step ? 700 : 400,
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Completion State ─────────────────────────────────────────────────────────

function CompletionState() {
  return (
    <div className="pt-8">
      <style>{`
        @keyframes scan {
          from { width: 0% }
          to { width: 100% }
        }
        .scan-line {
          animation: scan 1.5s linear infinite;
        }
      `}</style>
      <div className="w-full bg-[#d6d6d6] relative overflow-hidden" style={{ height: 2 }}>
        <div
          className="scan-line absolute left-0 top-0 h-full"
          style={{ backgroundColor: LEONIDA_RED }}
        />
      </div>
      <h1 className="font-display text-2xl font-semibold text-black mt-8">
        BUILDING YOUR PLAN
      </h1>
    </div>
  );
}

// ─── Slider with custom thumb ─────────────────────────────────────────────────

function ManifestoSlider({
  min,
  max,
  value,
  onChange,
  step = 1,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <>
      <style>{`
        .manifesto-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 2px;
          background: #000;
          outline: none;
          cursor: pointer;
        }
        .manifesto-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          background: #000;
          border-radius: 0;
          cursor: pointer;
        }
        .manifesto-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: #000;
          border-radius: 0;
          border: none;
          cursor: pointer;
        }
        .manifesto-slider::-webkit-slider-runnable-track {
          height: 2px;
          background: #000;
        }
        .manifesto-slider::-moz-range-track {
          height: 2px;
          background: #000;
        }
      `}</style>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="manifesto-slider"
      />
    </>
  );
}

// ─── Age calculation ──────────────────────────────────────────────────────────

function calcAge(dob: string): number | null {
  if (!dob || dob.length < 10) return null;
  // dob is in YYYY-MM-DD from the date input
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 && age < 120 ? age : null;
}

// ─── Unit conversions ─────────────────────────────────────────────────────────

function cmToFtDisplay(cm: number): string {
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${ft}'${inches}"`;
}

function kgToLbs(kg: number): number {
  return Math.round(kg * 2.2046);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RegistrationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session } = useAuth();

  const planParam = searchParams.get('plan') ?? '';
  const inviteParam = searchParams.get('invite') ?? '';

  // ── Invite state
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(inviteParam !== '');

  // ── Form state
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [completing, setCompleting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    sex: null,
    dob: '',
    height: 175,
    heightUnit: 'cm',
    weight: 75,
    weightUnit: 'kg',
    goal: null,
    goalRate: 'moderate',
    dietFramework: null,
    mealsPerDay: null,
    hardNos: ['none'],
    activityLevel: null,
    gymDaysPerWeek: null,
  });

  // ── Step 0 email check state
  const [emailExists, setEmailExists] = useState(false);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);

  // ── Step 1 intensity expand
  const [intensityExpanded, setIntensityExpanded] = useState(false);

  const update = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ── Load invite on mount
  useEffect(() => {
    if (!inviteParam) return;

    const endpoint = `${API_BASE}/invitations/${encodeURIComponent(inviteParam)}`;
    fetch(endpoint)
      .then(async (res) => {
        if (res.status === 404 || res.status === 410) {
          setInviteError('This invitation has expired or is invalid.');
          return;
        }
        if (!res.ok) {
          setInviteError('Could not load invitation. Please try again.');
          return;
        }
        const data: InviteData = await res.json();
        setInviteData(data);
        update('email', data.invitee_email);
      })
      .catch(() => setInviteError('Could not load invitation. Please try again.'))
      .finally(() => setInviteLoading(false));
  }, [inviteParam, update]);

  // ── Email blur check
  const handleEmailBlur = useCallback(async () => {
    if (!formData.email || inviteParam) return;
    setEmailCheckLoading(true);
    try {
      const endpoint = `${API_BASE}/auth/check-email`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      if (res.ok) {
        const data = await res.json();
        setEmailExists(!!data.exists);
      }
    } catch {
      // silently ignore network errors on check
    } finally {
      setEmailCheckLoading(false);
    }
  }, [formData.email, inviteParam]);

  // ── Finish registration
  const handleFinish = useCallback(async () => {
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) {
        toast.error(signUpError.message || 'Failed to create account. Please try again.');
        return;
      }

      // Supabase silently returns no session for duplicate emails when email confirmation is on
      if (signUpData.user?.identities?.length === 0) {
        toast.error('An account with this email already exists. Sign in instead.');
        return;
      }

      if (!signUpData.session) {
        toast.success('Check your inbox — confirm your email to continue.');
        return;
      }

      setCompleting(true);

      const session = signUpData.session;
      const token = session?.access_token;

      const endpoint = `${API_BASE}/auth/complete-registration`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          plan: planParam || 'self_coached',
          invite_token: inviteParam || null,
          gender: formData.sex,
          dob: formData.dob,
          height: formData.height,
          height_unit: formData.heightUnit,
          initial_weight: formData.weight,
          weight_unit: formData.weightUnit,
          unit_system: formData.weightUnit === 'kg' ? 'metric' : 'imperial',
          goal: formData.goal,
          goal_rate: GOAL_RATE_DB_MAP[formData.goalRate],
          activity_level: formData.activityLevel,
          gym_days_per_week: formData.gymDaysPerWeek,
          diet_framework: formData.dietFramework,
          meal_frequency: formData.mealsPerDay === 5 ? 5 : formData.mealsPerDay,
          hard_nos: formData.hardNos.filter((x) => x !== 'none'),
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Registration failed');
        throw new Error(errText);
      }

      const isCoachPlan = planParam === 'coach' || planParam === 'coach_pro';
      navigate(isCoachPlan ? '/dashboard' : '/tracker', { replace: true });
    } catch (err: unknown) {
      setCompleting(false);
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      toast.error(message);
    }
  }, [formData, planParam, inviteParam, navigate]);

  // ─── Existing session + invite: Accept/Decline ────────────────────────────

  if (session && inviteParam) {
    const handleAccept = async () => {
      const endpoint = `${API_BASE}/invitations/accept`;
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ token: inviteParam }),
      });
      navigate('/tracker', { replace: true });
    };

    const coachName = inviteData?.coach_name ?? '…';

    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-[480px]">
          <Link
            to="/"
            className="font-mono-manifesto text-sm tracking-widest uppercase text-black no-underline"
          >
            LEONIDA
          </Link>
          <div className="h-1 bg-black w-full mt-2 mb-8" />

          <h1 className="font-display text-2xl font-semibold text-black mb-4">
            Accept coaching invitation
          </h1>
          <p className="font-body text-base text-black mb-8">
            from {coachName}?
          </p>

          <div className="flex gap-3">
            <PrimaryBtn onClick={handleAccept}>ACCEPT</PrimaryBtn>
            <button
              type="button"
              onClick={() => navigate('/tracker', { replace: true })}
              className="flex-1 font-mono-manifesto uppercase tracking-widest text-sm py-3 rounded-none border border-black bg-white text-black cursor-pointer hover:bg-black hover:text-white transition-colors"
            >
              DECLINE
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Invite loading / error ───────────────────────────────────────────────

  if (inviteParam && inviteLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <span className="font-mono-manifesto text-xs tracking-widest uppercase text-black/40">
          LOADING…
        </span>
      </div>
    );
  }

  if (inviteParam && inviteError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-[480px]">
          <Link
            to="/"
            className="font-mono-manifesto text-sm tracking-widest uppercase text-black no-underline"
          >
            LEONIDA
          </Link>
          <div className="h-1 bg-black w-full mt-2 mb-8" />
          <p className="font-body text-base text-black mb-4">{inviteError}</p>
          <Link
            to="/register"
            className="font-mono-manifesto text-xs tracking-widest uppercase no-underline hover:underline"
            style={{ color: LEONIDA_RED }}
          >
            Register without invite →
          </Link>
        </div>
      </div>
    );
  }

  // ─── Completing state ─────────────────────────────────────────────────────

  if (completing) {
    return (
      <div className="min-h-screen bg-white px-4 py-8">
        <div className="w-full max-w-[480px] mx-auto">
          <CompletionState />
        </div>
      </div>
    );
  }

  // ─── Main form shell ──────────────────────────────────────────────────────

  const isAiPlan = AI_PLANS.includes(planParam);

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="w-full max-w-[480px] mx-auto">
        {/* Wordmark */}
        <Link
          to="/"
          className="font-mono-manifesto text-sm tracking-widest uppercase text-black no-underline"
        >
          LEONIDA
        </Link>

        {/* 4px black rule */}
        <div className="h-1 bg-black w-full mt-2 mb-4" />

        {/* Plan badge */}
        {planParam && (
          <div className="inline-flex items-center gap-2 mb-3">
            <div
              className="w-2 h-2 rounded-none flex-shrink-0"
              style={{ backgroundColor: isAiPlan ? LEONIDA_RED : '#000' }}
            />
            <span className="font-mono-manifesto text-xs tracking-widest uppercase text-black">
              {planParam.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
        )}

        {/* Invite badge */}
        {inviteData && (
          <div className="mb-3">
            <span className="block font-mono-manifesto text-xs tracking-widest uppercase text-black/50">
              INVITED BY
            </span>
            <span className="font-body text-base text-black">{inviteData.coach_name}</span>
          </div>
        )}

        {/* Step indicator */}
        <StepIndicator step={step} />

        {/* Step content */}
        {step === 0 && (
          <Step0
            formData={formData}
            update={update}
            emailExists={emailExists}
            emailCheckLoading={emailCheckLoading}
            onEmailBlur={handleEmailBlur}
            inviteParam={inviteParam}
            onContinue={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <Step1
            formData={formData}
            update={update}
            intensityExpanded={intensityExpanded}
            setIntensityExpanded={setIntensityExpanded}
            onBack={() => setStep(0)}
            onContinue={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <Step2
            formData={formData}
            update={update}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <Step3
            formData={formData}
            update={update}
            onBack={() => setStep(2)}
            onFinish={handleFinish}
          />
        )}
      </div>
    </div>
  );
}

// ─── Step 0 — ACCOUNT ────────────────────────────────────────────────────────

function Step0({
  formData,
  update,
  emailExists,
  emailCheckLoading,
  onEmailBlur,
  inviteParam,
  onContinue,
}: {
  formData: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  emailExists: boolean;
  emailCheckLoading: boolean;
  onEmailBlur: () => void;
  inviteParam: string;
  onContinue: () => void;
}) {
  const passwordTooShort = formData.password.length > 0 && formData.password.length < 8;
  const canContinue =
    formData.email.length > 0 &&
    !emailExists &&
    !emailCheckLoading &&
    formData.password.length >= 8;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-black mb-8">YOUR ACCOUNT</h1>

      {/* EMAIL */}
      <div className="mb-6">
        <Label>EMAIL</Label>
        <BottomRuleInput
          id="email"
          type="email"
          autoComplete="email"
          value={formData.email}
          readOnly={!!inviteParam}
          hasError={emailExists}
          onChange={(e) => update('email', e.target.value)}
          onBlur={onEmailBlur}
          placeholder=""
        />
        {emailExists && (
          <p className="font-mono-manifesto text-xs mt-1" style={{ color: LEONIDA_RED }}>
            An account with this email exists.{' '}
            <Link
              to="/login"
              className="underline"
              style={{ color: LEONIDA_RED }}
            >
              Sign in →
            </Link>
          </p>
        )}
      </div>

      {/* PASSWORD */}
      <div className="mb-8">
        <Label>PASSWORD</Label>
        <BottomRuleInput
          id="password"
          type="password"
          autoComplete="new-password"
          value={formData.password}
          hasError={passwordTooShort}
          onChange={(e) => update('password', e.target.value)}
          placeholder=""
        />
        {passwordTooShort && (
          <p className="font-mono-manifesto text-xs mt-1" style={{ color: LEONIDA_RED }}>
            Minimum 8 characters
          </p>
        )}
      </div>

      <PrimaryBtn disabled={!canContinue} onClick={onContinue}>
        CONTINUE →
      </PrimaryBtn>
    </div>
  );
}

// ─── Step 1 — BODY ───────────────────────────────────────────────────────────

function Step1({
  formData,
  update,
  intensityExpanded,
  setIntensityExpanded,
  onBack,
  onContinue,
}: {
  formData: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  intensityExpanded: boolean;
  setIntensityExpanded: (v: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const age = calcAge(formData.dob);

  const heightMin = formData.heightUnit === 'cm' ? 100 : 48; // 4ft = 48in
  const heightMax = formData.heightUnit === 'cm' ? 250 : 84; // 7ft = 84in
  const heightDisplay =
    formData.heightUnit === 'cm'
      ? `${formData.height} cm`
      : cmToFtDisplay(formData.height);

  const weightMin = formData.weightUnit === 'kg' ? 30 : 66;
  const weightMax = formData.weightUnit === 'kg' ? 200 : 440;
  const weightDisplay =
    formData.weightUnit === 'kg'
      ? `${formData.weight} kg`
      : `${kgToLbs(formData.weight)} lbs`;

  const intensityIndex = INTENSITY_LEVELS.findIndex((l) => l.key === formData.goalRate);
  const kcalDelta = getKcalDelta(formData.goal, formData.goalRate as GoalRateKey);

  const canContinue =
    formData.sex !== null &&
    formData.dob.length === 10 &&
    formData.goal !== null;

  function toggleHeightUnit() {
    const next = formData.heightUnit === 'cm' ? 'ft' : 'cm';
    // Convert: if switching to ft, clamp height to inch scale (48-84), map from cm
    if (next === 'ft') {
      const inches = Math.round(formData.height / 2.54);
      update('height', Math.min(84, Math.max(48, inches)));
    } else {
      // switching to cm from inches
      const cm = Math.round(formData.height * 2.54);
      update('height', Math.min(250, Math.max(100, cm)));
    }
    update('heightUnit', next);
  }

  function toggleWeightUnit() {
    const next = formData.weightUnit === 'kg' ? 'lbs' : 'kg';
    if (next === 'lbs') {
      update('weight', Math.min(440, Math.max(66, kgToLbs(formData.weight))));
    } else {
      const kg = Math.round(formData.weight / 2.2046);
      update('weight', Math.min(200, Math.max(30, kg)));
    }
    update('weightUnit', next);
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="font-mono-manifesto text-xs uppercase tracking-widest text-black/50 cursor-pointer bg-transparent border-0 hover:text-black mb-6 block"
      >
        ← BACK
      </button>
      <h1 className="font-display text-2xl font-semibold text-black mb-1">BODY</h1>
      <p className="font-body text-sm text-black/60 mb-6">Baseline math.</p>

      {/* SEX */}
      <div className="mb-6">
        <Label>SEX</Label>
        <div className="flex gap-2">
          {(['male', 'female', 'other'] as const).map((s) => (
            <SegBtn
              key={s}
              label={s.toUpperCase()}
              selected={formData.sex === s}
              onClick={() => update('sex', s)}
            />
          ))}
        </div>
      </div>

      {/* DATE OF BIRTH */}
      <div className="mb-6">
        <Label>DATE OF BIRTH</Label>
        <BottomRuleInput
          id="dob"
          type="date"
          value={formData.dob}
          onChange={(e) => update('dob', e.target.value)}
        />
        {age !== null && (
          <p className="font-mono-manifesto text-xs text-black/60 mt-1">{age} years old</p>
        )}
      </div>

      {/* HEIGHT */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <Label>HEIGHT</Label>
          <div className="flex gap-1">
            {(['cm', 'ft'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={toggleHeightUnit}
                className={`font-mono-manifesto text-xs uppercase cursor-pointer bg-transparent border-0 ${
                  formData.heightUnit === u
                    ? 'font-bold underline text-black'
                    : 'text-black/50'
                }`}
              >
                {u.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <ManifestoSlider
              min={heightMin}
              max={heightMax}
              value={formData.height}
              onChange={(v) => update('height', v)}
            />
          </div>
          <span className="font-mono-manifesto text-xs w-16 text-right">{heightDisplay}</span>
        </div>
      </div>

      {/* CURRENT WEIGHT */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <Label>CURRENT WEIGHT</Label>
          <div className="flex gap-1">
            {(['kg', 'lbs'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={toggleWeightUnit}
                className={`font-mono-manifesto text-xs uppercase cursor-pointer bg-transparent border-0 ${
                  formData.weightUnit === u
                    ? 'font-bold underline text-black'
                    : 'text-black/50'
                }`}
              >
                {u.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <ManifestoSlider
              min={weightMin}
              max={weightMax}
              value={formData.weight}
              onChange={(v) => update('weight', v)}
            />
          </div>
          <span className="font-mono-manifesto text-xs w-16 text-right">{weightDisplay}</span>
        </div>
      </div>

      {/* PRIMARY GOAL */}
      <div className="mb-6">
        <Label>PRIMARY GOAL</Label>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'lose_fat', label: 'LOSE FAT' },
              { id: 'recomp', label: 'RECOMP' },
              { id: 'build_muscle', label: 'BUILD MUSCLE' },
              { id: 'maintain', label: 'MAINTAIN' },
            ] as const
          ).map(({ id, label }) => (
            <SegBtn
              key={id}
              label={label}
              selected={formData.goal === id}
              onClick={() => update('goal', id)}
            />
          ))}
        </div>
      </div>

      {/* INTENSITY */}
      <div className="mb-8">
        {!intensityExpanded ? (
          <button
            type="button"
            onClick={() => setIntensityExpanded(true)}
            className="font-mono-manifesto text-xs uppercase tracking-widest text-black/50 cursor-pointer bg-transparent border-0 hover:text-black"
          >
            Set intensity →
          </button>
        ) : (
          <>
            <Label>INTENSITY</Label>
            <ManifestoSlider
              min={0}
              max={4}
              value={intensityIndex === -1 ? 2 : intensityIndex}
              onChange={(v) => update('goalRate', INTENSITY_LEVELS[v].key)}
            />
            <div className="flex justify-between mt-1">
              <span className="font-mono-manifesto text-[10px] text-black/50">Very Slow</span>
              <span className="font-mono-manifesto text-[10px] text-black font-bold">
                {INTENSITY_LEVELS[intensityIndex === -1 ? 2 : intensityIndex].label}
                {(formData.goal === 'lose_fat' || formData.goal === 'build_muscle') && (
                  <span className="font-normal text-black/60"> · {kcalDelta}</span>
                )}
              </span>
              <span className="font-mono-manifesto text-[10px] text-black/50">Max</span>
            </div>
          </>
        )}
      </div>

      <PrimaryBtn disabled={!canContinue} onClick={onContinue}>
        CONTINUE →
      </PrimaryBtn>
    </div>
  );
}

// ─── Step 2 — FUEL ───────────────────────────────────────────────────────────

function Step2({
  formData,
  update,
  onBack,
  onContinue,
}: {
  formData: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  function toggleAllergen(id: string) {
    if (id === 'none') {
      update('hardNos', ['none']);
      return;
    }
    const without = formData.hardNos.filter((x) => x !== 'none' && x !== id);
    const has = formData.hardNos.includes(id);
    const next = has ? without : [...without, id];
    update('hardNos', next.length === 0 ? ['none'] : next);
  }

  const canContinue =
    formData.dietFramework !== null &&
    formData.mealsPerDay !== null &&
    formData.hardNos.length > 0;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="font-mono-manifesto text-xs uppercase tracking-widest text-black/50 cursor-pointer bg-transparent border-0 hover:text-black mb-6 block"
      >
        ← BACK
      </button>
      <h1 className="font-display text-2xl font-semibold text-black mb-1">FUEL</h1>
      <p className="font-body text-sm text-black/60 mb-6">Plan adherence.</p>

      {/* DIET FRAMEWORK */}
      <div className="mb-6">
        <Label>DIET FRAMEWORK</Label>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'omnivore', label: 'OMNIVORE' },
              { id: 'pescatarian', label: 'PESCATARIAN' },
              { id: 'vegetarian', label: 'VEGETARIAN' },
              { id: 'vegan', label: 'VEGAN' },
            ] as const
          ).map(({ id, label }) => (
            <SegBtn
              key={id}
              label={label}
              selected={formData.dietFramework === id}
              onClick={() => update('dietFramework', id)}
            />
          ))}
        </div>
      </div>

      {/* MEALS PER DAY */}
      <div className="mb-6">
        <Label>MEALS PER DAY</Label>
        <div className="flex gap-2">
          {([3, 4, 5] as const).map((n) => (
            <SegBtn
              key={n}
              label={n === 5 ? '5+' : String(n)}
              selected={formData.mealsPerDay === n}
              onClick={() => update('mealsPerDay', n)}
            />
          ))}
        </div>
      </div>

      {/* HARD NO'S */}
      <div className="mb-8">
        <Label>HARD NO'S</Label>
        <p className="font-body text-xs text-black/60 mb-3">
          Select all that apply. We will never suggest these.
        </p>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS_WITH_NONE.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => toggleAllergen(id)}
              className={`font-mono-manifesto text-xs uppercase tracking-widest py-2 px-3 rounded-none border border-black cursor-pointer transition-colors ${
                formData.hardNos.includes(id)
                  ? 'bg-black text-white'
                  : 'bg-white text-black'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <PrimaryBtn disabled={!canContinue} onClick={onContinue}>
        CONTINUE →
      </PrimaryBtn>
    </div>
  );
}

// ─── Step 3 — DRIVE ──────────────────────────────────────────────────────────

function Step3({
  formData,
  update,
  onBack,
  onFinish,
}: {
  formData: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  onBack: () => void;
  onFinish: () => void;
}) {
  const canFinish = formData.activityLevel !== null && formData.gymDaysPerWeek !== null;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="font-mono-manifesto text-xs uppercase tracking-widest text-black/50 cursor-pointer bg-transparent border-0 hover:text-black mb-6 block"
      >
        ← BACK
      </button>
      <h1 className="font-display text-2xl font-semibold text-black mb-1">DRIVE</h1>
      <p className="font-body text-sm text-black/60 mb-6">Activity &amp; volume.</p>

      {/* LIFESTYLE ACTIVITY */}
      <div className="mb-6">
        <Label>LIFESTYLE ACTIVITY</Label>
        <div className="flex flex-col gap-2">
          {ACTIVITY_OPTIONS.map(({ id, label, desc }) => {
            const selected = formData.activityLevel === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => update('activityLevel', id)}
                className={`w-full flex items-center justify-between py-3 px-4 rounded-none border cursor-pointer transition-colors text-left ${
                  selected
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-black'
                }`}
              >
                <span className="font-mono-manifesto text-xs uppercase tracking-widest font-bold">
                  {label}
                </span>
                <span
                  className={`font-body text-sm ml-4 ${
                    selected ? 'text-white/80' : 'text-black/60'
                  }`}
                >
                  {desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* GYM DAYS */}
      <div className="mb-8">
        <Label>GYM DAYS / WEEK</Label>
        <div className="flex gap-2">
          {([0, 1, 2, 3, 4, 5, 6] as const).map((n) => (
            <SegBtn
              key={n}
              label={String(n)}
              selected={formData.gymDaysPerWeek === n}
              onClick={() => update('gymDaysPerWeek', n)}
            />
          ))}
        </div>
      </div>

      <PrimaryBtn disabled={!canFinish} onClick={onFinish} color="red">
        FINISH →
      </PrimaryBtn>
    </div>
  );
}
