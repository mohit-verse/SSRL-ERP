import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useVehicleQuery, useVehicleHistoryQuery, useUpdateVehicleOwnerMutation } from '../../features/vehicle-directory/vehicle-directory.hooks';
import { Button } from '../../components/form/Button';
import { Dialog } from '../../components/ui/Dialog';
import { OwnerForm } from './components/OwnerForm';
import { toast } from 'sonner';

export const VehicleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isEditOwnerOpen, setIsEditOwnerOpen] = useState(false);
  
  const { data: vehicleResponse, isLoading } = useVehicleQuery(id!);
  const { data: historyResponse, isLoading: isHistoryLoading, isError: isHistoryError } = useVehicleHistoryQuery(id!);
  const updateOwnerMutation = useUpdateVehicleOwnerMutation();

  if (isLoading) return <div>Loading...</div>;
  if (!vehicleResponse?.data) return <div>Vehicle not found</div>;

  const vehicle = vehicleResponse.data;

  const handleUpdateOwner = (data: any) => {
    updateOwnerMutation.mutate({ id: id!, data }, {
      onSuccess: () => {
        toast.success('Owner updated successfully');
        setIsEditOwnerOpen(false);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update owner');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Vehicle: {vehicle.vehicle_number}
        </h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${vehicle.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {vehicle.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Owner Information Card */}
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Owner Information</h2>
            <Button variant="outline" size="sm" onClick={() => setIsEditOwnerOpen(true)}>Edit Owner</Button>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Owner Name</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{vehicle.owner_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Owner Mobile</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{vehicle.owner_mobile}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Added to Directory</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(vehicle.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Operational History Card */}
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Operational History</h2>
          
          {isHistoryLoading ? (
            <p className="text-gray-500">Loading history...</p>
          ) : isHistoryError || !historyResponse?.data ? (
            <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-md">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Detailed history API is either deferred or unavailable at this time.
              </p>
              <p className="text-xs text-gray-400 mt-1">(Trips integration pending backend rollout)</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {historyResponse.data.length === 0 ? (
                <p className="text-gray-500 text-sm">No historical trips found.</p>
              ) : (
                historyResponse.data.map((item: any, i: number) => (
                  <li key={i} className="text-sm border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0">
                    <span className="font-medium">{item.trip_number}</span> - {new Date(item.date).toLocaleDateString()}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>

      <Dialog 
        isOpen={isEditOwnerOpen} 
        onClose={() => setIsEditOwnerOpen(false)}
        title="Update Owner Information"
      >
        <OwnerForm 
          initialData={vehicle} 
          onSubmit={handleUpdateOwner}
          onCancel={() => setIsEditOwnerOpen(false)}
          isLoading={updateOwnerMutation.isPending}
        />
      </Dialog>
    </div>
  );
};
