import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Scale, TrendingUp, Flame, Footprints, Save, X, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useProfile, STEPS_GOAL_DEFAULT } from '@/hooks/useProfile';
import { useDashboardData, type TimeRange } from '@/hooks/useDashboardData';
import { useHistoryLogs } from '@/hooks/useHistoryLogs';
import { useDietData } from '@/hooks/useDietData';
import { supabase } from '@/lib/supabase';
import { getLocalDateStr } from '@/lib/utils';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useRecoveryScore } from '../hooks/useRecoveryScore';
import { useComplianceRings } from '../hooks/useComplianceRings';
import { useBiofeedbackRadar } from '../hooks/useBiofeedbackRadar';
import { useCurrentGoal, useGoalHistory, useSetGoal } from '../hooks/useAthleteGoals';
import { StatCard } from '../components/StatCard';
import { WeightTrendChart } from '../components/WeightTrendChart';
import { RecoveryGauge } from '../components/RecoveryGauge';
import { ComplianceRings } from '../components/ComplianceRings';
import { BiofeedbackRadar } from '../components/BiofeedbackRadar';
import { StepsBarChart } from '../components/StepsBarChart';
import { TrainingCalendarStrip } from '../components/TrainingCalendarStrip';
import { MealPlanEditor } from '../components/MealPlanEditor';
import { GoalProgressCard } from '../components/GoalProgressCard';
import { DataTable } from '../tables/DataTable';
import { logsColumns } from '../tables/logs-columns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DailyLog, MealPlan } from '@/types/database';

const TAB_MAP: Record<string, string> = {
  '': 'overview',
  'progress': 'progress',
  'diet': 'diet',
  'goals': 'goals',
};

