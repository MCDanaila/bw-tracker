import { useMemo } from 'react';
import { useHistoryLogs } from '@/core/hooks/useHistoryLogs';
import { getLocalDateStr } from '@/core/lib/utils';

interface RecoveryScoreResult {
  score: number | null;
  components: {
    sleep: number | null;
    hrv: number | null;
    soreness: number | null;
    stress: number | null;
    energy: number | null;
  };
  trend: 'up' | 'down' | 'stable' | null;
  isLoading: boolean;
}

export function useRecoveryScore(userId?: string): RecoveryScoreResult {
  const { data: logs, isLoading } = useHistoryLogs(userId);

  return useMemo(() => {
    if (!logs || logs.length === 0) {
      return {
        score: null,
        components: { sleep: null, hrv: null, soreness: null, stress: null, energy: null },
        trend: null,
        isLoading,
      };
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = getLocalDateStr(sevenDaysAgo);

    // Latest log (most recent entry)
    const latest = logs[0];

    // Normalize sleep: (sleep_hours/8 * 0.4) + (sleep_quality/3 * 0.3) + (sleep_score/100 * 0.3) -> 0-100
    const sleepScore = normalizeSleep(latest);
    // HRV: simple relative scoring (if available)
    const hrvScore = latest.hrv != null ? Math.min(100, Math.max(0, latest.hrv)) : null;
    // Soreness: invert 1-3 scale (1=good=100, 3=bad=33)
    const sorenessScore = latest.soreness_level != null
      ? ((4 - latest.soreness_level) / 3) * 100
      : null;
    // Stress: invert 1-3 scale
    const stressScore = latest.stress_level != null
      ? ((4 - latest.stress_level) / 3) * 100
      : null;
    // Energy: 1-3 scale -> 0-100
    const energyScore = latest.daily_energy != null
      ? (latest.daily_energy / 3) * 100
      : null;

    // Weighted average: sleep 30%, HRV 25%, soreness 20%, stress 15%, energy 10%
    const weights = [
      { value: sleepScore, weight: 0.30 },
      { value: hrvScore, weight: 0.25 },
      { value: sorenessScore, weight: 0.20 },
      { value: stressScore, weight: 0.15 },
      { value: energyScore, weight: 0.10 },
    ];

    const available = weights.filter(w => w.value != null);
    if (available.length === 0) {
      return {
        score: null,
        components: { sleep: sleepScore, hrv: hrvScore, soreness: sorenessScore, stress: stressScore, energy: energyScore },
        trend: null,
        isLoading,
      };
    }

    const totalWeight = available.reduce((sum, w) => sum + w.weight, 0);
    const score = Math.round(
      available.reduce((sum, w) => sum + (w.value! * w.weight / totalWeight), 0)
    );

    // Trend: compare with 7 days ago
    const pastLog = logs.find(l => l.date === sevenDaysAgoStr);
    let trend: 'up' | 'down' | 'stable' | null = null;
    if (pastLog) {
      const pastSleepScore = normalizeSleep(pastLog);
      const pastWeights = [
        { value: pastSleepScore, weight: 0.30 },
        { value: pastLog.hrv != null ? Math.min(100, Math.max(0, pastLog.hrv)) : null, weight: 0.25 },
        { value: pastLog.soreness_level != null ? ((4 - pastLog.soreness_level) / 3) * 100 : null, weight: 0.20 },
        { value: pastLog.stress_level != null ? ((4 - pastLog.stress_level) / 3) * 100 : null, weight: 0.15 },
        { value: pastLog.daily_energy != null ? (pastLog.daily_energy / 3) * 100 : null, weight: 0.10 },
      ].filter(w => w.value != null);

      if (pastWeights.length > 0) {
        const pastTotal = pastWeights.reduce((sum, w) => sum + w.weight, 0);
        const pastScore = Math.round(
          pastWeights.reduce((sum, w) => sum + (w.value! * w.weight / pastTotal), 0)
        );
        if (score > pastScore + 5) trend = 'up';
        else if (score < pastScore - 5) trend = 'down';
        else trend = 'stable';
      }
    }

    return {
      score,
      components: { sleep: sleepScore, hrv: hrvScore, soreness: sorenessScore, stress: stressScore, energy: energyScore },
      trend,
      isLoading,
    };
  }, [logs, isLoading]);
}

function normalizeSleep(log: { sleep_hours: number | null; sleep_quality: number | null; sleep_score: number | null }): number | null {
  const parts: number[] = [];
  if (log.sleep_hours != null) parts.push((Math.min(log.sleep_hours, 8) / 8) * 100);
  if (log.sleep_quality != null) parts.push((log.sleep_quality / 3) * 100);
  if (log.sleep_score != null) parts.push(log.sleep_score);
  if (parts.length === 0) return null;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}
