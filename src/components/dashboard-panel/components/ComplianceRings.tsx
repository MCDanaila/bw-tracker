import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ComplianceRingsProps {
  diet: number;
  training: number;
  steps: number;
  isLoading?: boolean;
}

interface RingConfig {
  label: string;
  value: number;
  color: string;
  radius: number;
}

export function ComplianceRings({ diet, training, steps, isLoading }: ComplianceRingsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Weekly Compliance</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="h-40 w-40 animate-pulse rounded-full bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const size = 160;
  const strokeWidth = 10;
  const gap = 4;

  const rings: RingConfig[] = [
    { label: 'Diet', value: diet, color: 'var(--color-metric-diet)', radius: (size / 2) - strokeWidth / 2 },
    { label: 'Training', value: training, color: 'var(--color-metric-training)', radius: (size / 2) - strokeWidth - gap - strokeWidth / 2 },
    { label: 'Steps', value: steps, color: 'var(--color-metric-steps)', radius: (size / 2) - 2 * (strokeWidth + gap) - strokeWidth / 2 },
  ];

  return (
    <Card>
      <CardHeader><CardTitle>Weekly Compliance</CardTitle></CardHeader>
      <CardContent className="flex flex-col items-center pb-6">
        <div style={{ width: size, height: size }}>
          <svg width={size} height={size}>
            {rings.map((ring) => {
              const circumference = 2 * Math.PI * ring.radius;
              const fillPercent = Math.min(ring.value, 100) / 100;
              const offset = circumference * (1 - fillPercent);

              return (
                <g key={ring.label}>
                  {/* Background circle */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={ring.radius}
                    fill="none"
                    stroke="currentColor"
                    className="text-muted/20"
                    strokeWidth={strokeWidth}
                  />
                  {/* Progress circle */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={ring.radius}
                    fill="none"
                    stroke={ring.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    className="transition-all duration-1000 ease-out"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-4 flex gap-4 text-xs">
          {rings.map((ring) => (
            <div key={ring.label} className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: ring.color }}
              />
              <span className="text-muted-foreground">{ring.label}</span>
              <span className="font-medium">{Math.round(ring.value)}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
