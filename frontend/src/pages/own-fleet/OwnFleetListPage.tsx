import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOwnFleetQuery } from '../../features/own-fleet/own-fleet.hooks';
import { DataTable, Column } from '../../components/table/DataTable';
import { OwnVehicle } from '../../features/own-fleet/own-fleet.api';
import { useDebounce } from '../../hooks/useDebounce';
import { TextInput } from '../../components/form/TextInput';
import { Button } from '../../components/form/Button';
import { ROUTES } from '../../constants';

export const OwnFleetListPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, refetch } = useOwnFleetQuery({
    page,
    limit: 10,
    q: debouncedSearch,
    status: status || undefined
  });

  const columns: Column<OwnVehicle>[] = [
    { key: 'vehicle_number', header: 'Vehicle Number', cell: (item) => (
      <Link to={`${ROUTES.PROTECTED.MASTER_DATA_OWN_FLEET}/${item.id}`} className="text-blue-600 hover:underline font-medium">
        {item.vehicle_number}
      </Link>
    )},
    { key: 'vehicle_type', header: 'Type', cell: (item) => item.vehicle_type || '-' },
    { key: 'brand', header: 'Brand', cell: (item) => item.brand || '-' },
    { key: 'status', header: 'Status', cell: (item) => {
      let colorClass = 'bg-gray-100 text-gray-800';
      if (item.status === 'ACTIVE') colorClass = 'bg-green-100 text-green-800';
      if (item.status === 'INACTIVE') colorClass = 'bg-red-100 text-red-800';
      if (item.status === 'SOLD') colorClass = 'bg-yellow-100 text-yellow-800';
      
      return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
          {item.status}
        </span>
      );
    }},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Own Fleet</h1>
        <Link to={`${ROUTES.PROTECTED.MASTER_DATA_OWN_FLEET}/new`}>
          <Button>Add Vehicle</Button>
        </Link>
      </div>

      <div className="flex gap-4 mb-4 items-end">
        <div className="w-64">
          <TextInput
            placeholder="Search vehicles..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-48 flex flex-col gap-1">
          <select 
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SOLD">Sold</option>
          </select>
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
