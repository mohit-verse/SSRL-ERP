import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextInput } from '../../../components/form/TextInput';
import { Button } from '../../../components/form/Button';
import { OwnVehicle } from '../../../features/own-fleet/own-fleet.api';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const ownVehicleSchema = z.object({
  vehicle_number: z.string().min(1, 'Vehicle number is required').max(30),
  vehicle_type: z.string().max(80).optional().or(z.literal('')),
  brand: z.string().max(80).optional().or(z.literal('')),
  model: z.string().max(80).optional().or(z.literal('')),
  manufacturing_year: z.coerce.number().optional().nullable(),
  chassis_number: z.string().max(100).optional().or(z.literal('')),
  engine_number: z.string().max(100).optional().or(z.literal('')),
  registration_date: z.string().regex(dateRegex, 'Invalid date format').optional().or(z.literal('')),
  purchase_date: z.string().regex(dateRegex, 'Invalid date format').optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SOLD']),
});

type OwnVehicleFormValues = z.infer<typeof ownVehicleSchema>;

interface OwnVehicleFormProps {
  initialData?: OwnVehicle;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export const OwnVehicleForm: React.FC<OwnVehicleFormProps> = ({ initialData, onSubmit, isLoading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<OwnVehicleFormValues>({
    resolver: zodResolver(ownVehicleSchema) as any,
    defaultValues: {
      vehicle_number: initialData?.vehicle_number || '',
      vehicle_type: initialData?.vehicle_type || '',
      brand: initialData?.brand || '',
      model: initialData?.model || '',
      manufacturing_year: initialData?.manufacturing_year || null,
      chassis_number: initialData?.chassis_number || '',
      engine_number: initialData?.engine_number || '',
      registration_date: initialData?.registration_date ? initialData.registration_date.split('T')[0] : '',
      purchase_date: initialData?.purchase_date ? initialData.purchase_date.split('T')[0] : '',
      status: initialData?.status || 'ACTIVE',
    }
  });

  const submitHandler = (data: OwnVehicleFormValues) => {
    // Transform empty strings to null for optional backend fields if needed, or pass as is.
    // The Zod schema transform handles manufacturing_year.
    const payload = {
      ...data,
      registration_date: data.registration_date || null,
      purchase_date: data.purchase_date || null,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(submitHandler as any)} className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput label="Vehicle Number *" {...register('vehicle_number')} error={errors.vehicle_number?.message} />
        
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status *</label>
          <select 
            {...register('status')}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="SOLD">SOLD</option>
          </select>
          {errors.status && <p className="text-xs text-red-500">{errors.status.message}</p>}
        </div>

        <TextInput label="Vehicle Type" {...register('vehicle_type')} error={errors.vehicle_type?.message} />
        <TextInput label="Brand" {...register('brand')} error={errors.brand?.message} />
        <TextInput label="Model" {...register('model')} error={errors.model?.message} />
        <TextInput label="Manufacturing Year" type="number" {...register('manufacturing_year')} error={errors.manufacturing_year?.message} />
        <TextInput label="Chassis Number" {...register('chassis_number')} error={errors.chassis_number?.message} />
        <TextInput label="Engine Number" {...register('engine_number')} error={errors.engine_number?.message} />
        <TextInput label="Registration Date" type="date" {...register('registration_date')} error={errors.registration_date?.message} />
        <TextInput label="Purchase Date" type="date" {...register('purchase_date')} error={errors.purchase_date?.message} />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
        <Button type="submit" isLoading={isLoading}>Save Vehicle</Button>
      </div>
    </form>
  );
};
