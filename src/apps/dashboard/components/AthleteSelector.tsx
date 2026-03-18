import { useState, useRef, useEffect } from 'react';
import { X, Search, ChevronDown } from 'lucide-react';
import { useAthleteContext } from '../contexts/AthleteContext';
import { useAthletes } from '../hooks/useAthletes';
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';

export function AthleteSelector() {
  const { activeAthleteId, setActiveAthleteId, canManageAthletes, activeAthlete } = useAthleteContext();
  const { data: athletes } = useAthletes();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!canManageAthletes) return null;

  const filtered = (athletes ?? []).filter(a => {
    const term = search.toLowerCase();
    return (
      (a.username?.toLowerCase().includes(term) ?? false) ||
      a.email.toLowerCase().includes(term)
    );
  });

  const displayName = activeAthlete
    ? activeAthlete.username || 'Selected Athlete'
    : null;

  return (
    <div ref={containerRef} className="relative px-3 py-2">
      {activeAthleteId && displayName ? (
        <div className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5 text-sm">
          <span className="truncate flex-1 font-medium">{displayName}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setActiveAthleteId(null)}
            className="shrink-0"
          >
            <X size={14} />
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center gap-2 rounded-md border border-border px-2 py-1.5 text-sm text-muted-foreground hover:border-primary/50 transition-colors"
        >
          <Search size={14} />
          <span className="flex-1 text-left">Select athlete...</span>
          <ChevronDown size={14} />
        </button>
      )}

      {open && (
        <div className="absolute left-3 right-3 top-full z-50 mt-1 rounded-md border border-border bg-popover shadow-md">
          <div className="p-2">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search athletes..."
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No athletes found</p>
            ) : (
              filtered.map(a => (
                <button
                  key={a.id}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                  onClick={() => {
                    setActiveAthleteId(a.id);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary shrink-0">
                    {(a.username?.[0] || a.email[0]).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.username || a.email}</p>
                    {a.username && (
                      <p className="truncate text-xs text-muted-foreground">{a.email}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
