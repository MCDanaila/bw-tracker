import { useState } from 'react';
import { useAthleteContext } from '../contexts/AthleteContext';
import { useProfile } from '@/core/hooks/useProfile';
import { useDashboardData, type TimeRange } from '@/core/hooks/useDashboardData';
import { useHistoryLogs } from '@/core/hooks/useHistoryLogs';
import { WeightTrendChart } from '../components/WeightTrendChart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { ScrollArea } from '@/core/components/ui/scroll-area';
import { Skeleton } from '@/core/components/ui/skeleton';

export default function ProgressPage() {
  const { effectiveUserId } = useAthleteContext();
  const { data: profile } = useProfile(effectiveUserId);
  const [range, setRange] = useState<TimeRange>('1m');
  const { data: chartData, isLoading: chartLoading } = useDashboardData(range, effectiveUserId);
  const { data: logs, isLoading: logsLoading } = useHistoryLogs(effectiveUserId);

  // Filter logs by date range for the table
  const filteredLogs = filterLogsByRange(logs ?? [], range);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Progress</h1>

      <WeightTrendChart
        data={chartData ?? []}
        targetWeight={profile?.target_weight}
        dateRange={range}
        onRangeChange={setRange}
        isLoading={chartLoading}
      />

      {/* Raw data table */}
      <div className="rounded-lg border border-border">
        <ScrollArea className="max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Weight (kg)</TableHead>
                <TableHead className="text-right">Steps</TableHead>
                <TableHead className="text-right">Sleep (h)</TableHead>
                <TableHead>Diet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No data for this period
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.date}>
                    <TableCell className="font-medium">
                      {new Date(log.date).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {log.weight_fasting?.toFixed(1) ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {log.steps?.toLocaleString() ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {log.sleep_hours ?? '—'}
                    </TableCell>
                    <TableCell>
                      {log.diet_adherence ? (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          log.diet_adherence === 'perfect' ? 'bg-status-excellent/20 text-status-excellent' :
                          log.diet_adherence === 'minor_deviation' ? 'bg-status-warning/20 text-status-warning' :
                          'bg-status-danger/20 text-status-danger'
                        }`}>
                          {log.diet_adherence === 'perfect' ? 'Perfect' :
                           log.diet_adherence === 'minor_deviation' ? 'Minor Dev.' :
                           'Cheat'}
                        </span>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}

function filterLogsByRange(
  logs: Array<{ date: string; weight_fasting: number | null; steps: number | null; sleep_hours: number | null; diet_adherence: string | null }>,
  range: TimeRange
) {
  if (range === 'all') return logs;

  const limitDate = new Date();
  switch (range) {
    case '7d': limitDate.setDate(limitDate.getDate() - 7); break;
    case '14d': limitDate.setDate(limitDate.getDate() - 14); break;
    case '1m': limitDate.setMonth(limitDate.getMonth() - 1); break;
    case '3m': limitDate.setMonth(limitDate.getMonth() - 3); break;
  }

  return logs.filter(l => new Date(l.date) >= limitDate);
}
