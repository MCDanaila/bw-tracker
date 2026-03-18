import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';

interface StepsBarChartProps {
  data: Array<{ date: string; shortDate: string; steps: number | null }>;
  stepsGoal: number;
  isLoading?: boolean;
}

function getBarColor(steps: number | null, goal: number): string {
  if (steps == null || steps === 0) return 'hsl(var(--muted))';
  if (steps >= goal) return 'var(--color-status-excellent)';
  if (steps >= goal * 0.8) return 'var(--color-status-warning)';
  return 'var(--color-status-danger)';
}

export function StepsBarChart({ data, stepsGoal, isLoading }: StepsBarChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Daily Steps</CardTitle></CardHeader>
        <CardContent className="py-8">
          <div className="h-48 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Daily Steps</CardTitle></CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
            <XAxis
              dataKey="shortDate"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number) => [
                `${value?.toLocaleString()} steps (${Math.round((value / stepsGoal) * 100)}%)`,
                'Steps',
              ]}
              labelFormatter={(label) => label}
            />
            <ReferenceLine
              y={stepsGoal}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <Bar dataKey="steps" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.steps, stepsGoal)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
