import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TripForm } from './components/TripForm';
import { useCreateTripMutation } from '../../features/trips/trips.hooks';
import { toast } from 'sonner';
import { ROUTES } from '../../constants';

export const TripCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreateTripMutation();

  const handleSubmit = (data: any) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Trip created successfully');
        navigate(ROUTES.PROTECTED.TRIPS);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create trip');
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Trip</h1>
        <p className="text-gray-500 dark:text-gray-400">Initialize a new operational trip.</p>
      </div>
      
      <TripForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
    </div>
  );
};
