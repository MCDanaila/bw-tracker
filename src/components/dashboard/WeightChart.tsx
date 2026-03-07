import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { DailyLogChartData } from '../../hooks/useDashboardData';
import { useMemo } from 'react';

interface WeightChartProps {
    data: DailyLogChartData[];
}

export default function WeightChart({ data }: WeightChartProps) {
    
    // Custom tooltip to make it look native
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100/50 backdrop-blur-md">
                    <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
                    <p className="text-lg font-bold text-[#8b76c8]">
                        {payload[0].value} <span className="text-xs font-medium text-gray-400">kg</span>
                    </p>
                </div>
            );
        }
        return null;
    };

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
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center h-64">
                <p className="text-gray-400 text-sm">Nessun dato sul peso disponibile</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        Andamento Peso
                    </h3>
                    {trendStats && (
                        <div className="flex items-center gap-1 mt-1 text-sm font-medium">
                            {trendStats.isDown && <TrendingDown size={16} className="text-green-500" />}
                            {trendStats.isUp && <TrendingUp size={16} className="text-red-500" />}
                            {!trendStats.isDown && !trendStats.isUp && <Minus size={16} className="text-gray-400" />}
                            
                            <span className={trendStats.isDown ? 'text-green-600' : trendStats.isUp ? 'text-red-600' : 'text-gray-500'}>
                                {trendStats.diff > 0 ? '+' : ''}{trendStats.diff.toFixed(1)} kg
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b76c8" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8b76c8" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                            dataKey="shortDate" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            dy={10}
                        />
                        <YAxis 
                            domain={[min, max]} 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            dx={-10}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#8b76c8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Line
                            type="monotone"
                            dataKey="weight_fasting"
                            stroke="#8b76c8"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#8b76c8', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, fill: '#8b76c8', strokeWidth: 2, stroke: '#fff' }}
                            connectNulls={true}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
