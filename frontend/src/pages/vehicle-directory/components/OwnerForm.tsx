import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextInput } from '../../../components/form/TextInput';
import { Button } from '../../../components/form/Button';
import { VehicleDirectory } from '../../../features/vehicle-directory/vehicle-directory.api';

const ownerSchema = z.object({
  owner_name: z.string().min(1, 'Name is required').max(150),
  owner_mobile: z.string().min(1, 'Mobile is required').max(20),
});

type OwnerFormValues = z.infer<typeof ownerSchema>;

interface OwnerFormProps {
  initialData: VehicleDirectory;
  onSubmit: (data: OwnerFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const OwnerForm: React.FC<OwnerFormProps> = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<OwnerFormValues>({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      owner_name: initialData.owner_name,
      owner_mobile: initialData.owner_mobile,
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <TextInput label="Owner Name" {...register('owner_name')} error={errors.owner_name?.message} />
      <TextInput label="Owner Mobile" {...register('owner_mobile')} error={errors.owner_mobile?.message} />
      
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" isLoading={isLoading}>Save Changes</Button>
      </div>
    </form>
  );
};
