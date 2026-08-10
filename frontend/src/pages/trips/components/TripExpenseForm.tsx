import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tripExpenseSchema, TripExpenseFormValues } from '../../../features/trips/trips.validation';
import { TextInput } from '../../../components/form/TextInput';
import { Button } from '../../../components/form/Button';

interface TripExpenseFormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  onCancel: () => void;
}

export const TripExpenseForm: React.FC<TripExpenseFormProps> = ({ onSubmit, isLoading, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<TripExpenseFormValues>({
    resolver: zodResolver(tripExpenseSchema) as any,
    defaultValues: {
      expense_type: 'FUEL',
      amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      remarks: '',
    }
  });

  const submitHandler = (data: TripExpenseFormValues) => {
    onSubmit({
      ...data,
      amount: Number(data.amount),
      remarks: data.remarks || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(submitHandler as any)} className="space-y-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Expense Type *</label>
        <select 
          {...register('expense_type')}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="FUEL">Fuel</option>
          <option value="DRIVER_BATTA">Driver Batta</option>
          <option value="FASTAG">FasTag</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="OTHER">Other</option>
        </select>
        {errors.expense_type && <p className="text-xs text-red-500">{errors.expense_type.message}</p>}
      </div>

      <TextInput label="Amount *" type="number" step="0.01" {...register('amount')} error={errors.amount?.message as string} />
      <TextInput label="Expense Date *" type="date" {...register('expense_date')} error={errors.expense_date?.message} />
      <TextInput label="Remarks" {...register('remarks')} error={errors.remarks?.message} />

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" isLoading={isLoading}>Add Expense</Button>
      </div>
    </form>
  );
};
