import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OwnVehicleForm } from './components/OwnVehicleForm';
import { useCreateOwnVehicleMutation } from '../../features/own-fleet/own-fleet.hooks';
import { toast } from 'sonner';
import { ROUTES } from '../../constants';

export const OwnVehicleCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreateOwnVehicleMutation();

  const handleSubmit = (data: any) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Vehicle added successfully');
        navigate(ROUTES.PROTECTED.MASTER_DATA_OWN_FLEET);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to add vehicle');
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Own Vehicle</h1>
        <p className="text-gray-500 dark:text-gray-400">Add a new vehicle to the internal fleet.</p>
      </div>
      
      <OwnVehicleForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
    </div>
  );
};
