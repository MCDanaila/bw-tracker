import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/core/components/ui/badge';
import type { AthleteWithStats } from '../hooks/useAthletes';

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString('it-IT');
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 50;
  const h = 20;
  const padding = 2;

  const points = values
    .map((v, i) => {
      const x = padding + (i / (values.length - 1)) * (w - padding * 2);
      const y = h - padding - ((v - min) / range) * (h - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  // Green if trending down, red if up
  const isDown = values[values.length - 1] < values[0];
  const stroke = isDown ? '#22c55e' : '#ef4444';

  return (
    <svg width={w} height={h} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function complianceBadgeClass(value: number | null): string {
  if (value == null) return 'bg-muted text-muted-foreground';
  if (value >= 80) return 'bg-status-good/20 text-status-good';
  if (value >= 60) return 'bg-status-warning/20 text-status-warning';
  return 'bg-status-danger/20 text-status-danger';
}

export const athletesColumns: ColumnDef<AthleteWithStats>[] = [
  {
    accessorKey: 'username',
    header: 'Name',
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.username || row.original.email}
      </span>
    ),
  },
  {
    accessorKey: 'lastLogDate',
    header: 'Last Log',
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {relativeTime(row.original.lastLogDate)}
      </span>
    ),
  },
  {
    accessorKey: 'currentWeight',
    header: 'Weight',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span>{row.original.currentWeight != null ? `${row.original.currentWeight} kg` : '—'}</span>
        <Sparkline values={row.original.weightTrend} />
      </div>
    ),
  },
  {
    accessorKey: 'dietAdherence',
    header: 'Diet',
    cell: ({ row }) => (
      <Badge variant="outline" className={complianceBadgeClass(row.original.dietAdherence)}>
        {row.original.dietAdherence != null ? `${row.original.dietAdherence}%` : '—'}
      </Badge>
    ),
  },
  {
    accessorKey: 'stepsCompliance',
    header: 'Steps',
    cell: ({ row }) => (
      <Badge variant="outline" className={complianceBadgeClass(row.original.stepsCompliance)}>
        {row.original.stepsCompliance != null ? `${row.original.stepsCompliance}%` : '—'}
      </Badge>
    ),
  },
  {
    accessorKey: 'activeAlerts',
    header: 'Alerts',
    cell: ({ row }) => {
      const count = row.original.activeAlerts;
      if (count === 0) return <span className="text-muted-foreground">0</span>;
      return (
        <Badge variant="destructive">{count}</Badge>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      const className = status === 'active'
        ? 'bg-status-good/20 text-status-good'
        : status === 'paused'
        ? 'bg-status-warning/20 text-status-warning'
        : 'bg-status-danger/20 text-status-danger';
      return (
        <Badge variant="outline" className={className}>
          {status}
        </Badge>
      );
    },
  },
];
