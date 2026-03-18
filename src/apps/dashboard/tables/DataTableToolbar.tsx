import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/core/components/ui/input';
import { Select } from '@/core/components/ui/select';

interface FilterConfig {
  label: string;
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
}

interface DataTableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  actions?: React.ReactNode;
}

export function DataTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  actions,
}: DataTableToolbarProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);

  // Sync external value
  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchValue) {
        onSearchChange(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, searchValue, onSearchChange]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {filters?.map(filter => (
          <Select
            key={filter.label}
            options={[{ label: `All ${filter.label}`, value: '' }, ...filter.options]}
            value={filter.value}
            onChange={e => filter.onChange(e.target.value)}
            className="w-auto min-w-[120px]"
          />
        ))}
      </div>
      {actions && <div className="flex-shrink-0">{actions}</div>}
    </div>
  );
}
