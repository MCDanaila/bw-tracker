import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { DailyLogChartData } from '@/hooks/useDashboardData';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

const chartConfig = {
    weight_fasting: {
        label: "Weight",
        color: "var(--primary)",
    },
} satisfies ChartConfig;

interface WeightChartProps {
    data: DailyLogChartData[];
}

export default function WeightChart({ data }: WeightChartProps) {

    // Calculate trend lines and differences
    const trendStats = useMemo(() => {
        const validWeights = data.filter(d => d.weight_fasting !== null) as { weight_fasting: number }[];
        if (validWeights.length < 2) return null;

        const first = validWeights[0].weight_fasting;
        const last = validWeights[validWeights.length - 1].weight_fasting;
        const diff = last - first;
        const isUp = diff > 0;
        const isDown = diff < 0;

        return { diff, isUp, isDown };
    }, [data]);

    // Calculate min/max for tighter Y-axis domain
    const { min, max } = useMemo(() => {
        let minWeight = Infinity;
        let maxWeight = -Infinity;

        data.forEach(d => {
            if (d.weight_fasting !== null) {
                if (d.weight_fasting < minWeight) minWeight = d.weight_fasting;
                if (d.weight_fasting > maxWeight) maxWeight = d.weight_fasting;
            }
        });

        if (minWeight === Infinity) return { min: 60, max: 100 }; // Default fallbacks

        return {
            min: Math.floor(minWeight - 1),
            max: Math.ceil(maxWeight + 1)
        };
    }, [data]);


    if (data.length === 0) {
        return (
            <Card className="flex flex-col items-center justify-center h-64 mt-6">
                <CardContent className="pt-6">
                    <p className="text-muted-foreground text-sm">Nessun dato sul peso disponibile</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mt-6">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">Andamento Peso</CardTitle>
                {trendStats && (
                    <CardDescription className="flex items-center gap-1 mt-1 font-medium">
                        {trendStats.isDown && <TrendingDown size={16} className="text-primary" />}
                        {trendStats.isUp && <TrendingUp size={16} className="text-destructive" />}
                        {!trendStats.isDown && !trendStats.isUp && <Minus size={16} className="text-muted-foreground" />}

                        <span className={trendStats.isDown ? 'text-primary' : trendStats.isUp ? 'text-destructive' : 'text-muted-foreground'}>
                            {trendStats.diff > 0 ? '+' : ''}{trendStats.diff.toFixed(1)} kg
                        </span>
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-64 w-full">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-weight_fasting)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--color-weight_fasting)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis
                            dataKey="shortDate"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                            dy={10}
                        />
                        <YAxis
                            domain={[min, max]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                            dx={-10}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Line
                            type="monotone"
                            dataKey="weight_fasting"
                            stroke="var(--color-weight_fasting)"
                            strokeWidth={3}
                            dot={{ r: 4, fill: 'var(--color-weight_fasting)', strokeWidth: 2, stroke: 'var(--background)' }}
                            activeDot={{ r: 6, fill: 'var(--color-weight_fasting)', strokeWidth: 2, stroke: 'var(--background)' }}
                            connectNulls={true}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
