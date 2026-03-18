import { useState } from 'react';
import { Scale, TrendingUp, Flame, Footprints } from 'lucide-react';
import { useAthleteContext } from '../contexts/AthleteContext';
import { useProfile } from '@/hooks/useProfile';
import { useDashboardData, type TimeRange } from '@/hooks/useDashboardData';
import { useHistoryLogs } from '@/hooks/useHistoryLogs';
import { STEPS_GOAL_DEFAULT } from '@/hooks/useProfile';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useRecoveryScore } from '../hooks/useRecoveryScore';
import { useComplianceRings } from '../hooks/useComplianceRings';
import { useBiofeedbackRadar } from '../hooks/useBiofeedbackRadar';
import { StatCard } from '../components/StatCard';
import { WeightTrendChart } from '../components/WeightTrendChart';
import { RecoveryGauge } from '../components/RecoveryGauge';
import { ComplianceRings } from '../components/ComplianceRings';
import { BiofeedbackRadar } from '../components/BiofeedbackRadar';
import { StepsBarChart } from '../components/StepsBarChart';
import { TrainingCalendarStrip } from '../components/TrainingCalendarStrip';
import { getLocalDateStr } from '@/lib/utils';

export default function OverviewPage() {
  const { effectiveUserId } = useAthleteContext();
  const { data: profile } = useProfile(effectiveUserId);
  const [range, setRange] = useState<TimeRange>('14d');

  const stats = useDashboardStats(effectiveUserId);
  const { data: chartData, isLoading: chartLoading } = useDashboardData(range, effectiveUserId);
  const { data: logs, isLoading: logsLoading } = useHistoryLogs(effectiveUserId);
  const recovery = useRecoveryScore(effectiveUserId);
  const compliance = useComplianceRings(effectiveUserId);
  const biofeedback = useBiofeedbackRadar(effectiveUserId);

  const stepsGoal = profile?.steps_goal ?? STEPS_GOAL_DEFAULT;
  const displayName = profile?.username || 'there';

  // Build training strip from last 7 days of logs
  const trainingDays = buildTrainingDays(logs ?? []);

  // Steps data for bar chart (last 7 entries from chart data)
  const stepsData = (chartData ?? []).slice(-7);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {displayName}</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid-stats">
        <StatCard
          label="Current Weight"
          value={stats.currentWeight != null ? `${stats.currentWeight} kg` : '—'}
          icon={<Scale size={18} />}
          color="text-metric-weight"
          trend={stats.weightDelta7d != null ? {
            direction: stats.weightDelta7d < 0 ? 'down' : stats.weightDelta7d > 0 ? 'up' : 'stable',
            value: `${stats.weightDelta7d > 0 ? '+' : ''}${stats.weightDelta7d} kg`,
            isPositive: stats.weightDelta7d <= 0,
          } : undefined}
          isLoading={stats.isLoading}
        />
        <StatCard
          label="7d Avg Weight"
          value={stats.sevenDayAvgWeight != null ? `${stats.sevenDayAvgWeight} kg` : '—'}
          icon={<TrendingUp size={18} />}
          color="text-metric-weight"
          isLoading={stats.isLoading}
        />
        <StatCard
          label="Streak"
          value={`${stats.streak} days`}
          icon={<Flame size={18} />}
          color="text-metric-training"
          isLoading={stats.isLoading}
        />
        <StatCard
          label="Avg Steps (7d)"
          value={stats.avgSteps7d != null ? stats.avgSteps7d.toLocaleString() : '—'}
          icon={<Footprints size={18} />}
          color="text-metric-steps"
          isLoading={stats.isLoading}
        />
      </div>

      {/* Weight Trend Chart */}
      <WeightTrendChart
        data={chartData ?? []}
        targetWeight={profile?.target_weight}
        dateRange={range}
        onRangeChange={setRange}
        isLoading={chartLoading}
      />

      {/* Recovery + Compliance */}
      <div className="grid-equal">
        <RecoveryGauge
          score={recovery.score}
          trend={recovery.trend}
          isLoading={recovery.isLoading}
        />
        <ComplianceRings
          diet={compliance.diet}
          training={compliance.training}
          steps={compliance.steps}
          isLoading={compliance.isLoading}
        />
      </div>

      {/* Training + Biofeedback */}
      <div className="grid-equal">
        <TrainingCalendarStrip
          days={trainingDays}
          isLoading={logsLoading}
        />
        <BiofeedbackRadar
          axes={biofeedback.axes}
          isLoading={biofeedback.isLoading}
        />
      </div>

      {/* Steps */}
      <StepsBarChart
        data={stepsData}
        stepsGoal={stepsGoal}
        isLoading={chartLoading}
      />
    </div>
  );
}

function buildTrainingDays(logs: Array<{
  date: string;
  workout_session: string | null;
  gym_rpe: number | null;
  workout_duration: number | null;
}>) {
  const dayLabels = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const result = [];

  // Last 7 days including today
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
