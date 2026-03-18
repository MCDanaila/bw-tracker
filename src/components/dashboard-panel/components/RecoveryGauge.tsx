import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface RecoveryGaugeProps {
  score: number | null;
  trend?: 'up' | 'down' | 'stable' | null;
  isLoading?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 81) return 'var(--color-status-excellent)';
  if (score >= 61) return 'var(--color-status-good)';
  if (score >= 41) return 'var(--color-status-warning)';
  return 'var(--color-status-danger)';
}

export function RecoveryGauge({ score, trend, isLoading }: RecoveryGaugeProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Recovery Score</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="h-40 w-40 animate-pulse rounded-full bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // 270 degrees = 3/4 of circle
  const arcLength = circumference * 0.75;
  const rotation = 135; // start at bottom-left (135 degrees from top)

  const fillPercent = score != null ? Math.min(score, 100) / 100 : 0;
  const fillOffset = arcLength * (1 - fillPercent);

  const scoreColor = score != null ? getScoreColor(score) : 'var(--color-status-neutral)';

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <Card>
      <CardHeader><CardTitle>Recovery Score</CardTitle></CardHeader>
      <CardContent className="flex flex-col items-center pb-6">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="overflow-visible">
            {/* Background arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              className="text-muted/30"
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference - arcLength}`}
              strokeDashoffset={0}
              strokeLinecap="round"
              transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
            />
            {/* Fill arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={scoreColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference - arcLength}`}
              strokeDashoffset={fillOffset}
              strokeLinecap="round"
              transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold" style={{ color: scoreColor }}>
              {score != null ? score : '--'}
            </span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>
        {trend && (
          <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
            <TrendIcon size={14} />
            <span>vs last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
