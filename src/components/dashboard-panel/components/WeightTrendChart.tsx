import {
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { TimeRange } from '@/hooks/useDashboardData';

interface WeightTrendChartProps {
  data: Array<{ date: string; shortDate: string; weight_fasting: number | null }>;
  targetWeight?: number | null;
  dateRange: TimeRange;
  onRangeChange?: (range: TimeRange) => void;
  isLoading?: boolean;
}

const ranges: { label: string; value: TimeRange }[] = [
  { label: '7d', value: '7d' },
  { label: '14d', value: '14d' },
  { label: '1m', value: '1m' },
  { label: '3m', value: '3m' },
  { label: 'All', value: 'all' },
];

function computeMA(data: Array<{ weight_fasting: number | null }>, window: number): (number | null)[] {
  return data.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1).filter(d => d.weight_fasting != null);
    if (slice.length === 0) return null;
    return slice.reduce((sum, d) => sum + d.weight_fasting!, 0) / slice.length;
  });
}

export function WeightTrendChart({ data, targetWeight, dateRange, onRangeChange, isLoading }: WeightTrendChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Weight Trend</CardTitle></CardHeader>
        <CardContent className="py-8">
          <div className="h-64 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const ma7 = computeMA(data, 7);
  const ma14 = computeMA(data, 14);

  const chartData = data.map((d, i) => ({
    ...d,
    ma7: ma7[i],
    ma14: ma14[i],
  }));

  // Compute Y-axis domain
  const weights = data.map(d => d.weight_fasting).filter((w): w is number => w != null);
  const allValues = [...weights];
  if (targetWeight) allValues.push(targetWeight);
  const min = allValues.length > 0 ? Math.floor(Math.min(...allValues) - 1) : 70;
  const max = allValues.length > 0 ? Math.ceil(Math.max(...allValues) + 1) : 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weight Trend</CardTitle>
        {onRangeChange && (
          <CardAction>
            <div className="flex gap-1">
              {ranges.map((r) => (
                <Button
                  key={r.value}
                  variant={dateRange === r.value ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => onRangeChange(r.value)}
                >
                  {r.label}
                </Button>
              ))}
            </div>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
            <XAxis
              dataKey="shortDate"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[min, max]}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  weight_fasting: 'Raw',
                  ma7: '7d MA',
                  ma14: '14d MA',
                };
                return [value != null ? `${value.toFixed(1)} kg` : '—', labels[name] ?? name];
              }}
            />
            {/* Goal line */}
            {targetWeight && (
              <ReferenceLine
                y={targetWeight}
                stroke="hsl(var(--destructive))"
                strokeDasharray="6 3"
                strokeWidth={1}
              />
            )}
            {/* Raw weight dots */}
            <Scatter
              dataKey="weight_fasting"
              fill="var(--color-metric-weight)"
              fillOpacity={0.3}
              r={3}
            />
            {/* 7-day MA */}
            <Line
              type="monotone"
              dataKey="ma7"
              stroke="var(--color-metric-weight)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            {/* 14-day MA */}
            <Line
              type="monotone"
              dataKey="ma14"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
