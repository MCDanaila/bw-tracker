import { useEffect, useState } from 'react';

// ─── Design tokens ────────────────────────────────────────────────────────────

const LEONIDA_RED = '#b52619';

/** 4px solid horizontal rule used to open/close major sections. */
function SectionRule({ color = '#000000' }: { color?: string }) {
  return <div style={{ height: '4px', backgroundColor: color, width: '100%' }} />;
}

// ─── Plan data ────────────────────────────────────────────────────────────────

type PlanId = 'self_coached' | 'self_coached_ai' | 'coach' | 'coach_pro';

interface Plan {
  id: PlanId;
  label: string;
  tagline: string;
  accentColor: string;
  cardBg: string;
  features: Record<string, boolean | string>;
}

const FEATURES = [
  'Daily log',
  'Diet tracker',
  'History & charts',
  'Workout log',
  'AI diet planning',
  'AI workout planning',
  'Coach dashboard',
  'Athlete management',
] as const;

const PLANS: Plan[] = [
  {
    id: 'self_coached',
    label: 'SELF-COACHED',
    tagline: 'Solo athlete. You set the rules.',
    accentColor: '#000000',
    cardBg: '#ffffff',
    features: {
      'Daily log': true,
      'Diet tracker': true,
      'History & charts': true,
      'Workout log': true,
      'AI diet planning': false,
      'AI workout planning': false,
      'Coach dashboard': false,
      'Athlete management': false,
    },
  },
  {
    id: 'self_coached_ai',
    label: 'SELF-COACHED + AI',
    tagline: 'Solo athlete. With an edge.',
    accentColor: '#b52619',
    cardBg: '#ffffff',
    features: {
      'Daily log': true,
      'Diet tracker': true,
      'History & charts': true,
      'Workout log': true,
      'AI diet planning': true,
      'AI workout planning': true,
      'Coach dashboard': false,
      'Athlete management': false,
    },
  },
  {
    id: 'coach',
    label: 'COACH',
    tagline: 'Your athletes. Your system.',
    accentColor: '#000000',
    cardBg: '#ffffff',
    features: {
      'Daily log': true,
      'Diet tracker': true,
      'History & charts': true,
      'Workout log': true,
      'AI diet planning': false,
      'AI workout planning': false,
      'Coach dashboard': true,
      'Athlete management': 'Up to 5',
    },
  },
  {
    id: 'coach_pro',
    label: 'COACH PRO',
    tagline: 'Full squad. Full power.',
    accentColor: '#b52619',
    cardBg: '#d6d6d6',
    features: {
      'Daily log': true,
      'Diet tracker': true,
      'History & charts': true,
      'Workout log': true,
      'AI diet planning': true,
      'AI workout planning': true,
      'Coach dashboard': true,
      'Athlete management': 'Up to 25',
    },
  },
];

// ─── Sticky Nav ───────────────────────────────────────────────────────────────

function StickyNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 80);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid #000000' : 'none',
        transition: 'background-color 0.2s, border-bottom 0.2s',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          className="font-mono-manifesto"
          style={{
            fontSize: '0.875rem',
            letterSpacing: '0.2em',
            color: scrolled ? '#000000' : '#ffffff',
            fontWeight: 500,
          }}
        >
          LEONIDA
        </span>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a
            href="/login"
            className="font-mono-manifesto"
            style={{
              display: 'inline-block',
              padding: '0.5rem 1.25rem',
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
              border: scrolled ? '1px solid #000000' : '1px solid #ffffff',
              color: scrolled ? '#000000' : '#ffffff',
              background: 'transparent',
              textDecoration: 'none',
              borderRadius: 0,
              transition: 'background-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget;
              el.style.backgroundColor = scrolled ? '#000000' : '#ffffff';
              el.style.color = scrolled ? '#ffffff' : '#000000';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget;
              el.style.backgroundColor = 'transparent';
              el.style.color = scrolled ? '#000000' : '#ffffff';
            }}
          >
            SIGN IN
          </a>
          <a
            href="/register"
            className="font-mono-manifesto"
            style={{
              display: 'inline-block',
              padding: '0.5rem 1.25rem',
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
              backgroundColor: scrolled ? '#000000' : '#ffffff',
              color: scrolled ? '#ffffff' : '#000000',
              textDecoration: 'none',
              borderRadius: 0,
              border: scrolled ? '1px solid #000000' : '1px solid #ffffff',
              transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget;
              el.style.backgroundColor = scrolled ? '#ffffff' : '#000000';
              el.style.color = scrolled ? '#000000' : '#ffffff';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget;
              el.style.backgroundColor = scrolled ? '#000000' : '#ffffff';
              el.style.color = scrolled ? '#ffffff' : '#000000';
            }}
          >
            GET STARTED
          </a>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #000000 0%, #3b3b3b 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflowX: 'hidden',
        paddingTop: '56px',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          width: '100%',
        }}
      >
        {/* Oversized right-aligned wordmark */}
        <div style={{ textAlign: 'right', overflow: 'hidden' }}>
          <span
            className="font-display"
            style={{
              fontSize: 'clamp(5rem, 12vw, 10rem)',
              color: '#ffffff',
              lineHeight: 1,
              display: 'inline-block',
              marginRight: '-0.05em',
            }}
          >
            LEONIDA
          </span>
        </div>

        {/* White rule */}
        <div
          style={{
            height: '4px',
            backgroundColor: '#ffffff',
            width: '100%',
            margin: '2rem 0',
          }}
        />

        {/* 60/40 grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '60% 40%',
            gap: '2rem',
            alignItems: 'end',
          }}
        >
          <div>
            <p
              className="font-display"
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
                color: '#ffffff',
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              DISCIPLINE.
              <br />
              TRACK. FUEL.
              <br />
              <span style={{ color: '#b52619' }}>PERFORM.</span>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p
              className="font-body"
              style={{
                fontSize: '1.125rem',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              The tool your coach uses.
              <br />
              The app you live in.
            </p>
          </div>
        </div>

        {/* White rule bottom */}
        <div
          style={{
            height: '4px',
            backgroundColor: '#ffffff',
            width: '100%',
            margin: '2rem 0',
          }}
        />

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a
            href="/register"
            className="font-mono-manifesto"
            style={{
              display: 'inline-block',
              padding: '0.75rem 2rem',
              fontSize: '0.875rem',
              letterSpacing: '0.15em',
              backgroundColor: '#ffffff',
              color: '#000000',
              textDecoration: 'none',
              borderRadius: 0,
              border: '1px solid #ffffff',
              transition: 'background-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#000000';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.color = '#000000';
            }}
          >
            GET STARTED ▶
          </a>
          <a
            href="/login"
            className="font-mono-manifesto"
            style={{
              display: 'inline-block',
              padding: '0.75rem 2rem',
              fontSize: '0.875rem',
              letterSpacing: '0.15em',
              backgroundColor: 'transparent',
              color: '#ffffff',
              textDecoration: 'none',
              borderRadius: 0,
              border: '1px solid #ffffff',
              transition: 'background-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.color = '#000000';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#ffffff';
            }}
          >
            SIGN IN →
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Method ───────────────────────────────────────────────────────────────────

const METHOD_ITEMS = [
  {
    number: '01.',
    title: 'TRACK',
    body: 'Morning weight, sleep, training, end-of-day. Offline-first. Syncs when ready.',
  },
  {
    number: '02.',
    title: 'FUEL',
    body: 'Weekly meal plan. Smart food swaps. Macro targets. No guessing.',
  },
  {
    number: '03.',
    title: 'PERFORM',
    body: 'Charts, streaks, trends. See what\'s working. Adjust.',
  },
];

