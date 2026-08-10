import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tripSchema, TripFormValues } from '../../../features/trips/trips.validation';
import { TextInput } from '../../../components/form/TextInput';
import { Button } from '../../../components/form/Button';
import { usePartiesQuery } from '../../../features/parties/parties.hooks';

interface TripFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export const TripForm: React.FC<TripFormProps> = ({ initialData, onSubmit, isLoading }) => {
  const { data: partiesResponse, isLoading: isPartiesLoading } = usePartiesQuery({ limit: 100, is_active: true });
  const parties = partiesResponse?.data?.data || [];

  const { register, handleSubmit, formState: { errors } } = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema) as any,
    defaultValues: {
      loading_date: initialData?.loading_date ? initialData.loading_date.split('T')[0] : '',
      unloading_date: initialData?.unloading_date ? initialData.unloading_date.split('T')[0] : '',
      party_id: initialData?.party_id || '',
      from_city: initialData?.from_city || '',
      to_city: initialData?.to_city || '',
      vehicle_number: initialData?.vehicle_number || '',
      driver_mobile: initialData?.driver_mobile || '',
      vehicle_owner_name: initialData?.vehicle_owner_name || '',
      vehicle_owner_mobile: initialData?.vehicle_owner_mobile || '',
      weight: initialData?.weight || null,
      freight_rate: initialData?.freight_rate || 0,
      vehicle_rate: initialData?.vehicle_rate || null,
      lr_number: initialData?.lr_number || '',
      customer_advance: initialData?.customer_advance || 0,
      owner_advance: initialData?.owner_advance || null,
      detention: initialData?.detention || null,
      deduction: initialData?.deduction || null,
      remarks: initialData?.remarks || '',
    }
  });

  const submitHandler = (data: TripFormValues) => {
    // Clean up empty strings to null for backend
    const payload = {
      ...data,
      unloading_date: data.unloading_date || null,
      vehicle_owner_name: data.vehicle_owner_name || null,
      vehicle_owner_mobile: data.vehicle_owner_mobile || null,
      weight: data.weight ? Number(data.weight) : null,
      freight_rate: Number(data.freight_rate),
      vehicle_rate: data.vehicle_rate ? Number(data.vehicle_rate) : null,
      lr_number: data.lr_number || null,
      customer_advance: Number(data.customer_advance),
      owner_advance: data.owner_advance ? Number(data.owner_advance) : null,
      detention: data.detention ? Number(data.detention) : null,
      deduction: data.deduction ? Number(data.deduction) : null,
      remarks: data.remarks || null,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(submitHandler as any)} className="space-y-8">
      
      {/* Route & Vehicle */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800 space-y-4">
        <h2 className="text-lg font-semibold border-b border-gray-100 dark:border-gray-800 pb-2">Route & Vehicle</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Party *</label>
            <select 
              {...register('party_id')}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isPartiesLoading || !!initialData}
            >
              <option value="">Select a Party...</option>
              {parties.map(party => (
                <option key={party.id} value={party.id}>{party.party_name} ({party.party_type})</option>
              ))}
            </select>
            {errors.party_id && <p className="text-xs text-red-500">{errors.party_id.message}</p>}
          </div>

          <TextInput label="From City *" {...register('from_city')} error={errors.from_city?.message} />
          <TextInput label="To City *" {...register('to_city')} error={errors.to_city?.message} />
          
          <TextInput label="Vehicle Number *" {...register('vehicle_number')} error={errors.vehicle_number?.message} />
          <TextInput label="Driver Mobile *" {...register('driver_mobile')} error={errors.driver_mobile?.message} />
          <TextInput label="Weight" type="number" step="0.01" {...register('weight')} error={errors.weight?.message as string} />
        </div>
      </div>

      {/* External Vehicle Info */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800 space-y-4">
        <h2 className="text-lg font-semibold border-b border-gray-100 dark:border-gray-800 pb-2 text-gray-700">External Vehicle Details (If Applicable)</h2>
        <p className="text-xs text-gray-500 mb-2">The backend will automatically classify the vehicle type based on the Vehicle Directory and Own Fleet registries.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput label="Owner Name" {...register('vehicle_owner_name')} error={errors.vehicle_owner_name?.message} />
          <TextInput label="Owner Mobile" {...register('vehicle_owner_mobile')} error={errors.vehicle_owner_mobile?.message} />
        </div>
      </div>

      {/* Financials */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800 space-y-4">
        <h2 className="text-lg font-semibold border-b border-gray-100 dark:border-gray-800 pb-2">Financials</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TextInput label="Freight Rate *" type="number" step="0.01" {...register('freight_rate')} error={errors.freight_rate?.message as string} />
          <TextInput label="Customer Advance *" type="number" step="0.01" {...register('customer_advance')} error={errors.customer_advance?.message as string} />
          <div className="md:col-span-1"></div>
          
          <TextInput label="Vehicle Rate" type="number" step="0.01" {...register('vehicle_rate')} error={errors.vehicle_rate?.message as string} />
          <TextInput label="Owner Advance" type="number" step="0.01" {...register('owner_advance')} error={errors.owner_advance?.message as string} />
          <div className="md:col-span-1"></div>

          {initialData && (
            <>
              <TextInput label="Detention" type="number" step="0.01" {...register('detention')} error={errors.detention?.message as string} />
              <TextInput label="Deduction" type="number" step="0.01" {...register('deduction')} error={errors.deduction?.message as string} />
            </>
          )}
        </div>
      </div>

      {/* Timeline & Metadata */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800 space-y-4">
        <h2 className="text-lg font-semibold border-b border-gray-100 dark:border-gray-800 pb-2">Timeline & Metadata</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput label="Loading Date *" type="date" {...register('loading_date')} error={errors.loading_date?.message} />
          {initialData && (
            <TextInput label="Unloading Date" type="date" {...register('unloading_date')} error={errors.unloading_date?.message} />
          )}
          <TextInput label="LR Number" {...register('lr_number')} error={errors.lr_number?.message} />
          <div className="md:col-span-2">
            <TextInput label="Remarks" {...register('remarks')} error={errors.remarks?.message} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
        <Button type="submit" isLoading={isLoading}>{initialData ? 'Update Trip' : 'Create Trip'}</Button>
      </div>
    </form>
  );
};
