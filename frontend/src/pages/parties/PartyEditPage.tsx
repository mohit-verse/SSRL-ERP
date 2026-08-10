import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PartyForm } from './components/PartyForm';
import { useUpdatePartyMutation, usePartyQuery } from '../../features/parties/parties.hooks';
import { toast } from 'sonner';
import { ROUTES } from '../../constants';

export const PartyEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = usePartyQuery(id!);
  const updateMutation = useUpdatePartyMutation();

  const handleSubmit = (formData: any) => {
    updateMutation.mutate({ id: id!, data: formData }, {
      onSuccess: () => {
        toast.success('Party updated successfully');
        navigate(ROUTES.PROTECTED.MASTER_DATA_PARTIES);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update party');
      }
    });
  };

  if (isLoading) {
    return <div>Loading party details...</div>;
  }

  if (!data?.data) {
    return <div>Party not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Party</h1>
        <p className="text-gray-500 dark:text-gray-400">Update details for {data.data.party_name}.</p>
      </div>
      
      <PartyForm initialData={data.data} onSubmit={handleSubmit} isLoading={updateMutation.isPending} />
    </div>
  );
};
