import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Cell
} from 'recharts';
import { Footprints } from 'lucide-react';
import type { DailyLogChartData } from '../../hooks/useDashboardData';

interface StepsChartProps {
    data: DailyLogChartData[];
    targetSteps?: number;
}

export default function StepsChart({ data, targetSteps = 10000 }: StepsChartProps) {
    
    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100/50 backdrop-blur-md">
                    <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
                    <p className="text-lg font-bold text-[#8b76c8]">
                        {payload[0].value.toLocaleString('it-IT')} <span className="text-xs font-medium text-gray-400">passi</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    if (data.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center h-64 mt-6">
                <p className="text-gray-400 text-sm">Nessun dato sui passi disponibile</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mt-6">
            <div className="flex justify-between items-start mb-6">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Footprints size={18} className="text-[#8b76c8]" />
                    Andamento Passi
                </h3>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                            dataKey="shortDate" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                            dx={-10}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#8b76c8', opacity: 0.05 }} />
                        
                        <ReferenceLine 
                            y={targetSteps} 
                            stroke="#10b981" 
                            strokeDasharray="4 4" 
                            strokeWidth={1}
                        />
                        
                        <Bar 
                            dataKey="steps" 
                            radius={[6, 6, 0, 0]}
                            maxBarSize={40}
                        >
                            {data.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.steps && entry.steps >= targetSteps ? '#8b76c8' : '#c4b5fd'} 
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