function MethodSection() {
  return (
    <section style={{ backgroundColor: '#ffffff' }}>
      <SectionRule />

      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '5rem 2rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '4rem',
          }}
        >
          {METHOD_ITEMS.map(item => (
            <div key={item.number}>
              <p
                className="font-display"
                style={{
                  fontSize: '4rem',
                  color: '#000000',
                  lineHeight: 1,
                  margin: '0 0 0.5rem 0',
                  fontWeight: 400,
                }}
              >
                {item.number}
              </p>
              <p
                className="font-display"
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: '#000000',
                  margin: '0 0 1rem 0',
                }}
              >
                {item.title}
              </p>
              <p
                className="font-body"
                style={{
                  fontSize: '1rem',
                  color: 'rgba(0,0,0,0.7)',
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {item.body}
              </p>
              {/* Leonida Red accent rule */}
              <div
                style={{
                  width: '40px',
                  height: '2px',
                  backgroundColor: '#b52619',
                  marginTop: '1.5rem',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Plans ────────────────────────────────────────────────────────────────────

function FeatureRow({ name, value }: { name: string; value: boolean | string }) {
  const isActive = value === true || typeof value === 'string';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '0.625rem',
        padding: '0.375rem 0',
      }}
    >
      <span
        className="font-mono-manifesto"
        style={{
          fontSize: '0.75rem',
          color: isActive ? '#000000' : 'rgba(0,0,0,0.4)',
          flexShrink: 0,
        }}
      >
        {isActive ? '✓' : '✗'}
      </span>
      <span
        className="font-body"
        style={{
          fontSize: '0.875rem',
          color: isActive ? '#000000' : 'rgba(0,0,0,0.4)',
        }}
      >
        {typeof value === 'string' ? `${name} (${value})` : name}
      </span>
    </div>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      style={{
        backgroundColor: plan.cardBg,
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
      }}
      onMouseEnter={e => {
        if (plan.cardBg === '#ffffff') {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f2f2f2';
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = plan.cardBg;
      }}
    >
      {/* Top accent rule */}
      <div style={{ height: '4px', backgroundColor: plan.accentColor, marginBottom: '1.5rem' }} />

      {/* Plan label */}
      <p
        className="font-mono-manifesto"
        style={{
          fontSize: '0.75rem',
          letterSpacing: '0.15em',
          color: '#000000',
          margin: '0 0 1rem 0',
        }}
      >
        {plan.label}
      </p>

      {/* Tagline */}
      <p
        className="font-display"
        style={{
          fontSize: '1.125rem',
          color: '#000000',
          lineHeight: 1.3,
          margin: '0 0 1.5rem 0',
          flexGrow: 1,
        }}
      >
        {plan.tagline}
      </p>

      {/* Feature rows */}
      <div style={{ marginBottom: '1.5rem' }}>
        {FEATURES.map(feature => (
          <FeatureRow key={feature} name={feature} value={plan.features[feature]} />
        ))}
      </div>

      {/* CTA button */}
      <a
        href={`/register?plan=${plan.id}`}
        className="font-mono-manifesto"
        style={{
          display: 'block',
          textAlign: 'center',
          padding: '0.75rem',
          fontSize: '0.75rem',
          letterSpacing: '0.15em',
          backgroundColor: '#000000',
          color: '#ffffff',
          textDecoration: 'none',
          borderRadius: 0,
          border: '1px solid #000000',
          transition: 'background-color 0.15s, color 0.15s',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget;
          el.style.backgroundColor = '#ffffff';
          el.style.color = '#000000';
        }}
        onMouseLeave={e => {
          const el = e.currentTarget;
          el.style.backgroundColor = '#000000';
          el.style.color = '#ffffff';
        }}
      >
        GET STARTED →
      </a>
    </div>
  );
}

function PlansSection() {
  return (
    <section style={{ backgroundColor: '#f2f2f2' }}>
      <SectionRule />

      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '5rem 2rem',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <p
            className="font-display"
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.5rem)',
              fontWeight: 600,
              color: '#000000',
              margin: '0 0 0.25rem 0',
              lineHeight: 1.1,
            }}
          >
            YOUR PLAN.
            <br />
            YOUR TERMS.
          </p>
          <p
            className="font-body"
            style={{
              fontSize: '1rem',
              color: '#000000',
              margin: '1rem 0 0 0',
            }}
          >
            No payment. No trial. Choose and start now.
          </p>
        </div>

        {/* Plan cards grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {PLANS.map(plan => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pull Quote ───────────────────────────────────────────────────────────────

function PullQuoteSection() {
  return (
    <section style={{ backgroundColor: '#000000' }}>
      <SectionRule color={LEONIDA_RED} />

      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '6rem 2rem',
          textAlign: 'right',
        }}
      >
        <p
          className="font-display"
          style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            color: '#ffffff',
            lineHeight: 1.3,
            margin: 0,
          }}
        >
          "The only metric that
          <br />
          matters is the one
          <br />
          <span style={{ color: '#b52619' }}>you logged today."</span>
        </p>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function FooterSection() {
  return (
    <footer style={{ backgroundColor: '#f2f2f2' }}>
      <SectionRule />

      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '3rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '2rem',
        }}
      >
        {/* Left column */}
        <div>
          <p
            className="font-mono-manifesto"
            style={{
              fontSize: '1rem',
              letterSpacing: '0.2em',
              color: '#000000',
              margin: '0 0 1.5rem 0',
            }}
          >
            LEONIDA
          </p>
          <p
            className="font-body"
            style={{ fontSize: '0.875rem', color: '#000000', margin: '0 0 0.5rem 0' }}
          >
            Already have an account?
          </p>
          <a
            href="/login"
            className="font-mono-manifesto"
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
              color: '#b52619',
              textDecoration: 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            SIGN IN →
          </a>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
          <a
            href="/contact"
            className="font-body"
            style={{
              fontSize: '0.875rem',
              color: 'rgba(0,0,0,0.5)',
              textDecoration: 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.textDecoration = 'underline';
              e.currentTarget.style.color = '#000000';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.textDecoration = 'none';
              e.currentTarget.style.color = 'rgba(0,0,0,0.5)';
            }}
          >
            Contact
          </a>
          <a
            href="/privacy"
            className="font-body"
            style={{
              fontSize: '0.875rem',
              color: 'rgba(0,0,0,0.5)',
              textDecoration: 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.textDecoration = 'underline';
              e.currentTarget.style.color = '#000000';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.textDecoration = 'none';
              e.currentTarget.style.color = 'rgba(0,0,0,0.5)';
            }}
          >
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
}

// ─── LandingPage ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ overflowX: 'hidden' }}>
      <StickyNav />
      <HeroSection />
      <MethodSection />
      <PlansSection />
      <PullQuoteSection />
      <FooterSection />
    </div>
  );
}
