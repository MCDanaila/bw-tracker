import { useState } from 'react';
import type { DayOfWeek, WeeklyMacros } from '@/core/hooks/useDietData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/core/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/core/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { BarChart2, Table as TableIcon } from 'lucide-react';

interface WeeklyOverviewProps {
    weeklyTotals: WeeklyMacros;
    weeklyAverage: {
        kcal: number;
        protein: number;
        carbs: number;
        fats: number;
        cgRatio: number;
    };
    days: DayOfWeek[];
}

export default function WeeklyOverview({ weeklyTotals, weeklyAverage, days }: WeeklyOverviewProps) {
    const [viewMode, setViewMode] = useState<'charts' | 'table'>('charts');

    const formatNumber = (num: number, decimals: number = 0) => num.toLocaleString('it-IT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

    // Chart Data and Configs
    const chartData = days.map(day => ({
        day,
        kcal: weeklyTotals[day].kcal,
        protein: weeklyTotals[day].protein,
        carbs: weeklyTotals[day].carbs,
        fats: weeklyTotals[day].fats,
    }));

    const chartConfigKcal = {
        kcal: {
            label: "KCAL",
            color: "var(--primary)",
        },
    } satisfies ChartConfig;

    const chartConfigMacros = {
        protein: { label: "Protein (g)", color: "var(--chart-1)" },
        carbs: { label: "Carbs (g)", color: "var(--chart-2)" },
        fats: { label: "Fats (g)", color: "var(--chart-4)" },
    } satisfies ChartConfig;

    return (
        <div className="mb-6 animate-fade-in text-foreground">
            {/* View Toggle Header */}
            <div className="flex items-center justify-end mb-4">
                <Tabs value={viewMode} onValueChange={(val) => setViewMode(val as 'charts' | 'table')} className="w-auto">
                    <TabsList className="h-9">
                        <TabsTrigger value="charts" className="px-3 py-1 flex gap-2 items-center text-xs">
                            <BarChart2 size={14} /> Charts
                        </TabsTrigger>
                        <TabsTrigger value="table" className="px-3 py-1 flex gap-2 items-center text-xs">
                            <TableIcon size={14} /> Table
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Charts View */}
            {viewMode === 'charts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                    {/* KCAL Chart */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex justify-between items-center text-muted-foreground">
                                ENERGY
                                <span className="text-foreground text-lg font-bold">
                                    {formatNumber(weeklyAverage.kcal)} <span className="text-xs font-normal text-muted-foreground">kcal/avg</span>
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfigKcal} className="h-40 w-full">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis
                                        dataKey="day"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                        dx={-10}
                                        tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                                    />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                    <ReferenceLine y={weeklyAverage.kcal} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
                                    <Bar dataKey="kcal" radius={[4, 4, 0, 0]} maxBarSize={30} fill="var(--color-kcal)" />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Macros Chart */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex justify-between items-center text-muted-foreground">
                                MACRONUTRIENTS
                                <div className="flex gap-2 text-xs">
                                    <span className="flex items-center gap-1 font-bold">
                                        <span className="w-2 h-2 rounded-full" style={{ background: 'var(--chart-1)' }}></span> {formatNumber(weeklyAverage.protein)}g P
                                    </span>
                                    <span className="flex items-center gap-1 font-bold">
                                        <span className="w-2 h-2 rounded-full" style={{ background: 'var(--chart-4)' }}></span> {formatNumber(weeklyAverage.carbs)}g C
                                    </span>
                                    <span className="flex items-center gap-1 font-bold">
                                        <span className="w-2 h-2 rounded-full" style={{ background: 'var(--chart-2)' }}></span> {formatNumber(weeklyAverage.fats)}g G
                                    </span>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfigMacros} className="h-40 w-full">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis
                                        dataKey="day"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                        dx={-10}
                                    />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                    <Bar dataKey="protein" stackId="a" fill="var(--color-protein)" maxBarSize={30} />
                                    <Bar dataKey="carbs" stackId="a" fill="var(--color-carbs)" maxBarSize={30} />
                                    <Bar dataKey="fats" stackId="a" radius={[4, 4, 0, 0]} fill="var(--color-fats)" maxBarSize={30} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Table View (Transposed Grid) */}
            {viewMode === 'table' && (
                <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-border/50 overflow-hidden animate-fade-in">
                    <Table className="w-full text-sm">
                        <TableHeader>
                            <TableRow className="bg-muted/30 border-b border-border/50">
                                <TableHead className="p-3 w-20 font-semibold text-foreground">DAY</TableHead>
                                <TableHead className="p-3 font-semibold text-right text-foreground">KCAL</TableHead>
                                <TableHead className="p-3 font-semibold text-right text-foreground"><span className="hidden sm:inline">PROTEIN</span><span className="sm:hidden">PRO</span></TableHead>
                                <TableHead className="p-3 font-semibold text-right text-foreground"><span className="hidden sm:inline">CARBS</span><span className="sm:hidden">CAR</span></TableHead>
                                <TableHead className="p-3 font-semibold text-right text-foreground"><span className="hidden sm:inline">FATS</span><span className="sm:hidden">FAT</span></TableHead>
                                <TableHead className="p-3 font-semibold text-right text-foreground"><span className="hidden sm:inline">C:F RATIO</span><span className="sm:hidden">C:F</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Average Row */}
                            <TableRow className="bg-primary/5 hover:bg-primary/10 border-b-2 border-primary/20">
                                <TableCell className="p-3 font-bold text-primary">AVERAGE</TableCell>
                                <TableCell className="p-3 font-bold text-right text-foreground">{formatNumber(weeklyAverage.kcal)}</TableCell>
                                <TableCell className="p-3 font-bold text-right text-chart-1">{formatNumber(weeklyAverage.protein)}g</TableCell>
                                <TableCell className="p-3 font-bold text-right text-chart-4">{formatNumber(weeklyAverage.carbs)}g</TableCell>
                                <TableCell className="p-3 font-bold text-right text-chart-2">{formatNumber(weeklyAverage.fats)}g</TableCell>
                                <TableCell className="p-3 font-bold text-right text-muted-foreground">{formatNumber(weeklyAverage.cgRatio, 2)}</TableCell>
                            </TableRow>

                            {/* Daily Rows */}
                            {days.map((day) => (
                                <TableRow key={day} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                    <TableCell className="p-3 font-semibold text-muted-foreground">{day}</TableCell>
                                    <TableCell className="p-3 text-right font-medium">{formatNumber(weeklyTotals[day].kcal)}</TableCell>
                                    <TableCell className="p-3 text-right">{formatNumber(weeklyTotals[day].protein)}<span className="text-2xs text-muted-foreground ml-0.5">g</span></TableCell>
                                    <TableCell className="p-3 text-right">{formatNumber(weeklyTotals[day].carbs)}<span className="text-2xs text-muted-foreground ml-0.5">g</span></TableCell>
                                    <TableCell className="p-3 text-right">{formatNumber(weeklyTotals[day].fats)}<span className="text-2xs text-muted-foreground ml-0.5">g</span></TableCell>
                                    <TableCell className="p-3 text-right text-xs text-muted-foreground">{formatNumber(weeklyTotals[day].cgRatio, 2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
