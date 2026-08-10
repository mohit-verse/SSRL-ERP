import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useVehicleDirectoryQuery } from '../../features/vehicle-directory/vehicle-directory.hooks';
import { DataTable, Column } from '../../components/table/DataTable';
import { VehicleDirectory } from '../../features/vehicle-directory/vehicle-directory.api';
import { useDebounce } from '../../hooks/useDebounce';
import { TextInput } from '../../components/form/TextInput';
import { Button } from '../../components/form/Button';
import { ROUTES } from '../../constants';

export const VehicleDirectoryListPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, refetch } = useVehicleDirectoryQuery({
    page,
    limit: 10,
    q: debouncedSearch,
  });

  const columns: Column<VehicleDirectory>[] = [
    { key: 'vehicle_number', header: 'Vehicle Number', cell: (item) => (
      <Link to={`${ROUTES.PROTECTED.MASTER_DATA_VEHICLE_DIRECTORY}/${item.id}`} className="text-blue-600 hover:underline font-medium">
        {item.vehicle_number}
      </Link>
    )},
    { key: 'owner_name', header: 'Owner Name' },
    { key: 'owner_mobile', header: 'Owner Mobile' },
    { key: 'is_active', header: 'Status', cell: (item) => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {item.is_active ? 'Active' : 'Inactive'}
      </span>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vehicle Directory</h1>
        {/* DO NOT ADD CREATE VEHICLE BUTTON AS PER PROMPT INSTRUCTIONS */}
      </div>

      <div className="flex gap-4 mb-4">
        <div className="w-64">
          <TextInput
            placeholder="Search vehicles or owners..."
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
