import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ChevronLeft, UserCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useProfile, useUpdateProfile, STEPS_GOAL_DEFAULT, WATER_GOAL_DEFAULT, type UserProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileViewProps {
    onBack: () => void;
}

type ProfileFormValues = Omit<UserProfile, 'id'>;

const SELECT_CLASS =
    'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export default function ProfileView({ onBack }: ProfileViewProps) {
    const { user } = useAuth();
    const { data: profile, isLoading } = useProfile();
    const { mutateAsync: updateProfile, isPending } = useUpdateProfile();

    const { register, handleSubmit, reset, watch, formState: { isDirty } } = useForm<ProfileFormValues>({
        defaultValues: {
            username: '',
            gender: '',
            age: null,
            unit_system: 'metric',
            height: null,
            initial_weight: null,
            target_weight: null,
            activity_level: '',
            goal: '',
            steps_goal: STEPS_GOAL_DEFAULT,
            water_goal: WATER_GOAL_DEFAULT,
        }
    });

    // Populate form once profile loads
    useEffect(() => {
        if (profile) {
            reset({
                username: profile.username ?? '',
                gender: profile.gender ?? '',
                age: profile.age,
                unit_system: profile.unit_system ?? 'metric',
                height: profile.height,
                initial_weight: profile.initial_weight,
                target_weight: profile.target_weight,
                activity_level: profile.activity_level ?? '',
                goal: profile.goal ?? '',
                steps_goal: profile.steps_goal ?? STEPS_GOAL_DEFAULT,
                water_goal: profile.water_goal ?? WATER_GOAL_DEFAULT,
            });
        }
    }, [profile, reset]);

    const isMetric = watch('unit_system') === 'metric';

    const onSubmit = async (data: ProfileFormValues) => {
        try {
            await updateProfile({
                username: data.username || null,
                gender: data.gender || null,
                age: data.age ? Number(data.age) : null,
                unit_system: data.unit_system,
                height: data.height ? Number(data.height) : null,
                initial_weight: data.initial_weight ? Number(data.initial_weight) : null,
                target_weight: data.target_weight ? Number(data.target_weight) : null,
                activity_level: data.activity_level || null,
                goal: data.goal || null,
                steps_goal: data.steps_goal ? Number(data.steps_goal) : STEPS_GOAL_DEFAULT,
                water_goal: data.water_goal ? Number(data.water_goal) : WATER_GOAL_DEFAULT,
            });
            toast.success('Profile saved.');
            onBack();
        } catch (err: any) {
            toast.error(err.message || 'Failed to save profile.');
        }
    };

    if (isLoading) {
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

                {/* Identity */}
                <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Identity</h2>

                    <Input label="Username (Optional)" type="text" placeholder="e.g., fitness_buff99" {...register('username')} />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Gender</label>
                            <select {...register('gender')} className={SELECT_CLASS}>
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <Input label="Age" type="number" min="1" max="120" placeholder="Years" {...register('age')} />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">Unit System</label>
                        <select {...register('unit_system')} className={SELECT_CLASS}>
                            <option value="metric">Metric (kg, cm)</option>
                            <option value="imperial">Imperial (lbs, inches)</option>
                        </select>
                    </div>
                </section>

                {/* Body Metrics */}
                <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Body Metrics</h2>

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

                {/* Fitness Profile */}
                <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Fitness Profile</h2>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">Activity Level</label>
                        <select {...register('activity_level')} className={SELECT_CLASS}>
                            <option value="">Select Activity Level</option>
                            <option value="sedentary">Sedentary (office job, no exercise)</option>
                            <option value="lightly_active">Lightly Active (1–3 days/week)</option>
                            <option value="moderately_active">Moderately Active (3–5 days/week)</option>
                            <option value="very_active">Very Active (6–7 days/week)</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">Primary Goal</label>
                        <select {...register('goal')} className={SELECT_CLASS}>
                            <option value="">Select Goal</option>
                            <option value="lose_fat">Lose Fat</option>
                            <option value="maintain_weight">Maintain Weight</option>
                            <option value="build_muscle">Build Muscle</option>
                        </select>
                    </div>
                </section>

                {/* Daily Goals */}
                <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Daily Goals</h2>
                    <p className="text-xs text-muted-foreground -mt-2">These targets are shown in your daily dashboard progress bars.</p>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Steps Goal (steps/day)"
                            type="number"
                            min="1000"
                            max="100000"
                            step="500"
                            placeholder="10000"
                            {...register('steps_goal')}
                        />
                        <Input
                            label="Water Goal (liters/day)"
                            type="number"
                            min="0.5"
                            max="15"
                            step="0.5"
                            placeholder="4.0"
                            {...register('water_goal')}
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
