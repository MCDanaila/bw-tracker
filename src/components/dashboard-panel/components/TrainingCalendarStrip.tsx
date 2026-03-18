import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getLocalDateStr } from '@/lib/utils';

interface TrainingDay {
  date: string;
  dayLabel: string;
  workoutSession: string | null;
  rpe: number | null;
  duration: number | null;
}

interface TrainingCalendarStripProps {
  days: TrainingDay[];
  isLoading?: boolean;
}

function getRpeColor(rpe: number | null): string {
  if (rpe == null) return '';
  if (rpe <= 4) return 'bg-status-excellent';
  if (rpe <= 7) return 'bg-status-warning';
  return 'bg-status-danger';
}

export function TrainingCalendarStrip({ days, isLoading }: TrainingCalendarStripProps) {
  const today = getLocalDateStr(new Date());

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Training This Week</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-20 flex-1 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Training This Week</CardTitle></CardHeader>
      <CardContent>
        <div className="flex gap-1.5">
          {days.map((day) => {
            const isRest = !day.workoutSession || day.workoutSession === 'Rest';
            const isToday = day.date === today;

            return (
              <div
                key={day.date}
                className={`flex flex-1 flex-col items-center rounded-md p-2 text-center transition-colors ${
                  isToday
                    ? 'ring-2 ring-primary'
                    : ''
                } ${
                  isRest
                    ? 'bg-muted/50 text-muted-foreground'
                    : 'bg-card'
                }`}
              >
                <span className="text-[10px] font-medium uppercase text-muted-foreground">
                  {day.dayLabel}
                </span>
                <span className="mt-1 text-xs font-semibold">
                  {isRest ? 'Rest' : day.workoutSession}
                </span>
                {!isRest && day.rpe != null && (
                  <div className="mt-1 flex items-center gap-1">
                    <div className={`h-1.5 w-1.5 rounded-full ${getRpeColor(day.rpe)}`} />
                    <span className="text-[10px] text-muted-foreground">RPE {day.rpe}</span>
                  </div>
                )}
                {!isRest && day.duration != null && (
                  <span className="mt-0.5 text-[10px] text-muted-foreground">
                    {day.duration}m
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
