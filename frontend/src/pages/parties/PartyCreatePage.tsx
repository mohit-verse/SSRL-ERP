import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PartyForm } from './components/PartyForm';
import { useCreatePartyMutation } from '../../features/parties/parties.hooks';
import { toast } from 'sonner';
import { ROUTES } from '../../constants';

export const PartyCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreatePartyMutation();

  const handleSubmit = (data: any) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Party created successfully');
        navigate(ROUTES.PROTECTED.MASTER_DATA_PARTIES);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create party');
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Party</h1>
        <p className="text-gray-500 dark:text-gray-400">Add a new market or company party.</p>
      </div>
      
      <PartyForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
    </div>
  );
};
