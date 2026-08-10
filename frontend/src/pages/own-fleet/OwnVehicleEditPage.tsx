import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { OwnVehicleForm } from './components/OwnVehicleForm';
import { useUpdateOwnVehicleMutation, useOwnVehicleQuery } from '../../features/own-fleet/own-fleet.hooks';
import { toast } from 'sonner';
import { ROUTES } from '../../constants';

export const OwnVehicleEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useOwnVehicleQuery(id!);
  const updateMutation = useUpdateOwnVehicleMutation();

  const handleSubmit = (formData: any) => {
    updateMutation.mutate({ id: id!, data: formData }, {
      onSuccess: () => {
        toast.success('Vehicle updated successfully');
        navigate(ROUTES.PROTECTED.MASTER_DATA_OWN_FLEET);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update vehicle');
      }
    });
  };

  if (isLoading) {
    return <div>Loading vehicle details...</div>;
  }

  if (!data?.data) {
    return <div>Vehicle not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Vehicle</h1>
        <p className="text-gray-500 dark:text-gray-400">Update details for {data.data.vehicle_number}.</p>
      </div>
      
      <OwnVehicleForm initialData={data.data} onSubmit={handleSubmit} isLoading={updateMutation.isPending} />
    </div>
  );
};
