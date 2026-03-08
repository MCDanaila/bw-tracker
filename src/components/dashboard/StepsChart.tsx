import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    ReferenceLine,
    Cell
} from 'recharts';
import { Footprints } from 'lucide-react';
import type { DailyLogChartData } from '@/hooks/useDashboardData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

const chartConfig = {
    steps: {
        label: "Steps",
        color: "var(--primary)",
    },
} satisfies ChartConfig;

interface StepsChartProps {
    data: DailyLogChartData[];
    targetSteps?: number;
}

export default function StepsChart({ data, targetSteps = 10000 }: StepsChartProps) {


    if (data.length === 0) {
        return (
            <Card className="flex flex-col items-center justify-center h-64 mt-6">
                <CardContent className="pt-6">
                    <p className="text-muted-foreground text-sm">Nessun dato sui passi disponibile</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mt-6">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-foreground">
                    <Footprints size={18} className="text-primary" />
                    Andamento Passi
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-64 w-full">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis
                            dataKey="shortDate"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                            tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                            dx={-10}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />

                        <ReferenceLine
                            y={targetSteps}
                            stroke="var(--secondary)"
                            strokeDasharray="4 4"
                            strokeWidth={1}
                        />

                        <Bar
                            dataKey="steps"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={40}
                            fill="var(--color-steps)"
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.steps && entry.steps >= targetSteps ? 'var(--color-steps)' : 'var(--muted)'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
