import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextInput } from '../../../components/form/TextInput';
import { Button } from '../../../components/form/Button';
import { Party } from '../../../features/parties/parties.api';

const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const partySchema = z.object({
  party_name: z.string().min(1, 'Name is required').max(200),
  party_type: z.enum(['MARKET', 'COMPANY']),
  gst_number: z.string().regex(gstRegex, 'Invalid GST Number').optional().or(z.literal('')),
  contact_person: z.string().max(120).optional().or(z.literal('')),
  mobile: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().max(120).optional().or(z.literal('')),
  state: z.string().max(120).optional().or(z.literal('')),
  billing_type: z.enum(['INDIVIDUAL', 'CONSOLIDATED']).optional().nullable(),
  payment_type: z.enum(['STANDARD', 'BULK']).optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.party_type === 'COMPANY') {
    if (!data.billing_type) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Required for Company', path: ['billing_type'] });
    }
    if (!data.payment_type) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Required for Company', path: ['payment_type'] });
    }
  }
});

type PartyFormValues = z.infer<typeof partySchema>;

interface PartyFormProps {
  initialData?: Party;
  onSubmit: (data: Partial<Party>) => void;
  isLoading?: boolean;
}

export const PartyForm: React.FC<PartyFormProps> = ({ initialData, onSubmit, isLoading }) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PartyFormValues>({
    resolver: zodResolver(partySchema),
    defaultValues: {
      party_name: initialData?.party_name || '',
      party_type: initialData?.party_type || 'MARKET',
      gst_number: initialData?.gst_number || '',
      contact_person: initialData?.contact_person || '',
      mobile: initialData?.mobile || '',
      email: initialData?.email || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      billing_type: initialData?.billing_type || null,
      payment_type: initialData?.payment_type || null,
    }
  });

  const partyType = watch('party_type');

  useEffect(() => {
    if (partyType === 'MARKET') {
      setValue('billing_type', null);
      setValue('payment_type', null);
    }
  }, [partyType, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput label="Party Name *" {...register('party_name')} error={errors.party_name?.message} />
        
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Party Type *</label>
          <select 
            {...register('party_type')}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="MARKET">MARKET</option>
            <option value="COMPANY">COMPANY</option>
          </select>
          {errors.party_type && <p className="text-xs text-red-500">{errors.party_type.message}</p>}
        </div>

        <TextInput label="GST Number" {...register('gst_number')} error={errors.gst_number?.message} />
        <TextInput label="Contact Person" {...register('contact_person')} error={errors.contact_person?.message} />
        <TextInput label="Mobile" {...register('mobile')} error={errors.mobile?.message} />
        <TextInput label="Email" type="email" {...register('email')} error={errors.email?.message} />
        
        <div className="md:col-span-2">
          <TextInput label="Address" {...register('address')} error={errors.address?.message} />
        </div>
        
        <TextInput label="City" {...register('city')} error={errors.city?.message} />
        <TextInput label="State" {...register('state')} error={errors.state?.message} />

        {partyType === 'COMPANY' && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Billing Type *</label>
              <select 
                {...register('billing_type')}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="INDIVIDUAL">INDIVIDUAL</option>
                <option value="CONSOLIDATED">CONSOLIDATED</option>
              </select>
              {errors.billing_type && <p className="text-xs text-red-500">{errors.billing_type.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Type *</label>
              <select 
                {...register('payment_type')}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="STANDARD">STANDARD</option>
                <option value="BULK">BULK</option>
              </select>
              {errors.payment_type && <p className="text-xs text-red-500">{errors.payment_type.message}</p>}
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
        <Button type="submit" isLoading={isLoading}>Save Party</Button>
      </div>
    </form>
  );
};
