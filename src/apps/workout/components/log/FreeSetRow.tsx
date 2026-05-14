import { Circle, CheckCircle2 } from 'lucide-react';
import type { FreeSetLog, FreeSetType } from '../../types/workout-log';

interface Props {
  set: FreeSetLog;
  index: number;
  onChange: (set: FreeSetLog) => void;
}

const BADGE: Record<FreeSetType, { label: string; className: string }> = {
  warmup:     { label: 'W',  className: 'bg-sky-500/15 text-sky-500' },
  normal:     { label: '',   className: 'bg-muted text-muted-foreground' },
  range:      { label: 'R',  className: 'bg-purple-500/15 text-purple-500' },
  dropset:    { label: 'D',  className: 'bg-orange-500/15 text-orange-500' },
  rest_pause: { label: 'RP', className: 'bg-amber-500/15 text-amber-600' },
  max_reps:   { label: 'F',  className: 'bg-destructive/15 text-destructive' },
};

const inputBase =
  'w-full bg-transparent text-center text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-40';

export default function FreeSetRow({ set, index, onChange }: Props) {
  const badge = BADGE[set.type];
  const badgeLabel = badge.label || String(index + 1);

  function patch(field: Partial<FreeSetLog>) {
    onChange({ ...set, ...field });
  }

  return (
    <div
      className={`grid grid-cols-[28px_1fr_1fr_1fr_1fr_32px] items-center gap-1 py-1.5 transition-opacity ${
        set.completed ? 'opacity-50' : ''
      }`}
    >
      <span className={`text-[10px] font-bold rounded px-1 py-0.5 text-center leading-tight ${badge.className}`}>
        {badgeLabel}
      </span>

      <input
        type="text"
        inputMode="decimal"
        value={set.weight}
        onChange={e => patch({ weight: e.target.value })}
        placeholder="kg"
        disabled={set.completed}
        className={inputBase}
      />

      <input
        type="text"
        inputMode="numeric"
        value={set.reps}
        onChange={e => patch({ reps: e.target.value })}
        placeholder={set.type === 'max_reps' ? '∞' : 'reps'}
        disabled={set.completed}
        className={inputBase}
      />

      <input
        type="text"
        inputMode="numeric"
        value={set.rir}
        onChange={e => patch({ rir: e.target.value })}
        placeholder="RIR"
        disabled={set.completed}
        className={inputBase}
      />

      <input
        type="text"
        inputMode="numeric"
        value={set.rest}
        onChange={e => patch({ rest: e.target.value })}
        placeholder="rest"
        disabled={set.completed}
        className={inputBase}
      />

      <button
        onClick={() => patch({ completed: !set.completed })}
        className="flex items-center justify-center text-muted-foreground"
      >
        {set.completed
          ? <CheckCircle2 size={20} className="text-primary" />
          : <Circle size={20} />}
      </button>
    </div>
  );
}
