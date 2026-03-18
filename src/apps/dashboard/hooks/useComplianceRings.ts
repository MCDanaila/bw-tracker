import { useMemo } from 'react';
import { useHistoryLogs } from '@/core/hooks/useHistoryLogs';
import { useProfile, STEPS_GOAL_DEFAULT } from '@/core/hooks/useProfile';

interface ComplianceRingsData {
  diet: number;
  training: number;
  steps: number;
  isLoading: boolean;
}

export function useComplianceRings(userId?: string): ComplianceRingsData {
  const { data: logs, isLoading: logsLoading } = useHistoryLogs(userId);
  const { data: profile, isLoading: profileLoading } = useProfile(userId);

  return useMemo(() => {
    const isLoading = logsLoading || profileLoading;

    if (!logs || logs.length === 0) {
      return { diet: 0, training: 0, steps: 0, isLoading };
    }

    // Get last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const recentLogs = logs.filter(l => {
      const d = new Date(l.date);
      return d >= sevenDaysAgo && d <= now;
    });

    if (recentLogs.length === 0) {
      return { diet: 0, training: 0, steps: 0, isLoading };
    }

    // Diet adherence: perfect=100, minor_deviation=70, cheat_meal=30
    const dietScoreMap: Record<string, number> = {
      perfect: 100,
      minor_deviation: 70,
      cheat_meal: 30,
    };
    const dietLogs = recentLogs.filter(l => l.diet_adherence != null);
    const diet = dietLogs.length > 0
      ? dietLogs.reduce((sum, l) => sum + (dietScoreMap[l.diet_adherence!] ?? 0), 0) / dietLogs.length
      : 0;

    // Training: count days with workout (not null, not Rest) / expected 5
    const trainingDays = recentLogs.filter(
      l => l.workout_session != null && l.workout_session !== 'Rest'
    ).length;
    const training = Math.min(100, (trainingDays / 5) * 100);

    // Steps: count days where steps >= goal / 7
    const stepsGoal = profile?.steps_goal ?? STEPS_GOAL_DEFAULT;
    const stepsDaysAtGoal = recentLogs.filter(
      l => l.steps != null && l.steps >= stepsGoal
    ).length;
    const steps = (stepsDaysAtGoal / 7) * 100;

    return { diet: Math.round(diet), training: Math.round(training), steps: Math.round(steps), isLoading };
  }, [logs, logsLoading, profile, profileLoading]);
}
