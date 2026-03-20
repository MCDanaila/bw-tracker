import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/core/components/ui/card";

interface HeatmapData {
  athleteId: string;
  athleteName: string;
  days: Array<{
    date: string;
    score: number | null; // 0-100
  }>;
}

interface ComplianceHeatmapProps {
  data: HeatmapData[];
  dateRange?: number; // number of days to show (default 14)
  isLoading?: boolean;
}

function getScoreClasses(score: number | null): string {
  if (score === null) return "bg-muted text-muted-foreground";
  if (score <= 40) return "bg-status-danger/20 text-status-danger";
  if (score <= 60) return "bg-status-warning/20 text-status-warning";
  if (score <= 80) return "bg-status-good/20 text-status-good";
  return "bg-status-excellent/20 text-status-excellent";
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function ComplianceHeatmap({
  data,
  dateRange = 14,
  isLoading = false,
}: ComplianceHeatmapProps) {
  const navigate = useNavigate();

  // Collect unique sorted dates across all athletes, limited to dateRange
  const allDates = Array.from(
    new Set(data.flatMap((a) => a.days.map((d) => d.date)))
  )
    .sort()
    .slice(-dateRange);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, row) => (
              <div key={row} className="flex gap-1.5 items-center">
                <div className="h-6 w-24 shrink-0 animate-pulse rounded bg-muted" />
                {Array.from({ length: dateRange }).map((_, col) => (
                  <div
                    key={col}
                    className="h-6 w-8 shrink-0 animate-pulse rounded bg-muted"
                  />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Compliance Heatmap</CardTitle>
          <button
            type="button"
            aria-label="Compliance score explanation: red (0-40%), amber (41-60%), green (61-80%), emerald (81-100%), grey (no data)"
            className="text-xs text-muted-foreground cursor-pointer bg-transparent border-none p-0 leading-none"
          >
            ⓘ
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div
            className="grid gap-1 text-xs"
            style={{
              gridTemplateColumns: `8rem repeat(${allDates.length}, 2rem)`,
            }}
          >
            {/* Column headers */}
            <div /> {/* empty corner cell */}
            {allDates.map((date) => (
              <div
                key={date}
                className="text-center text-muted-foreground font-medium truncate"
              >
                {formatDateLabel(date)}
              </div>
            ))}

            {/* Athlete rows */}
            {data.map((athlete) => {
              const scoreMap = new Map(
                athlete.days.map((d) => [d.date, d.score])
              );

              return (
                <div key={athlete.athleteId} className="contents">
                  <button
                    type="button"
                    className="truncate text-left font-medium hover:underline cursor-pointer pr-2 min-h-[44px]"
                    onClick={() =>
                      navigate(`/dashboard/athletes/${athlete.athleteId}`)
                    }
                  >
                    {athlete.athleteName}
                  </button>
                  {allDates.map((date) => {
                    const score = scoreMap.get(date) ?? null;
                    return (
                      <div
                        key={date}
                        className={`h-6 w-8 rounded flex items-center justify-center text-2xs font-semibold ${getScoreClasses(score)}`}
                        aria-label={`${athlete.athleteName} — ${formatDateLabel(date)}: ${score !== null ? `${score}%` : "N/A"}`}
                      >
                        {score !== null ? score : "–"}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
