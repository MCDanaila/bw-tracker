import { useState } from 'react';
import { supabase } from '@/core/lib/supabase';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { toast } from 'sonner';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;
            } else {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });
                // Sometimes signUp returns success but needs email confirmation.
                // For local development or if email confirmation is off, it logs in automatically.
                if (signUpError) throw signUpError;
                toast.success('Account created! Sign in below.');
                setIsLogin(true);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md bg-card rounded-2xl shadow-sm border border-border/50 p-8 text-card-foreground">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">BW Tracker</h1>
                    <p className="text-muted-foreground">
                        {isLogin ? 'Welcome back! Please sign in.' : 'Create your account.'}
                    </p>
                </div>

                {error && (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm mb-6 border border-destructive/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-5">
                    <Input
                        label="Email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        icon={<Mail size={18} />}
                    />

                    <Input
                        label="Password"
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        icon={<Lock size={18} />}
                    />

                    <Button
                        type="submit"
                        isLoading={loading}
                        className="w-full"
                        size="lg"
                    >
                        {isLogin ? (
                            <><LogIn size={20} /> Sign In</>
                        ) : (
                            <><UserPlus size={20} /> Create Account</>
                        )}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError(null);
                        }}
                        className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                        {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                    </button>
                </div>
            </div>
        </div>
    );
}
