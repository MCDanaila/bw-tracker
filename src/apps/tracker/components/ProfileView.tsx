import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ChevronLeft, UserCircle, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { toast } from 'sonner';
import {
  useProfile,
  useUpdateProfile,
  STEPS_GOAL_DEFAULT,
  WATER_GOAL_DEFAULT,
  SALT_GOAL_DEFAULT,
} from '@/core/hooks/useProfile';
import { useAthletePreferences, useSetAthletePreferences } from '@/core/hooks/useAthletePreferences';
import { ALLERGENS } from '@/core/lib/constants';
import type { UserProfile, AthletePreferences } from '@/core/types/database';
import { useAuth } from '@/core/contexts/AuthContext';

interface ProfileViewProps {
  onBack: () => void;
}

const SELECT_CLASS =
  'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

// age is omitted — auto-computed by DB trigger from dob, not editable
// id is omitted — never sent as an update
type ProfileFormValues = Omit<UserProfile, 'id' | 'age'> & {
  diet_framework: AthletePreferences['diet_framework'] | '';
  meal_frequency: number | null;
  allergies: string[];
};

export default function ProfileView({ onBack }: ProfileViewProps) {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: prefs, isLoading: prefsLoading } = useAthletePreferences(user?.id);
  const { mutateAsync: updateProfile, isPending: profilePending } = useUpdateProfile();
  const { mutateAsync: setPreferences, isPending: prefsPending } = useSetAthletePreferences();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { isDirty },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      username: '',
      gender: '',
      dob: null,
      unit_system: 'metric',
      height: null,
      initial_weight: null,
      target_weight: null,
      goal: '',
      goal_rate: 'moderate',
      activity_level: '',
      gym_days_per_week: null,
      steps_goal: STEPS_GOAL_DEFAULT,
      water_goal: WATER_GOAL_DEFAULT,
      salt_goal: SALT_GOAL_DEFAULT,
      email: null,
      role: 'athlete',
      plan: 'self_coached',
      ai_enabled: false,
      diet_framework: '',
      meal_frequency: null,
      allergies: [],
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        username: profile.username ?? '',
        gender: profile.gender ?? '',
        dob: profile.dob ?? null,
        unit_system: profile.unit_system ?? 'metric',
        height: profile.height,
        initial_weight: profile.initial_weight,
        target_weight: profile.target_weight,
        goal: profile.goal ?? '',
        goal_rate: profile.goal_rate ?? 'moderate',
        activity_level: profile.activity_level ?? '',
        gym_days_per_week: profile.gym_days_per_week,
        steps_goal: profile.steps_goal ?? STEPS_GOAL_DEFAULT,
        water_goal: profile.water_goal ?? WATER_GOAL_DEFAULT,
        salt_goal: profile.salt_goal ?? SALT_GOAL_DEFAULT,
        email: profile.email,
        role: profile.role,
        plan: profile.plan,
        ai_enabled: profile.ai_enabled,
        diet_framework: prefs?.diet_framework ?? '',
        meal_frequency: prefs?.meal_frequency ?? null,
        allergies: prefs?.allergies ?? [],
      });
    }
  }, [profile, prefs, reset]);

  const isMetric = watch('unit_system') === 'metric';
  const isPending = profilePending || prefsPending;

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user?.id) return;
    try {
      await updateProfile({
        username: data.username || null,
        gender: data.gender || null,
        dob: data.dob || null,
        unit_system: data.unit_system,
        height: data.height ? Number(data.height) : null,
        initial_weight: data.initial_weight ? Number(data.initial_weight) : null,
        target_weight: data.target_weight ? Number(data.target_weight) : null,
        goal: data.goal || null,
        goal_rate: data.goal_rate ?? 'moderate',
        activity_level: data.activity_level || null,
        gym_days_per_week: data.gym_days_per_week ? Number(data.gym_days_per_week) : null,
        steps_goal: data.steps_goal ? Number(data.steps_goal) : STEPS_GOAL_DEFAULT,
        water_goal: data.water_goal ? Number(data.water_goal) : WATER_GOAL_DEFAULT,
        salt_goal: data.salt_goal ? Number(data.salt_goal) : SALT_GOAL_DEFAULT,
      });

      await setPreferences({
        athleteId: user.id,
        diet_framework: (data.diet_framework as AthletePreferences['diet_framework']) || undefined,
        meal_frequency: data.meal_frequency ? Number(data.meal_frequency) : undefined,
        allergies: data.allergies,
      });

      toast.success('Profile saved.');
      onBack();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save profile.';
      toast.error(message);
    }
  };

  if (profileLoading || prefsLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto p-4 pb-24 space-y-6 animate-fade-in text-foreground">
      {/* Header */}
      <div className="flex items-center gap-3 mt-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <ChevronLeft size={24} />
        </Button>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/20 text-primary rounded-xl">
            <UserCircle size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Edit Profile</h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Identity & Body */}
        <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Identity & Body</h2>

          <Input
            label="Username (Optional)"
            type="text"
            placeholder="e.g., fitness_buff99"
            {...register('username')}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="profile-gender" className="text-sm font-medium text-muted-foreground">Gender</label>
              <select id="profile-gender" {...register('gender')} className={SELECT_CLASS}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input label="Date of Birth" type="date" {...register('dob')} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-unit" className="text-sm font-medium text-muted-foreground">Unit System</label>
            <select id="profile-unit" {...register('unit_system')} className={SELECT_CLASS}>
              <option value="metric">Metric (kg, cm)</option>
              <option value="imperial">Imperial (lbs, inches)</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label={`Height (${isMetric ? 'cm' : 'in'})`}
              type="number" step="0.1"
              placeholder={isMetric ? '175' : '68'}
              {...register('height')}
            />
            <Input
              label={`Current (${isMetric ? 'kg' : 'lbs'})`}
              type="number" step="0.1"
              placeholder={isMetric ? '70.5' : '155'}
              {...register('initial_weight')}
            />
            <Input
              label={`Target (${isMetric ? 'kg' : 'lbs'})`}
              type="number" step="0.1"
              placeholder={isMetric ? '68' : '150'}
              {...register('target_weight')}
            />
          </div>
        </section>

        {/* Training */}
        <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Training</h2>

          <div className="space-y-1.5">
            <label htmlFor="profile-goal" className="text-sm font-medium text-muted-foreground">Primary Goal</label>
            <select id="profile-goal" {...register('goal')} className={SELECT_CLASS}>
              <option value="">Select Goal</option>
              <option value="lose_fat">Lose Fat</option>
              <option value="maintain_weight">Maintain Weight</option>
              <option value="build_muscle">Build Muscle</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-goal-rate" className="text-sm font-medium text-muted-foreground">Goal Rate</label>
            <select id="profile-goal-rate" {...register('goal_rate')} className={SELECT_CLASS}>
              <option value="conservative">Conservative — slow, sustainable</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive — fast, demanding</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-activity" className="text-sm font-medium text-muted-foreground">Activity Level</label>
            <select id="profile-activity" {...register('activity_level')} className={SELECT_CLASS}>
              <option value="">Select Activity Level</option>
              <option value="sedentary">Sedentary (office job, no exercise)</option>
              <option value="lightly_active">Lightly Active (1–3 days/week)</option>
              <option value="moderately_active">Moderately Active (3–5 days/week)</option>
              <option value="very_active">Very Active (6–7 days/week)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Gym Days / Week"
              type="number" min="0" max="7" step="1"
              placeholder="4"
              {...register('gym_days_per_week')}
            />
            <Input
              label="Steps Goal (steps/day)"
              type="number" min="1000" max="100000" step="500"
              placeholder="10000"
              {...register('steps_goal')}
            />
          </div>
        </section>

        {/* Daily Targets */}
        <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Daily Targets</h2>
          <p className="text-xs text-muted-foreground -mt-2">Shown in your daily dashboard progress bars.</p>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Water Goal (liters/day)"
              type="number" min="0.5" max="15" step="0.5"
              placeholder="4.0"
              {...register('water_goal')}
            />
            <Input
              label="Salt Goal (g/day)"
              type="number" min="0" max="30" step="0.5"
              placeholder="6.0"
              {...register('salt_goal')}
            />
          </div>
        </section>

        {/* Diet & Nutrition */}
        <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Diet & Nutrition</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="profile-diet-fw" className="text-sm font-medium text-muted-foreground">Diet Framework</label>
              <select id="profile-diet-fw" {...register('diet_framework')} className={SELECT_CLASS}>
                <option value="">Select Diet</option>
                <option value="omnivore">Omnivore</option>
                <option value="pescatarian">Pescatarian</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
              </select>
            </div>
            <Input
              label="Meals per Day"
              type="number" min="2" max="6" step="1"
              placeholder="3"
              {...register('meal_frequency')}
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground block">Allergens</span>
            <Controller
              name="allergies"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {ALLERGENS.map((a) => {
                    const selected = field.value.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          const next = selected
                            ? field.value.filter((v) => v !== a.id)
                            : [...field.value, a.id];
                          field.onChange(next);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          selected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-transparent text-muted-foreground border-border hover:border-primary'
                        }`}
                      >
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </div>
        </section>

        <Button
          type="submit"
          size="lg"
          disabled={isPending || !isDirty}
          className="w-full h-14 text-lg font-bold rounded-2xl"
        >
          {isPending ? 'Saving...' : 'Save Profile'}
        </Button>
      </form>
    </div>
  );
}
