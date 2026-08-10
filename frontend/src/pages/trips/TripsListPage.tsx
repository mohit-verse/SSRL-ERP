import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTripsQuery, useSoftDeleteTripMutation, useRestoreTripMutation } from '../../features/trips/trips.hooks';
import { DataTable, Column } from '../../components/table/DataTable';
import { Trip } from '../../features/trips/trips.types';
import { useDebounce } from '../../hooks/useDebounce';
import { Button } from '../../components/form/Button';
import { ROUTES } from '../../constants';
import { TripFilters } from './components/TripFilters';
import { TripStatusBadge } from './components/TripStatusBadge';
import { toast } from 'sonner';

export const TripsListPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, refetch } = useTripsQuery({
    page,
    limit: 10,
    q: debouncedSearch,
    status: status || undefined,
    vehicle_type: vehicleType || undefined,
  });

  const deleteMutation = useSoftDeleteTripMutation();
  const restoreMutation = useRestoreTripMutation();

  const handleToggleDelete = (trip: Trip) => {
    if (!trip.deleted_at) {
      if (window.confirm(`Are you sure you want to delete Trip ${trip.trip_number}?`)) {
        deleteMutation.mutate(trip.id, {
          onSuccess: () => toast.success('Trip deleted successfully'),
          onError: () => toast.error('Failed to delete trip')
        });
      }
    } else {
      if (window.confirm(`Are you sure you want to restore Trip ${trip.trip_number}?`)) {
        restoreMutation.mutate(trip.id, {
          onSuccess: () => toast.success('Trip restored successfully'),
          onError: () => toast.error('Failed to restore trip')
        });
      }
    }
  };

  const columns: Column<Trip>[] = [
    { key: 'trip_number', header: 'Trip No', cell: (item) => (
      <Link to={`${ROUTES.PROTECTED.TRIPS}/${item.id}`} className="text-blue-600 hover:underline font-medium">
        {item.trip_number}
      </Link>
    )},
    { key: 'loading_date', header: 'Date', cell: (item) => new Date(item.loading_date).toLocaleDateString() },
    { key: 'party_name', header: 'Party', cell: (item) => item.party?.party_name },
    { key: 'route', header: 'Route', cell: (item) => `${item.from_city} → ${item.to_city}` },
    { key: 'vehicle_number', header: 'Vehicle', cell: (item) => (
      <div>
        <div>{item.vehicle_number}</div>
        <div className="text-[10px] text-gray-500 uppercase">{item.vehicle_type.replace('_', ' ')}</div>
      </div>
    )},
    { key: 'status', header: 'Status', cell: (item) => <TripStatusBadge status={item.status} /> },
    { key: 'actions', header: 'Actions', cell: (item) => (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => handleToggleDelete(item)}
        isLoading={deleteMutation.isPending || restoreMutation.isPending}
      >
        {item.deleted_at ? 'Restore' : 'Delete'}
      </Button>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trips</h1>
        <Link to={`${ROUTES.PROTECTED.TRIPS}/new`}>
          <Button>Create Trip</Button>
        </Link>
      </div>

      <TripFilters 
        search={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        status={status}
        onStatusChange={(val) => { setStatus(val); setPage(1); }}
        vehicleType={vehicleType}
        onVehicleTypeChange={(val) => { setVehicleType(val); setPage(1); }}
      />
      
      <div className="flex justify-end mb-4 -mt-2">
        <Button variant="outline" size="sm" onClick={() => refetch()}>Refresh Data</Button>
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
