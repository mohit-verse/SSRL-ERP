import React from 'react';
import { useFinancialYearsQuery, useActivateFinancialYearMutation, useCreateFinancialYearMutation } from '../../../features/financial-years/financial-years.hooks';
import { DataTable, Column } from '../../../components/table/DataTable';
import { Button } from '../../../components/form/Button';
import { FinancialYear } from '../../../features/financial-years/financial-years.types';
import { toast } from 'sonner';

export const FinancialYearsPage: React.FC = () => {
  const { data, isLoading } = useFinancialYearsQuery();
  const activateMutation = useActivateFinancialYearMutation();
  const createMutation = useCreateFinancialYearMutation();

  const handleActivate = async (id: string) => {
    try {
      await activateMutation.mutateAsync(id);
      toast.success('Financial year activated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to activate financial year');
    }
  };

  const handleCreateNext = async () => {
    const currentYears = data?.data || [];
    if (currentYears.length === 0) {
       toast.error("No base year to infer from, use API to bootstrap.");
       return;
    }
    
    // Sort to find the latest
    const latest = [...currentYears].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0];
    
    const start = new Date(latest.start_date);
    const end = new Date(latest.end_date);
    
    start.setFullYear(start.getFullYear() + 1);
    end.setFullYear(end.getFullYear() + 1);

    const displayName = `${start.getFullYear()}-${(start.getFullYear() + 1).toString().slice(2)}`;
    
    try {
      await createMutation.mutateAsync({
        display_name: displayName,
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
      });
      toast.success(`Created ${displayName}`);
    } catch(error: any) {
      toast.error(error.message || 'Failed to create next year');
    }
  };

  const columns: Column<FinancialYear>[] = [
    { key: 'display_name', header: 'Financial Year', cell: (item) => <span className="font-medium">{item.display_name}</span> },
    { key: 'start_date', header: 'Start Date', cell: (item) => new Date(item.start_date).toLocaleDateString() },
    { key: 'end_date', header: 'End Date', cell: (item) => new Date(item.end_date).toLocaleDateString() },
    { key: 'status', header: 'Status', cell: (item) => (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
        item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {item.is_active ? 'Active (Current)' : 'Inactive'}
      </span>
    )},
    { key: 'actions', header: 'Actions', cell: (item) => (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => handleActivate(item.id)}
        disabled={item.is_active || activateMutation.isPending}
      >
        {item.is_active ? 'Active' : 'Activate'}
      </Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Years</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage financial periods and activate new years.</p>
        </div>
        <Button onClick={handleCreateNext} isLoading={createMutation.isPending}>Auto-Create Next Year</Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
      />
    </div>
  );
};
