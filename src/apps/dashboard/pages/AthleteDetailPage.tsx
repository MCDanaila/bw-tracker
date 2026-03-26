import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Scale, TrendingUp, Flame, Footprints, Save, X, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useProfile, STEPS_GOAL_DEFAULT } from '@/core/hooks/useProfile';
import { useDashboardData, type TimeRange } from '@/core/hooks/useDashboardData';
import { useHistoryLogs } from '@/core/hooks/useHistoryLogs';
import { useDietData } from '@/core/hooks/useDietData';
import { supabase } from '@/core/lib/supabase';
import { getLocalDateStr } from '@/core/lib/utils';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useRecoveryScore } from '../hooks/useRecoveryScore';
import { useComplianceRings } from '../hooks/useComplianceRings';
import { useBiofeedbackRadar } from '../hooks/useBiofeedbackRadar';
import { useCurrentGoal, useGoalHistory, useSetGoal } from '../hooks/useAthleteGoals';
import { useAthletePreferences, useSetAthletePreferences } from '../hooks/useAthletePreferences';
import { StatCard } from '../components/StatCard';
import { WeightTrendChart } from '../components/WeightTrendChart';
import { RecoveryGauge } from '../components/RecoveryGauge';
import { ComplianceRings } from '../components/ComplianceRings';
import { BiofeedbackRadar } from '../components/BiofeedbackRadar';
import { StepsBarChart } from '../components/StepsBarChart';
import { TrainingCalendarStrip } from '../components/TrainingCalendarStrip';
import { MealPlanEditor } from '../components/MealPlanEditor';
import { GoalProgressCard } from '../components/GoalProgressCard';
import AssignTemplateDialog from '../components/AssignTemplateDialog';
import { DataTable } from '../tables/DataTable';
import { logsColumns } from '../tables/logs-columns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/core/components/ui/tabs';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import type { DailyLog, MealPlan } from '@/core/types/database';

