import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pencil, Save, X } from 'lucide-react';
import { useAthleteContext } from '../contexts/AthleteContext';
import { useProfile, useUpdateProfile, STEPS_GOAL_DEFAULT, WATER_GOAL_DEFAULT } from '@/hooks/useProfile';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { GoalProgressCard } from '../components/GoalProgressCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GoalFormValues {
  target_weight: number;
  steps_goal: number;
  water_goal: number;
}

export default function GoalsPage() {
  const { effectiveUserId } = useAthleteContext();
  const { data: profile, isLoading } = useProfile(effectiveUserId);
  const stats = useDashboardStats(effectiveUserId);
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);

  const { register, handleSubmit, reset } = useForm<GoalFormValues>({
    values: {
      target_weight: profile?.target_weight ?? 80,
      steps_goal: profile?.steps_goal ?? STEPS_GOAL_DEFAULT,
      water_goal: profile?.water_goal ?? WATER_GOAL_DEFAULT,
    },
  });

  const onSave = async (values: GoalFormValues) => {
    await updateProfile.mutateAsync({
      target_weight: values.target_weight,
      steps_goal: values.steps_goal,
      water_goal: values.water_goal,
    });
    setEditing(false);
  };

  const onCancel = () => {
    reset();
    setEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Goals</h1>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const targetWeight = profile?.target_weight ?? 80;
  const stepsGoal = profile?.steps_goal ?? STEPS_GOAL_DEFAULT;
  const waterGoal = profile?.water_goal ?? WATER_GOAL_DEFAULT;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Goals</h1>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil size={14} className="mr-1" /> Edit
          </Button>
        )}
      </div>

      {!editing ? (
        <div className="space-y-4">
          <GoalProgressCard
            label="Target Weight"
            current={stats.sevenDayAvgWeight}
            target={targetWeight}
            unit="kg"
            color="[&>div]:bg-metric-weight"
            inverted
          />
          <GoalProgressCard
            label="Daily Steps"
            current={stats.avgSteps7d}
            target={stepsGoal}
            unit="steps"
            color="[&>div]:bg-metric-steps"
          />
          <GoalProgressCard
            label="Daily Water"
            current={null}
            target={waterGoal}
            unit="L"
            color="[&>div]:bg-chart-1"
          />
        </div>
      ) : (
        <Card>
          <CardHeader><CardTitle>Edit Goals</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSave)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target_weight">Target Weight (kg)</Label>
                <Input
                  id="target_weight"
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  {...register('target_weight', { valueAsNumber: true, min: 30, max: 300 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="steps_goal">Daily Steps Goal</Label>
                <Input
                  id="steps_goal"
                  type="number"
                  step="500"
                  min="1000"
                  max="50000"
                  {...register('steps_goal', { valueAsNumber: true, min: 1000, max: 50000 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="water_goal">Daily Water Goal (L)</Label>
                <Input
                  id="water_goal"
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="10"
                  {...register('water_goal', { valueAsNumber: true, min: 0.5, max: 10 })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateProfile.isPending}>
                  <Save size={14} className="mr-1" />
                  {updateProfile.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button type="button" variant="ghost" onClick={onCancel}>
                  <X size={14} className="mr-1" /> Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
