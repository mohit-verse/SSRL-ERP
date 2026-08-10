import React, { useState } from 'react';
import { usePartiesQuery, useActivatePartyMutation, useDeactivatePartyMutation } from '../../features/parties/parties.hooks';
import { DataTable, Column } from '../../components/table/DataTable';
import { Party } from '../../features/parties/parties.api';
import { useDebounce } from '../../hooks/useDebounce';
import { TextInput } from '../../components/form/TextInput';
import { Button } from '../../components/form/Button';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export const PartiesListPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, refetch } = usePartiesQuery({
    page,
    limit: 10,
    q: debouncedSearch,
  });

  const activateMutation = useActivatePartyMutation();
  const deactivateMutation = useDeactivatePartyMutation();

  const handleToggleStatus = (party: Party) => {
    if (party.is_active) {
      if (window.confirm(`Are you sure you want to deactivate ${party.party_name}?`)) {
        deactivateMutation.mutate(party.id, {
          onSuccess: () => toast.success('Party deactivated successfully'),
          onError: () => toast.error('Failed to deactivate party')
        });
      }
    } else {
      if (window.confirm(`Are you sure you want to activate ${party.party_name}?`)) {
        activateMutation.mutate(party.id, {
          onSuccess: () => toast.success('Party activated successfully'),
          onError: () => toast.error('Failed to activate party')
        });
      }
    }
  };

  const columns: Column<Party>[] = [
    { key: 'party_name', header: 'Party Name', cell: (item) => <Link to={`/master-data/parties/${item.id}`} className="text-blue-600 hover:underline">{item.party_name}</Link> },
    { key: 'party_type', header: 'Type' },
    { key: 'mobile', header: 'Mobile', cell: (item) => item.mobile || '-' },
    { key: 'city', header: 'City', cell: (item) => item.city || '-' },
    { key: 'is_active', header: 'Status', cell: (item) => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {item.is_active ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'actions', header: 'Actions', cell: (item) => (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => handleToggleStatus(item)}
        isLoading={activateMutation.isPending || deactivateMutation.isPending}
      >
        {item.is_active ? 'Deactivate' : 'Activate'}
      </Button>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Parties</h1>
        <Link to="/master-data/parties/new">
          <Button>Create Party</Button>
        </Link>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="w-64">
          <TextInput
            placeholder="Search parties..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Button variant="outline" onClick={() => refetch()}>Refresh</Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data?.data || []}
        isLoading={isLoading}
        page={data?.data?.meta?.page || 1}
        totalPages={data?.data?.meta?.totalPages || 1}
        onNextPage={() => setPage((p) => p + 1)}
        onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
      />
    </div>
  );
};
