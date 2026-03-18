import { useMemo } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useStreak } from '@/hooks/useStreak';

interface DashboardStats {
  currentWeight: number | null;
  sevenDayAvgWeight: number | null;
  streak: number;
  avgSteps7d: number | null;
  weightDelta7d: number | null;
  isLoading: boolean;
}

export function useDashboardStats(userId?: string): DashboardStats {
  const { data: allData, isLoading: dataLoading } = useDashboardData('3m', userId);
  const streak = useStreak(userId);

  return useMemo(() => {
    const isLoading = dataLoading;

    if (!allData || allData.length === 0) {
      return {
        currentWeight: null,
        sevenDayAvgWeight: null,
        streak,
        avgSteps7d: null,
        weightDelta7d: null,
        isLoading,
      };
    }

    // Data is sorted ascending by date
    const withWeight = allData.filter(d => d.weight_fasting != null);

    // Current weight = most recent weight entry (rounded to 1 decimal)
    const currentWeight = withWeight.length > 0
      ? Number(withWeight[withWeight.length - 1].weight_fasting!.toFixed(1))
      : null;

    // 7d avg = mean of last 7 weight entries
    const last7Weights = withWeight.slice(-7);
    const sevenDayAvgWeight = last7Weights.length > 0
      ? Number((last7Weights.reduce((s, d) => s + d.weight_fasting!, 0) / last7Weights.length).toFixed(1))
      : null;

    // Previous 7d avg (days 8-14) for delta
    const prev7Weights = withWeight.slice(-14, -7);
    const prevAvg = prev7Weights.length > 0
      ? prev7Weights.reduce((s, d) => s + d.weight_fasting!, 0) / prev7Weights.length
      : null;

    const weightDelta7d = sevenDayAvgWeight != null && prevAvg != null
      ? Number((sevenDayAvgWeight - prevAvg).toFixed(1))
      : null;

    // Avg steps = mean of last 7 step entries
    const withSteps = allData.filter(d => d.steps != null);
    const last7Steps = withSteps.slice(-7);
    const avgSteps7d = last7Steps.length > 0
      ? Math.round(last7Steps.reduce((s, d) => s + d.steps!, 0) / last7Steps.length)
      : null;

    return {
      currentWeight,
      sevenDayAvgWeight,
      streak,
      avgSteps7d,
      weightDelta7d,
      isLoading,
    };
  }, [allData, dataLoading, streak]);
}
