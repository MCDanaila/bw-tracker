import { useState } from 'react';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAthletes, type AthleteWithStats } from '../hooks/useAthletes';
import { athletesColumns } from '../tables/athletes-columns';
import { DataTable } from '../tables/DataTable';
import { DataTableToolbar } from '../tables/DataTableToolbar';
import { EmptyState } from '../components/EmptyState';

export default function AthletesPage() {
  const { data: athletes, isLoading } = useAthletes();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = (athletes ?? []).filter(a => {
    const matchesSearch = !search ||
      (a.username?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      a.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || a.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleRowClick = (athlete: AthleteWithStats) => {
    navigate(`/dashboard/athletes/${athlete.id}`);
  };

  if (!isLoading && (!athletes || athletes.length === 0)) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Athletes</h1>
        <EmptyState
          icon={<Users size={40} />}
          title="No athletes assigned yet"
          description="Share your coach link to get started. Athletes will appear here once they connect with you."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Athletes</h1>

      <DataTableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search athletes..."
        filters={[
          {
            label: 'Status',
            options: [
              { label: 'All', value: '' },
              { label: 'Active', value: 'active' },
              { label: 'Paused', value: 'paused' },
              { label: 'Terminated', value: 'terminated' },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
        ]}
      />

      <DataTable
        columns={athletesColumns}
        data={filtered}
        isLoading={isLoading}
        emptyMessage="No athletes match your filters"
        onRowClick={handleRowClick}
      />
    </div>
  );
}
