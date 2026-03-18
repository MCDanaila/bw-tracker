import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Shield, User, Settings2, LogOut, Smartphone } from 'lucide-react';
import { useAuth } from '@/core/contexts/AuthContext';
import { useProfile, useUpdateProfile } from '@/core/hooks/useProfile';
import { useAthletes } from '../hooks/useAthletes';
import { useAthleteContext } from '../contexts/AthleteContext';
import { supabase } from '@/core/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Label } from '@/core/components/ui/label';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Badge } from '@/core/components/ui/badge';
import { Separator } from '@/core/components/ui/separator';
import { Skeleton } from '@/core/components/ui/skeleton';

// Default date range key used by charts
const DATE_RANGE_KEY = 'bw_dashboard_default_range';

function loadDefaultRange(): string {
  return localStorage.getItem(DATE_RANGE_KEY) ?? '14d';
}

function saveDefaultRange(range: string) {
  localStorage.setItem(DATE_RANGE_KEY, range);
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { canManageAthletes } = useAthleteContext();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();

  // Profile form state
  const [username, setUsername] = useState('');
  const [usernameDirty, setUsernameDirty] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);

  // Preferences state
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(profile?.unit_system ?? 'metric');
  const [defaultRange, setDefaultRange] = useState(loadDefaultRange());
  const [savingPrefs, setSavingPrefs] = useState(false);

  const displayUsername = usernameDirty ? username : (profile?.username ?? '');

  const handleSaveUsername = async () => {
    if (!displayUsername.trim()) return;
    setSavingUsername(true);
    try {
      await updateProfile.mutateAsync({ username: displayUsername.trim() });
    } finally {
      setSavingUsername(false);
      setUsernameDirty(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      saveDefaultRange(defaultRange);
      await updateProfile.mutateAsync({ unit_system: unitSystem });
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl pb-10">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User size={18} className="text-muted-foreground" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>Your account information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary uppercase select-none shrink-0">
              {(profile?.username ?? user?.email ?? '?')[0]}
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{profile?.username ?? '—'}</p>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Badge variant={canManageAthletes ? 'default' : 'secondary'} className="ml-auto shrink-0 capitalize">
              {canManageAthletes ? 'Coach' : 'Athlete'}
            </Badge>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="username">Display Name</Label>
            <div className="flex gap-2">
              <Input
                id="username"
                value={displayUsername}
                onChange={(e) => { setUsername(e.target.value); setUsernameDirty(true); }}
                placeholder="Your display name"
                className="flex-1"
              />
              <Button
                onClick={handleSaveUsername}
                disabled={!usernameDirty || savingUsername || !displayUsername.trim()}
                className="min-w-[80px] min-h-[44px]"
              >
                {savingUsername ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ''} disabled readOnly className="opacity-60" />
            <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 size={18} className="text-muted-foreground" />
            <CardTitle>Preferences</CardTitle>
          </div>
          <CardDescription>Customize your dashboard experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit-system">Unit System</Label>
              <select
                id="unit-system"
                value={unitSystem}
                onChange={(e) => setUnitSystem(e.target.value as 'metric' | 'imperial')}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                }}
              >
                <option value="metric">Metric (kg, cm)</option>
                <option value="imperial">Imperial (lbs, in)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-range">Default Chart Range</Label>
              <select
                id="default-range"
                value={defaultRange}
                onChange={(e) => setDefaultRange(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                }}
              >
                <option value="7d">Last 7 days</option>
                <option value="14d">Last 14 days</option>
                <option value="1m">Last month</option>
                <option value="3m">Last 3 months</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSavePreferences} disabled={savingPrefs} className="min-h-[44px]">
              {savingPrefs ? (
                <><Loader2 size={14} className="animate-spin mr-2" />Saving...</>
              ) : (
                'Save Preferences'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Coach-only: Athlete Management */}
      {canManageAthletes && <CoachAthleteManager />}

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your session and navigation.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors min-h-[44px] px-4 text-sm font-medium"
          >
            <Smartphone size={14} />
            Back to Mobile App
          </Link>
          <Button
            variant="destructive"
            className="flex items-center gap-2 min-h-[44px]"
            onClick={handleSignOut}
          >
            <LogOut size={14} />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Coach Athlete Manager subcomponent ----
type RelStatus = 'active' | 'paused' | 'terminated';

function CoachAthleteManager() {
  const { data: athletes, isLoading } = useAthletes();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleStatusChange = async (athleteId: string, newStatus: RelStatus) => {
    if (!user?.id) return;
    setUpdating(athleteId);
    try {
      await supabase
        .from('coach_athletes')
        .update({ status: newStatus })
        .eq('coach_id', user.id)
        .eq('athlete_id', athleteId);
      queryClient.invalidateQueries({ queryKey: ['athletes', user.id] });
    } finally {
      setUpdating(null);
    }
  };

  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: 'right 0.5rem center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '1.5em 1.5em',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-muted-foreground" />
          <CardTitle>Athlete Management</CardTitle>
        </div>
        <CardDescription>Manage the status of your athlete relationships.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : !athletes || athletes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No athletes assigned yet.</p>
        ) : (
          <div className="divide-y">
            {athletes.map(athlete => (
              <div key={athlete.id} className="flex items-center justify-between py-3 gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{athlete.username ?? athlete.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{athlete.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {updating === athlete.id && (
                    <Loader2 size={14} className="animate-spin text-muted-foreground" />
                  )}
                  <select
                    value={athlete.status}
                    onChange={(e) => handleStatusChange(athlete.id, e.target.value as RelStatus)}
                    disabled={!!updating}
                    className="h-[44px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none w-[130px]"
                    style={selectStyle}
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
