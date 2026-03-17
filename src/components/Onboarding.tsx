import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface OnboardingProps {
    onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        username: '',
        gender: '',
        age: '',
        unit_system: 'metric',
        height: '',
        initial_weight: '',
        target_weight: '',
        activity_level: '',
        goal: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const { error: upsertError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    username: formData.username || null,
                    gender: formData.gender || null,
                    age: formData.age ? parseInt(formData.age, 10) : null,
                    unit_system: formData.unit_system,
                    height: formData.height ? parseFloat(formData.height) : null,
                    initial_weight: formData.initial_weight ? parseFloat(formData.initial_weight) : null,
                    target_weight: formData.target_weight ? parseFloat(formData.target_weight) : null,
                    activity_level: formData.activity_level || null,
                    goal: formData.goal || null,
                    updated_at: new Date().toISOString(),
                });

            if (upsertError) throw upsertError;

            onComplete();
        } catch (err: any) {
            console.error('Error saving profile:', err);
            setError(err.message || 'Failed to save profile information.');
        } finally {
            setLoading(false);
        }
    };

    const isMetric = formData.unit_system === 'metric';

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-lg bg-card rounded-2xl shadow-sm border border-border/50 p-8 text-card-foreground">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Profile</h1>
                    <p className="text-muted-foreground p-2 text-sm">
                        Tell us a bit about yourself to personalize your experience and calculate your goals accurately.
                    </p>
                </div>

                {error && (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm mb-6 border border-destructive/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                    <Input
                        label="Username (Optional)"
                        name="username"
                        type="text"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="e.g., fitness_buff99"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label htmlFor="onboarding-gender" className="text-sm font-medium text-muted-foreground">Gender</label>
                            <select
                                id="onboarding-gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="" disabled>Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <Input
                            label="Age"
                            name="age"
                            type="number"
                            min="1"
                            max="120"
                            required
                            value={formData.age}
                            onChange={handleChange}
                            placeholder="Years"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="onboarding-unit" className="text-sm font-medium text-muted-foreground">Preferred Unit System</label>
                        <select
                            id="onboarding-unit"
                            name="unit_system"
                            value={formData.unit_system}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="metric">Metric (kg, cm)</option>
                            <option value="imperial">Imperial (lbs, inches)</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-[1fr_1fr_1fr] gap-4">
                        <Input
                            label={`Height (${isMetric ? 'cm' : 'inches'})`}
                            name="height"
                            type="number"
                            step="0.01"
                            required
                            value={formData.height}
                            onChange={handleChange}
                            placeholder={isMetric ? 'e.g., 175' : 'e.g., 68'}
                        />
                        <Input
                            label={`Current Weight (${isMetric ? 'kg' : 'lbs'})`}
                            name="initial_weight"
                            type="number"
                            step="0.1"
                            required
                            value={formData.initial_weight}
                            onChange={handleChange}
                            placeholder={isMetric ? '70.5' : '155.0'}
                        />
                        <Input
                            label={`Target Weight (${isMetric ? 'kg' : 'lbs'})`}
                            name="target_weight"
                            type="number"
                            step="0.1"
                            required
                            value={formData.target_weight}
                            onChange={handleChange}
                            placeholder={isMetric ? '68.0' : '150.0'}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="onboarding-activity" className="text-sm font-medium text-muted-foreground">Activity Level</label>
                        <select
                            id="onboarding-activity"
                            name="activity_level"
                            value={formData.activity_level}
                            onChange={handleChange}
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="" disabled>Select Activity Level</option>
                            <option value="sedentary">Sedentary (office job, no exercise)</option>
                            <option value="lightly_active">Lightly Active (1-3 days/week)</option>
                            <option value="moderately_active">Moderately Active (3-5 days/week)</option>
                            <option value="very_active">Very Active (6-7 days/week)</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="onboarding-goal" className="text-sm font-medium text-muted-foreground">Primary Goal</label>
                        <select
                            id="onboarding-goal"
                            name="goal"
                            value={formData.goal}
                            onChange={handleChange}
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="" disabled>Select Goal</option>
                            <option value="lose_fat">Lose Fat</option>
                            <option value="maintain_weight">Maintain Weight</option>
                            <option value="build_muscle">Build Muscle</option>
                        </select>
                    </div>

                    <Button
                        type="submit"
                        isLoading={loading}
                        className="w-full mt-4"
                        size="lg"
                    >
                        Save Profile & Continue
                    </Button>
                </form>
            </div>
        </div>
    );
}
