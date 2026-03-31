import { useState, useMemo } from 'react';
import { Scale, TrendingUp, Flame, Footprints, Users, FileText, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAthleteContext } from '../contexts/AthleteContext';
import { useProfile } from '@/core/hooks/useProfile';
import { useDashboardData, type TimeRange } from '@/core/hooks/useDashboardData';
import { useHistoryLogs } from '@/core/hooks/useHistoryLogs';
import { STEPS_GOAL_DEFAULT } from '@/core/hooks/useProfile';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useRecoveryScore } from '../hooks/useRecoveryScore';
import { useComplianceRings } from '../hooks/useComplianceRings';
import { useBiofeedbackRadar } from '../hooks/useBiofeedbackRadar';
import { useAthletes } from '../hooks/useAthletes';
import { useCoachStats } from '../hooks/useCoachStats';
import { StatCard } from '../components/StatCard';
import { WeightTrendChart } from '../components/WeightTrendChart';
import { RecoveryGauge } from '../components/RecoveryGauge';
import { ComplianceRings } from '../components/ComplianceRings';
import { BiofeedbackRadar } from '../components/BiofeedbackRadar';
import { StepsBarChart } from '../components/StepsBarChart';
import { TrainingCalendarStrip } from '../components/TrainingCalendarStrip';
import ComplianceHeatmap from '../components/ComplianceHeatmap';
import AlertFeed from '../components/AlertFeed';
import { DataTable } from '../tables/DataTable';
import { athletesColumns } from '../tables/athletes-columns';
import { Button } from '@/core/components/ui/button';
import { getLocalDateStr } from '@/core/lib/utils';
import type { AthleteWithStats } from '../hooks/useAthletes';

export default function OverviewPage() {
  const { canManageAthletes, activeAthleteId, effectiveUserId } = useAthleteContext();

  // Coach with no athlete selected: show coach dashboard
  if (canManageAthletes && !activeAthleteId) {
    return <CoachOverview />;
  }

  // Athlete (or coach viewing specific athlete): show athlete dashboard
  return <AthleteOverview userId={effectiveUserId} />;
}

// ---- Athlete Overview (existing) ----
function AthleteOverview({ userId }: { userId: string }) {
  const { data: profile } = useProfile(userId);
  const [range, setRange] = useState<TimeRange>('14d');

  const stats = useDashboardStats(userId);
  const { data: chartData, isLoading: chartLoading } = useDashboardData(range, userId);
  const { data: logs, isLoading: logsLoading } = useHistoryLogs(userId);
  const recovery = useRecoveryScore(userId);
  const compliance = useComplianceRings(userId);
  const biofeedback = useBiofeedbackRadar(userId);

  const stepsGoal = profile?.steps_goal ?? STEPS_GOAL_DEFAULT;
  const displayName = profile?.username || 'there';
  const trainingDays = buildTrainingDays(logs ?? []);
  const stepsData = (chartData ?? []).slice(-7);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {displayName}</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

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

// ---- Coach Overview ----
function CoachOverview() {
  const navigate = useNavigate();
  const coachStats = useCoachStats();
  const { data: athletes, isLoading: athletesLoading } = useAthletes();

  // Build heatmap data from athletes (last 14 days)
  const heatmapData = useMemo(() => {
    if (!athletes) return [];
    return athletes.slice(0, 20).map(a => ({
      athleteId: a.id,
      athleteName: a.username || a.email,
      days: buildHeatmapDays(a),
    }));
  }, [athletes]);

  const compactAthletes = (athletes ?? []).slice(0, 10);

  const handleRowClick = (athlete: AthleteWithStats) => {
    navigate(`/dashboard/athletes/${athlete.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Coach Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Athletes" value={coachStats.totalAthletes} icon={<Users size={18} />} color="text-primary" isLoading={coachStats.isLoading} />
        <StatCard label="Logs Today" value={coachStats.logsTodayCount} icon={<FileText size={18} />} color="text-metric-training" isLoading={coachStats.isLoading} />
        <StatCard label="Active Alerts" value={coachStats.activeAlertsCount} icon={<Bell size={18} />} color="text-status-warning" isLoading={coachStats.isLoading} />
      </div>

      {/* Athletes compact table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Athletes</h2>
          {(athletes ?? []).length > 10 && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/athletes')}>
              View All ({athletes?.length})
            </Button>
          )}
        </div>
        <DataTable
          columns={athletesColumns}
          data={compactAthletes}
          isLoading={athletesLoading}
          emptyMessage="No athletes assigned yet"
          onRowClick={handleRowClick}
        />
      </div>

      {/* Heatmap + Alert Feed */}
      <div className="grid-panels">
        <ComplianceHeatmap data={heatmapData} isLoading={athletesLoading} />
        <AlertFeed alerts={[]} />
      </div>
    </div>
  );
}

// ---- Helpers ----
function buildTrainingDays(logs: Array<{ date: string; workout_session: string | null; gym_rpe: number | null; workout_duration: number | null }>) {
  const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
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

function buildHeatmapDays(athlete: AthleteWithStats) {
  // Build 14 days of data. Since we only have compliance percentages from the athlete,
  // use dietAdherence as a proxy score for the heatmap. For a real implementation,
  // this would fetch per-day logs.
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateStr(d);
    days.push({
      date: dateStr,
      // Use the athlete's overall diet adherence as a proxy; real implementation would be per-day
      score: i <= 6 ? athlete.dietAdherence : null,
    });
  }
  return days;
}
