import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface BiofeedbackRadarProps {
  axes: Array<{
    axis: string;
    currentWeek: number;
    previousWeek: number;
  }>;
  isLoading?: boolean;
}

export function BiofeedbackRadar({ axes, isLoading }: BiofeedbackRadarProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Biofeedback</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="h-48 w-48 animate-pulse rounded-full bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Biofeedback</CardTitle></CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={axes} outerRadius="70%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <Radar
              name="This Week"
              dataKey="currentWeek"
              stroke="hsl(var(--chart-1))"
              fill="hsl(var(--chart-1))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Radar
              name="Last Week"
              dataKey="previousWeek"
              stroke="hsl(var(--muted-foreground))"
              fill="none"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
