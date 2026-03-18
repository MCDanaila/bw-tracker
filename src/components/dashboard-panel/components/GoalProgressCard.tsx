import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface GoalProgressCardProps {
  label: string;
  current: number | null;
  target: number;
  unit: string;
  color: string;
  inverted?: boolean;
}

export function GoalProgressCard({ label, current, target, unit, color, inverted }: GoalProgressCardProps) {
  const progress = current != null
    ? inverted
      ? Math.min(100, Math.max(0, ((target > 0 ? (1 - (current - target) / current) : 0) * 100)))
      : Math.min(100, (current / target) * 100)
    : 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {current != null ? `${current} / ${target} ${unit}` : `— / ${target} ${unit}`}
          </p>
        </div>
        <Progress value={progress} className={`h-2 ${color}`} />
        <p className="mt-1 text-xs text-muted-foreground text-right">
          {Math.round(progress)}%
        </p>
      </CardContent>
    </Card>
  );
}
