import { type ColumnDef } from '@tanstack/react-table';
import type { DailyLog } from '@/core/types/database';
import { Badge } from '@/core/components/ui/badge';
import {
  SLEEP_QUALITY_OPTIONS,
  ENERGY_OPTIONS,
  MOOD_OPTIONS,
  getLabelByValue,
} from '@/core/lib/constants';

const NULL_PLACEHOLDER = '—';

const dietAdherenceConfig = {
  perfect: { label: 'Perfect', className: 'bg-green-100 text-green-800' },
  minor_deviation: { label: 'Minor Deviation', className: 'bg-amber-100 text-amber-800' },
  cheat_meal: { label: 'Cheat Meal', className: 'bg-red-100 text-red-800' },
} as const;

function getRpeColor(rpe: number): string {
  if (rpe <= 4) return 'text-green-600';
  if (rpe <= 7) return 'text-amber-600';
  return 'text-red-600';
}

function getOptionAriaLabel(
  options: readonly { label: string; value: number; ariaLabel: string }[],
  value: number | null,
): string | null {
  if (value == null) return null;
  const option = options.find((opt) => opt.value === value);
  return option?.ariaLabel ?? null;
}

export const logsColumns: ColumnDef<DailyLog>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => {
      const date = row.original.date;
      return date ? new Date(date).toLocaleDateString() : NULL_PLACEHOLDER;
    },
  },
  {
    accessorKey: 'weight_fasting',
    header: 'Weight',
    cell: ({ row }) => {
      const value = row.original.weight_fasting;
      return value != null ? (
        <span className="tabular-nums">{value} kg</span>
      ) : NULL_PLACEHOLDER;
    },
  },
  {
    accessorKey: 'steps',
    header: 'Steps',
    cell: ({ row }) => {
      const value = row.original.steps;
      return value != null ? (
        <span className="tabular-nums">{value.toLocaleString()}</span>
      ) : NULL_PLACEHOLDER;
    },
  },
  {
    accessorKey: 'sleep_hours',
    header: 'Sleep Hours',
    cell: ({ row }) => {
      const value = row.original.sleep_hours;
      return value != null ? (
        <span className="tabular-nums">{value}h</span>
      ) : NULL_PLACEHOLDER;
    },
  },
  {
    accessorKey: 'sleep_quality',
    header: 'Sleep Quality',
    cell: ({ row }) => {
      const value = row.original.sleep_quality;
      if (value == null) return NULL_PLACEHOLDER;
      const label = getLabelByValue(SLEEP_QUALITY_OPTIONS, value);
      return <Badge variant="outline">{label}</Badge>;
    },
  },
  {
    accessorKey: 'diet_adherence',
    header: 'Diet Adherence',
    cell: ({ row }) => {
      const value = row.original.diet_adherence;
      if (value == null) return NULL_PLACEHOLDER;
      const config = dietAdherenceConfig[value];
      return (
        <Badge variant="outline" className={config.className}>
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'gym_rpe',
    header: 'Gym RPE',
    cell: ({ row }) => {
      const value = row.original.gym_rpe;
      if (value == null) return NULL_PLACEHOLDER;
      return (
        <span className={`tabular-nums font-medium ${getRpeColor(value)}`}>
          {value}
        </span>
      );
    },
  },
  {
    accessorKey: 'water_liters',
    header: 'Water',
    cell: ({ row }) => {
      const value = row.original.water_liters;
      return value != null ? (
        <span className="tabular-nums">{value} L</span>
      ) : NULL_PLACEHOLDER;
    },
  },
  {
    accessorKey: 'daily_energy',
    header: 'Energy',
    cell: ({ row }) => {
      const value = row.original.daily_energy;
      if (value == null) return NULL_PLACEHOLDER;
      const label = getLabelByValue(ENERGY_OPTIONS, value);
      const ariaLabel = getOptionAriaLabel(ENERGY_OPTIONS, value);
      return <span title={ariaLabel ?? undefined}>{label}</span>;
    },
  },
  {
    accessorKey: 'mood',
    header: 'Mood',
    cell: ({ row }) => {
      const value = row.original.mood;
      if (value == null) return NULL_PLACEHOLDER;
      const label = getLabelByValue(MOOD_OPTIONS, value);
      const ariaLabel = getOptionAriaLabel(MOOD_OPTIONS, value);
      return <span title={ariaLabel ?? undefined}>{label}</span>;
    },
  },
];
