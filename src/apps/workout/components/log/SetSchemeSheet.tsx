import { useState } from 'react';
import type { FreeSetType } from '../../types/workout-log';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (type: FreeSetType, count: number) => void;
}

const SCHEME_OPTIONS: { type: FreeSetType; label: string }[] = [
  { type: 'warmup',     label: 'Warm-up'    },
  { type: 'normal',     label: 'Normal'     },
  { type: 'range',      label: 'Range'      },
  { type: 'dropset',    label: 'Drop Set'   },
  { type: 'rest_pause', label: 'Rest-Pause' },
  { type: 'max_reps',   label: 'AMRAP'      },
];

export default function SetSchemeSheet({ open, onClose, onConfirm }: Props) {
  const [selectedType, setSelectedType] = useState<FreeSetType>('normal');
  const [count, setCount] = useState(3);

  if (!open) return null;

  function handleConfirm() {
    onConfirm(selectedType, count);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div className="w-full bg-card rounded-t-2xl p-6 space-y-5" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-foreground text-lg">Add Sets</h3>

        {/* Scheme type selector */}
        <div className="grid grid-cols-3 gap-2">
          {SCHEME_OPTIONS.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                selectedType === type
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Set count stepper */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Number of sets</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCount(c => Math.max(1, c - 1))}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-xl leading-none"
            >
              −
            </button>
            <span className="text-foreground font-semibold w-4 text-center">{count}</span>
            <button
              onClick={() => setCount(c => Math.min(10, c + 1))}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-xl leading-none"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold active:scale-[0.98] transition-transform"
        >
          Add {count} {count === 1 ? 'Set' : 'Sets'}
        </button>
      </div>
    </div>
  );
}
