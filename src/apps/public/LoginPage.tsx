import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/core/lib/supabase';

const LEONIDA_RED = '#b52619';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setSubmitting(false);
      return;
    }

    // Determine role from profile to redirect appropriately
    const userId = data.user?.id;
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role === 'coach') {
        navigate('/dashboard', { replace: true });
        return;
      }
    }

    navigate('/tracker', { replace: true });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="mb-0">
          <Link
            to="/"
            className="font-mono-manifesto text-sm tracking-widest font-medium uppercase text-black no-underline"
          >
            LEONIDA
          </Link>
        </div>

        {/* 4px black rule */}
        <div className="h-1 bg-black w-full mt-2 mb-6" />

        {/* Headline */}
        <h1 className="font-display text-2xl font-semibold text-black mb-8">
          WELCOME BACK
        </h1>

        <form onSubmit={handleSubmit} noValidate>
          {/* EMAIL field */}
          <div className="mb-6">
            <label
              htmlFor="email"
              className="block font-mono-manifesto text-xs tracking-widest font-medium uppercase text-black mb-2"
            >
              EMAIL
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-0 border-b-2 border-black outline-none focus:outline-none text-black py-1 text-base"
              style={error ? { borderBottomColor: LEONIDA_RED } : undefined}
            />
          </div>

          {/* PASSWORD field */}
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block font-mono-manifesto text-xs tracking-widest font-medium uppercase text-black mb-2"
            >
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-0 border-b-2 border-black outline-none focus:outline-none text-black py-1 text-base"
              style={error ? { borderBottomColor: LEONIDA_RED } : undefined}
            />
          </div>

          {/* Error message */}
          {error && (
            <p
              className="font-mono-manifesto text-xs mb-4"
              style={{ color: LEONIDA_RED }}
            >
              {error}
            </p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-black text-white font-mono-manifesto uppercase tracking-widest text-sm py-3 rounded-none border-2 border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed mb-6"
          >
            {submitting ? 'SIGNING IN...' : 'SIGN IN →'}
          </button>
        </form>

        {/* No account link */}
        <p className="text-sm text-black font-body">
          No account?{' '}
          <Link
            to="/"
            className="font-medium no-underline hover:underline"
            style={{ color: LEONIDA_RED }}
          >
            Choose a plan →
          </Link>
        </p>
      </div>
    </div>
  );
}