export default function AthleteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Derive active tab from URL
  const pathParts = location.pathname.split('/');
  const lastPart = pathParts[pathParts.length - 1];
  const activeTab = lastPart === id ? 'overview' : (TAB_MAP[lastPart] ?? 'overview');

  const handleTabChange = (tab: string | number) => {
    const tabStr = String(tab);
    if (tabStr === 'overview') {
      navigate(`/dashboard/athletes/${id}`);
    } else {
      navigate(`/dashboard/athletes/${id}/${tabStr}`);
    }
  };

  const { data: profile, isLoading: profileLoading } = useProfile(id);
  const { data: currentGoal } = useCurrentGoal(id);

  if (profileLoading || !id) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-12 w-full animate-pulse rounded bg-muted" />
        <div className="h-64 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/athletes')}>
          <ArrowLeft size={14} className="mr-1" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{profile?.username || 'Athlete'}</h1>
          {currentGoal?.phase && (
            <Badge variant="outline" className="capitalize">{currentGoal.phase.replace('_', ' ')}</Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="diet">Diet</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab athleteId={id} />
        </TabsContent>
        <TabsContent value="progress">
          <ProgressTab athleteId={id} />
        </TabsContent>
        <TabsContent value="diet">
          <DietTab athleteId={id} />
        </TabsContent>
        <TabsContent value="goals">
          <GoalsTab athleteId={id} />
        </TabsContent>
        <TabsContent value="logs">
          <LogsTab athleteId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---- Overview Tab ----
function OverviewTab({ athleteId }: { athleteId: string }) {
  const { data: profile } = useProfile(athleteId);
  const [range, setRange] = useState<TimeRange>('14d');
  const stats = useDashboardStats(athleteId);
  const { data: chartData, isLoading: chartLoading } = useDashboardData(range, athleteId);
  const { data: logs, isLoading: logsLoading } = useHistoryLogs(athleteId);
  const recovery = useRecoveryScore(athleteId);
  const compliance = useComplianceRings(athleteId);
  const biofeedback = useBiofeedbackRadar(athleteId);
  const stepsGoal = profile?.steps_goal ?? STEPS_GOAL_DEFAULT;
  const trainingDays = buildTrainingDays(logs ?? []);
  const stepsData = (chartData ?? []).slice(-7);

  return (
    <div className="space-y-6 mt-4">
      <div className="grid-stats">
        <StatCard label="Current Weight" value={stats.currentWeight != null ? `${stats.currentWeight} kg` : '—'} icon={<Scale size={18} />} color="text-metric-weight"
          trend={stats.weightDelta7d != null ? { direction: stats.weightDelta7d < 0 ? 'down' : stats.weightDelta7d > 0 ? 'up' : 'stable', value: `${stats.weightDelta7d > 0 ? '+' : ''}${stats.weightDelta7d} kg`, isPositive: stats.weightDelta7d <= 0 } : undefined}
          isLoading={stats.isLoading} />
        <StatCard label="7d Avg Weight" value={stats.sevenDayAvgWeight != null ? `${stats.sevenDayAvgWeight} kg` : '—'} icon={<TrendingUp size={18} />} color="text-metric-weight" isLoading={stats.isLoading} />
        <StatCard label="Streak" value={`${stats.streak} days`} icon={<Flame size={18} />} color="text-metric-training" isLoading={stats.isLoading} />
        <StatCard label="Avg Steps (7d)" value={stats.avgSteps7d != null ? stats.avgSteps7d.toLocaleString() : '—'} icon={<Footprints size={18} />} color="text-metric-steps" isLoading={stats.isLoading} />
      </div>
      <WeightTrendChart data={chartData ?? []} targetWeight={profile?.target_weight} dateRange={range} onRangeChange={setRange} isLoading={chartLoading} />
      <div className="grid-equal">
        <RecoveryGauge score={recovery.score} trend={recovery.trend} isLoading={recovery.isLoading} />
        <ComplianceRings diet={compliance.diet} training={compliance.training} steps={compliance.steps} isLoading={compliance.isLoading} />
      </div>
      <div className="grid-equal">
        <TrainingCalendarStrip days={trainingDays} isLoading={logsLoading} />
        <BiofeedbackRadar axes={biofeedback.axes} isLoading={biofeedback.isLoading} />
      </div>
      <StepsBarChart data={stepsData} stepsGoal={stepsGoal} isLoading={chartLoading} />
    </div>
  );
}

// ---- Progress Tab ----
function ProgressTab({ athleteId }: { athleteId: string }) {
  const { data: profile } = useProfile(athleteId);
  const [range, setRange] = useState<TimeRange>('1m');
  const { data: chartData, isLoading: chartLoading } = useDashboardData(range, athleteId);

  return (
    <div className="space-y-6 mt-4">
      <WeightTrendChart data={chartData ?? []} targetWeight={profile?.target_weight} dateRange={range} onRangeChange={setRange} isLoading={chartLoading} />
    </div>
  );
}

// ---- Diet Tab ----
function DietTab({ athleteId }: { athleteId: string }) {
  const { data: plans, isLoading } = useDietData(athleteId);

  const items = useMemo(() => {
    if (!plans || plans.length === 0) return [];
    return plans.map((plan: MealPlan, idx: number) => ({
      id: plan.id,
      template_id: '',
      day_of_week: plan.day_of_week,
      meal_name: plan.meal_name,
      food_id: plan.food_id,
      target_quantity: plan.target_quantity,
      sort_order: idx,
      created_at: plan.created_at,
      foods: plan.foods,
    }));
  }, [plans]);

  const handleSave = useCallback(async (updatedItems: { id?: string; template_id?: string; day_of_week: string; meal_name: string; food_id: string | null; target_quantity: number; sort_order: number }[]) => {
    // Delete existing meal plans for this athlete
    const { error: delErr } = await supabase
      .from('meal_plans')
      .delete()
      .eq('user_id', athleteId);
    if (delErr) throw delErr;

    if (updatedItems.length > 0) {
      const toInsert = updatedItems.map(({ id: _id, template_id: _tid, ...rest }) => ({
        ...rest,
        user_id: athleteId,
      }));
      const { error: insErr } = await supabase
        .from('meal_plans')
        .insert(toInsert);
      if (insErr) throw insErr;
    }
  }, [athleteId]);

  if (isLoading) {
    return <div className="space-y-3 mt-4">{[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>;
  }

  if (items.length === 0) {
    return <p className="text-muted-foreground mt-4">No diet plan assigned to this athlete.</p>;
  }

  return (
    <div className="mt-4">
      <MealPlanEditor templateId="" items={items} onSave={handleSave} />
    </div>
  );
}

// ---- Goals Tab ----
interface GoalFormValues {
  target_weight: number | '';
  steps_goal: number | '';
  water_goal: number | '';
  target_calories: number | '';
  target_protein: number | '';
  target_carbs: number | '';
  target_fats: number | '';
  phase: string;
  notes: string;
}

function GoalsTab({ athleteId }: { athleteId: string }) {
  const stats = useDashboardStats(athleteId);
  const { data: currentGoal } = useCurrentGoal(athleteId);
  const { data: history } = useGoalHistory(athleteId);
  const setGoal = useSetGoal();
  const [editing, setEditing] = useState(false);

  const { register, handleSubmit, reset } = useForm<GoalFormValues>({
    values: {
      target_weight: currentGoal?.target_weight ?? '',
      steps_goal: currentGoal?.steps_goal ?? '',
      water_goal: currentGoal?.water_goal ?? '',
      target_calories: currentGoal?.target_calories ?? '',
      target_protein: currentGoal?.target_protein ?? '',
      target_carbs: currentGoal?.target_carbs ?? '',
      target_fats: currentGoal?.target_fats ?? '',
      phase: currentGoal?.phase ?? '',
      notes: currentGoal?.notes ?? '',
    },
  });

  const onSave = async (values: GoalFormValues) => {
    await setGoal.mutateAsync({
      athleteId,
      target_weight: values.target_weight === '' ? null : Number(values.target_weight),
      steps_goal: values.steps_goal === '' ? null : Number(values.steps_goal),
      water_goal: values.water_goal === '' ? null : Number(values.water_goal),
      target_calories: values.target_calories === '' ? null : Number(values.target_calories),
      target_protein: values.target_protein === '' ? null : Number(values.target_protein),
      target_carbs: values.target_carbs === '' ? null : Number(values.target_carbs),
      target_fats: values.target_fats === '' ? null : Number(values.target_fats),
      phase: values.phase as 'bulk' | 'cut' | 'maintenance' | 'reverse_diet' | null || null,
      notes: values.notes || null,
    });
    setEditing(false);
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Current Goals Progress */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Current Goals</h2>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil size={14} className="mr-1" /> Set New Goals
          </Button>
        )}
      </div>

      {currentGoal ? (
        <div className="space-y-3">
          {currentGoal.target_weight != null && (
            <GoalProgressCard label="Target Weight" current={stats.sevenDayAvgWeight} target={currentGoal.target_weight} unit="kg" color="[&>div]:bg-metric-weight" inverted />
          )}
          {currentGoal.steps_goal != null && (
            <GoalProgressCard label="Daily Steps" current={stats.avgSteps7d} target={currentGoal.steps_goal} unit="steps" color="[&>div]:bg-metric-steps" />
          )}
          {currentGoal.water_goal != null && (
            <GoalProgressCard label="Daily Water" current={null} target={currentGoal.water_goal} unit="L" color="[&>div]:bg-chart-1" />
          )}
          {currentGoal.phase && (
            <p className="text-sm text-muted-foreground">Phase: <Badge variant="outline" className="capitalize ml-1">{currentGoal.phase.replace('_', ' ')}</Badge></p>
          )}
          {currentGoal.notes && (
            <p className="text-sm text-muted-foreground">Notes: {currentGoal.notes}</p>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground">No goals set for this athlete.</p>
      )}

      {/* Edit form */}
      {editing && (
        <Card>
          <CardHeader><CardTitle>Set New Goals</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSave)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="target_weight">Target Weight (kg)</Label>
                  <Input id="target_weight" type="number" step="0.1" {...register('target_weight', { valueAsNumber: true })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="steps_goal">Steps Goal</Label>
                  <Input id="steps_goal" type="number" step="500" {...register('steps_goal', { valueAsNumber: true })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="water_goal">Water Goal (L)</Label>
                  <Input id="water_goal" type="number" step="0.1" {...register('water_goal', { valueAsNumber: true })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="target_calories">Target Calories</Label>
                  <Input id="target_calories" type="number" {...register('target_calories', { valueAsNumber: true })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="target_protein">Target Protein (g)</Label>
                  <Input id="target_protein" type="number" {...register('target_protein', { valueAsNumber: true })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="target_carbs">Target Carbs (g)</Label>
                  <Input id="target_carbs" type="number" {...register('target_carbs', { valueAsNumber: true })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="target_fats">Target Fats (g)</Label>
                  <Input id="target_fats" type="number" {...register('target_fats', { valueAsNumber: true })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phase">Phase</Label>
                  <select id="phase" {...register('phase')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="">None</option>
                    <option value="bulk">Bulk</option>
                    <option value="cut">Cut</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="reverse_diet">Reverse Diet</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" {...register('notes')} placeholder="Optional notes..." />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={setGoal.isPending}>
                  <Save size={14} className="mr-1" /> {setGoal.isPending ? 'Saving...' : 'Save Goals'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => { reset(); setEditing(false); }}>
                  <X size={14} className="mr-1" /> Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Goal History */}
      {history && history.length > 1 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Goal History</h2>
          <div className="space-y-2">
            {history.map(goal => (
              <Card key={goal.id} className={goal.effective_until ? 'opacity-60' : ''}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {goal.phase && <Badge variant="outline" className="capitalize">{goal.phase.replace('_', ' ')}</Badge>}
                      <span className="text-muted-foreground">
                        {new Date(goal.effective_from).toLocaleDateString('it-IT')}
                        {goal.effective_until ? ` — ${new Date(goal.effective_until).toLocaleDateString('it-IT')}` : ' — Current'}
                      </span>
                    </div>
                    <div className="flex gap-3 text-muted-foreground text-xs tabular-nums">
                      {goal.target_weight != null && <span>Wt: {goal.target_weight}kg</span>}
                      {goal.target_calories != null && <span>Cal: {goal.target_calories}</span>}
                      {goal.steps_goal != null && <span>Steps: {goal.steps_goal}</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Logs Tab ----
function LogsTab({ athleteId }: { athleteId: string }) {
  const { data: logs, isLoading } = useHistoryLogs(athleteId);

  return (
    <div className="mt-4">
      <DataTable<DailyLog, unknown>
        columns={logsColumns}
        data={logs ?? []}
        isLoading={isLoading}
        emptyMessage="No logs recorded yet"
      />
    </div>
  );
}

// ---- Helpers ----
function buildTrainingDays(logs: Array<{ date: string; workout_session: string | null; gym_rpe: number | null; workout_duration: number | null }>) {
  const dayLabels = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateStr(d);
    const log = logs.find(l => l.date === dateStr);
    result.push({
      date: dateStr,
      dayLabel: dayLabels[d.getDay()],
      workoutSession: log?.workout_session ?? null,
      rpe: log?.gym_rpe ?? null,
      duration: log?.workout_duration ?? null,
    });
  }
  return result;
}
