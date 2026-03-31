import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Label } from '@/core/components/ui/label';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
const DAY_LABELS: Record<string, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday',
};

interface CopyDayDialogProps {
  open: boolean;
  onClose: () => void;
  sourceDay: string;
  onCopy: (targetDays: string[]) => void;
}

export function CopyDayDialog({ open, onClose, sourceDay, onCopy }: CopyDayDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleDay = (day: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(DAYS.filter(d => d !== sourceDay)));
  };

  const deselectAll = () => {
    setSelected(new Set());
  };

  const allSelected = DAYS.filter(d => d !== sourceDay).every(d => selected.has(d));

  const handleCopy = () => {
    onCopy(Array.from(selected));
    setSelected(new Set());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Copy {DAY_LABELS[sourceDay] ?? sourceDay} to...</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={allSelected ? deselectAll : selectAll}
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DAYS.map(day => (
              <Label
                key={day}
                className={`flex items-center gap-2 rounded-md border p-2.5 cursor-pointer transition-colors ${day === sourceDay
                    ? 'opacity-40 cursor-not-allowed'
                    : selected.has(day)
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted'
                  }`}
              >
                <input
                  type="checkbox"
                  className="rounded border-input"
                  checked={selected.has(day)}
                  disabled={day === sourceDay}
                  onChange={() => toggleDay(day)}
                />
                <span className="text-sm">{DAY_LABELS[day]}</span>
              </Label>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCopy} disabled={selected.size === 0}>
            Copy to {selected.size} day{selected.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