const TAB_MAP: Record<string, string> = {
  '': 'overview',
  'progress': 'progress',
  'diet': 'diet',
  'goals': 'goals',
  'preferences': 'preferences',
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
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
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
        <TabsContent value="preferences">
          <PreferencesTab athleteId={id} />
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
  const [showAssignDialog, setShowAssignDialog] = useState(false);

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    return (
      <div className="mt-4 space-y-4">
        <p className="text-muted-foreground">No diet plan assigned to this athlete.</p>
        <Button onClick={() => setShowAssignDialog(true)} variant="outline">
          Assign Template
        </Button>
        <AssignTemplateDialog
          isOpen={showAssignDialog}
          onClose={() => setShowAssignDialog(false)}
          athleteId={athleteId}
        />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowAssignDialog(true)} variant="outline" size="sm">
          Assign Another Template
        </Button>
      </div>
      <MealPlanEditor templateId="" items={items} onSave={handleSave} />
      <AssignTemplateDialog
        isOpen={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        athleteId={athleteId}
      />
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

// ---- Preferences Tab ----
interface PreferencesFormValues {
  allergies: string;
  intolerances: string;
  dietary_restrictions: string;
  food_dislikes: string;
  food_preferences: string;
  cuisine_preferences: string;
  meal_timing_notes: string;
  supplement_use: string;
  digestion_issues: string;
  cooking_skill: string;
  meal_prep_time: string;
  budget_level: string;
  additional_notes: string;
}

function PreferencesTab({ athleteId }: { athleteId: string }) {
  const { data: preferences } = useAthletePreferences(athleteId);
  const setPreferences = useSetAthletePreferences();
  const [editing, setEditing] = useState(false);

  const { register, handleSubmit, reset } = useForm<PreferencesFormValues>({
    values: {
      allergies: (preferences?.allergies ?? []).join(', '),
      intolerances: (preferences?.intolerances ?? []).join(', '),
      dietary_restrictions: (preferences?.dietary_restrictions ?? []).join(', '),
      food_dislikes: (preferences?.food_dislikes ?? []).join(', '),
      food_preferences: (preferences?.food_preferences ?? []).join(', '),
      cuisine_preferences: (preferences?.cuisine_preferences ?? []).join(', '),
      meal_timing_notes: preferences?.meal_timing_notes ?? '',
      supplement_use: (preferences?.supplement_use ?? []).join(', '),
      digestion_issues: preferences?.digestion_issues ?? '',
      cooking_skill: preferences?.cooking_skill ?? '',
      meal_prep_time: preferences?.meal_prep_time ?? '',
      budget_level: preferences?.budget_level ?? '',
      additional_notes: preferences?.additional_notes ?? '',
    },
  });

  const parseArrayField = (value: string): string[] => {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  };

  const onSave = async (values: PreferencesFormValues) => {
    await setPreferences.mutateAsync({
      athleteId,
      allergies: parseArrayField(values.allergies),
      intolerances: parseArrayField(values.intolerances),
      dietary_restrictions: parseArrayField(values.dietary_restrictions),
      food_dislikes: parseArrayField(values.food_dislikes),
      food_preferences: parseArrayField(values.food_preferences),
      cuisine_preferences: parseArrayField(values.cuisine_preferences),
      meal_timing_notes: values.meal_timing_notes || null,
      supplement_use: parseArrayField(values.supplement_use),
      digestion_issues: values.digestion_issues || null,
      cooking_skill: (values.cooking_skill || null) as 'none' | 'basic' | 'intermediate' | 'advanced' | null,
      meal_prep_time: (values.meal_prep_time || null) as 'minimal' | 'moderate' | 'flexible' | null,
      budget_level: (values.budget_level || null) as 'budget' | 'moderate' | 'premium' | null,
      additional_notes: values.additional_notes || null,
    });
    setEditing(false);
  };

  const hasPreferences = preferences && (
    preferences.allergies.length > 0 ||
    preferences.intolerances.length > 0 ||
    preferences.dietary_restrictions.length > 0 ||
    preferences.food_dislikes.length > 0 ||
    preferences.food_preferences.length > 0 ||
    preferences.cuisine_preferences.length > 0 ||
    preferences.meal_timing_notes ||
    preferences.supplement_use.length > 0 ||
    preferences.digestion_issues ||
    preferences.cooking_skill ||
    preferences.meal_prep_time ||
    preferences.budget_level ||
    preferences.additional_notes
  );

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Dietary Preferences</h2>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil size={14} className="mr-1" /> {hasPreferences ? 'Edit' : 'Set'} Preferences
          </Button>
        )}
      </div>

      {!editing && hasPreferences && (
        <div className="space-y-4">
          {preferences?.allergies.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Allergies</p>
              <p className="text-sm">{preferences.allergies.join(', ')}</p>
            </div>
          )}
          {preferences?.intolerances.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Intolerances</p>
              <p className="text-sm">{preferences.intolerances.join(', ')}</p>
            </div>
          )}
          {preferences?.dietary_restrictions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Dietary Restrictions</p>
              <p className="text-sm">{preferences.dietary_restrictions.join(', ')}</p>
            </div>
          )}
          {preferences?.food_dislikes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Food Dislikes</p>
              <p className="text-sm">{preferences.food_dislikes.join(', ')}</p>
            </div>
          )}
          {preferences?.food_preferences.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Food Preferences</p>
              <p className="text-sm">{preferences.food_preferences.join(', ')}</p>
            </div>
          )}
          {preferences?.cuisine_preferences.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Cuisine Preferences</p>
              <p className="text-sm">{preferences.cuisine_preferences.join(', ')}</p>
            </div>
          )}
          {preferences?.cooking_skill && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Cooking Skill</p>
              <p className="text-sm capitalize">{preferences.cooking_skill.replace('_', ' ')}</p>
            </div>
          )}
          {preferences?.meal_prep_time && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Meal Prep Time</p>
              <p className="text-sm capitalize">{preferences.meal_prep_time.replace('_', ' ')}</p>
            </div>
          )}
          {preferences?.budget_level && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Budget Level</p>
              <p className="text-sm capitalize">{preferences.budget_level.replace('_', ' ')}</p>
            </div>
          )}
          {preferences?.meal_timing_notes && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Meal Timing Notes</p>
              <p className="text-sm">{preferences.meal_timing_notes}</p>
            </div>
          )}
          {preferences?.supplement_use.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Supplements</p>
              <p className="text-sm">{preferences.supplement_use.join(', ')}</p>
            </div>
          )}
          {preferences?.digestion_issues && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Digestion Issues</p>
              <p className="text-sm">{preferences.digestion_issues}</p>
            </div>
          )}
          {preferences?.additional_notes && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Additional Notes</p>
              <p className="text-sm">{preferences.additional_notes}</p>
            </div>
          )}
        </div>
      )}

      {!editing && !hasPreferences && (
        <p className="text-muted-foreground">No preferences set. Required for AI suggestions: allergies, intolerances, and dietary restrictions.</p>
      )}

      {editing && (
        <Card>
          <CardHeader><CardTitle>Set Preferences</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSave)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="allergies">
                    Allergies <span className="text-destructive">*</span>
                  </Label>
                  <Input id="allergies" placeholder="e.g., nuts, shellfish" {...register('allergies')} />
                  <p className="text-xs text-muted-foreground">Comma-separated list (required for AI)</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="intolerances">
                    Intolerances <span className="text-destructive">*</span>
                  </Label>
                  <Input id="intolerances" placeholder="e.g., lactose, gluten" {...register('intolerances')} />
                  <p className="text-xs text-muted-foreground">Comma-separated list (required for AI)</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dietary_restrictions">
                    Dietary Restrictions <span className="text-destructive">*</span>
                  </Label>
                  <Input id="dietary_restrictions" placeholder="e.g., vegan, halal" {...register('dietary_restrictions')} />
                  <p className="text-xs text-muted-foreground">Comma-separated list (required for AI)</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="food_dislikes">Food Dislikes</Label>
                  <Input id="food_dislikes" placeholder="e.g., beets, mushrooms" {...register('food_dislikes')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="food_preferences">Food Preferences</Label>
                  <Input id="food_preferences" placeholder="e.g., grilled, pasta-based" {...register('food_preferences')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cuisine_preferences">Cuisine Preferences</Label>
                  <Input id="cuisine_preferences" placeholder="e.g., Mediterranean, Asian" {...register('cuisine_preferences')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cooking_skill">Cooking Skill</Label>
                  <select id="cooking_skill" {...register('cooking_skill')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="">None</option>
                    <option value="none">None</option>
                    <option value="basic">Basic</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="meal_prep_time">Meal Prep Time Available</Label>
                  <select id="meal_prep_time" {...register('meal_prep_time')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="">None</option>
                    <option value="minimal">Minimal</option>
                    <option value="moderate">Moderate</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="budget_level">Budget Level</Label>
                  <select id="budget_level" {...register('budget_level')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="">None</option>
                    <option value="budget">Budget</option>
                    <option value="moderate">Moderate</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="supplement_use">Supplement Use</Label>
                <Input id="supplement_use" placeholder="e.g., whey, creatine, vitamins" {...register('supplement_use')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="meal_timing_notes">Meal Timing Notes</Label>
                <Input id="meal_timing_notes" placeholder="e.g., fasted cardio preferred, avoid eating late" {...register('meal_timing_notes')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="digestion_issues">Digestion Issues</Label>
                <Input id="digestion_issues" placeholder="e.g., bloating after fiber, slow digestion" {...register('digestion_issues')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="additional_notes">Additional Notes</Label>
                <Input id="additional_notes" placeholder="Any other relevant information..." {...register('additional_notes')} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={setPreferences.isPending}>
                  <Save size={14} className="mr-1" /> {setPreferences.isPending ? 'Saving...' : 'Save Preferences'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => { reset(); setEditing(false); }}>
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
