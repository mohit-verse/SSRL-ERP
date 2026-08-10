import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TripForm } from './components/TripForm';
import { useUpdateTripMutation, useTripQuery } from '../../features/trips/trips.hooks';
import { toast } from 'sonner';
import { ROUTES } from '../../constants';

export const TripEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useTripQuery(id!);
  const updateMutation = useUpdateTripMutation();

  const handleSubmit = (formData: any) => {
    updateMutation.mutate({ id: id!, data: formData }, {
      onSuccess: () => {
        toast.success('Trip updated successfully');
        navigate(`${ROUTES.PROTECTED.TRIPS}/${id}`);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update trip');
      }
    });
  };

  if (isLoading) return <div>Loading trip details...</div>;
  if (!data?.data) return <div>Trip not found.</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Trip {data.data.trip_number}</h1>
        <p className="text-gray-500 dark:text-gray-400">Update operational timeline and financial details.</p>
      </div>
      
      <TripForm initialData={data.data} onSubmit={handleSubmit} isLoading={updateMutation.isPending} />
    </div>
  );
};
