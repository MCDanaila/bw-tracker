import { useMemo } from 'react';
import { useHistoryLogs } from '@/hooks/useHistoryLogs';

interface BiofeedbackAxis {
  axis: string;
  currentWeek: number;
  previousWeek: number;
}

interface BiofeedbackRadarData {
  axes: BiofeedbackAxis[];
  isLoading: boolean;
}

export function useBiofeedbackRadar(userId?: string): BiofeedbackRadarData {
  const { data: logs, isLoading } = useHistoryLogs(userId);

  return useMemo(() => {
    if (!logs || logs.length === 0) {
      return {
        axes: getEmptyAxes(),
        isLoading,
      };
    }

    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);

    const currentWeekLogs = logs.filter(l => {
      const d = new Date(l.date);
      return d >= oneWeekAgo && d <= now;
    });
    const previousWeekLogs = logs.filter(l => {
      const d = new Date(l.date);
      return d >= twoWeeksAgo && d < oneWeekAgo;
    });

    const axisConfigs = [
      { axis: 'Digestion', key: 'digestion_rating' as const, normalize: (v: number) => (v / 4) * 100 },
      { axis: 'Energy', key: 'daily_energy' as const, normalize: (v: number) => (v / 3) * 100 },
      { axis: 'Mood', key: 'mood' as const, normalize: (v: number) => (v / 5) * 100 },
      { axis: 'Hunger', key: 'hunger_level' as const, normalize: (v: number) => ((6 - v) / 5) * 100 },
      { axis: 'Libido', key: 'libido' as const, normalize: (v: number) => (v / 5) * 100 },
      { axis: 'Stress', key: 'stress_level' as const, normalize: (v: number) => ((4 - v) / 3) * 100 },
    ];

    const axes = axisConfigs.map(({ axis, key, normalize }) => ({
      axis,
      currentWeek: averageNormalized(currentWeekLogs, key, normalize),
      previousWeek: averageNormalized(previousWeekLogs, key, normalize),
    }));

    return { axes, isLoading };
  }, [logs, isLoading]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function averageNormalized(
  logs: any[],
  key: string,
  normalize: (v: number) => number
): number {
  const values = logs
    .map(l => l[key])
    .filter((v: unknown): v is number => v != null && typeof v === 'number');
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + normalize(v), 0) / values.length);
}

function getEmptyAxes(): BiofeedbackAxis[] {
  return ['Digestion', 'Energy', 'Mood', 'Hunger', 'Libido', 'Stress'].map(axis => ({
    axis,
    currentWeek: 0,
    previousWeek: 0,
  }));
}
