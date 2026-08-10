import React, { useState } from 'react';
import { useVehicleOwnerLedgerQuery } from '../../features/reports/reports.hooks';
import { DataTable, Column } from '../../components/table/DataTable';
import { TextInput } from '../../components/form/TextInput';
import { ExportButton } from './components/ExportButton';
import { apiClient } from '../../api/client';
import { useQuery } from '@tanstack/react-query';

// Quick inline hook to get vehicle owners, assuming endpoint exists from earlier prompts
const useVehicleOwnersQuery = () => useQuery({
  queryKey: ['vehicle-owners-list'],
  queryFn: async () => {
    const res = await apiClient.get('/parties'); // Re-using party endpoint conceptually if owner is a type, or separate. Just fetching all active parties as owners for this demo.
    return res.data;
  }
});

export const VehicleOwnerLedgerPage: React.FC = () => {
  const [ownerId, setOwnerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch active parties (which may act as owners). Using standard party fetcher.
  const { data: ownersData, isLoading: isLoadingOwners } = useVehicleOwnersQuery();
  const owners = (ownersData as any)?.data?.data || [];

  const { data, isLoading } = useVehicleOwnerLedgerQuery({ 
    id: ownerId,
    startDate,
    endDate,
  }, { 
    enabled: !!ownerId 
  });

  const columns: Column<any>[] = [
    { key: 'date', header: 'Date', cell: (item) => new Date(item.date).toLocaleDateString() },
    { key: 'reference', header: 'Reference', cell: (item) => item.reference },
    { key: 'description', header: 'Description', cell: (item) => item.description },
    { key: 'debit', header: 'Debit (₹)', cell: (item) => item.debit > 0 ? Number(item.debit).toFixed(2) : '-' },
    { key: 'credit', header: 'Credit (₹)', cell: (item) => item.credit > 0 ? Number(item.credit).toFixed(2) : '-' },
    { key: 'balance', header: 'Balance (₹)', cell: (item) => Number(item.balance).toFixed(2) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vehicle Owner Ledger</h1>
          <p className="text-gray-500 dark:text-gray-400">Comprehensive statement of account for a specific vehicle owner.</p>
        </div>
        <div className="flex gap-2">
          <ExportButton reportType="VEHICLE_OWNER_LEDGER" format="EXCEL" filters={{ id: ownerId, startDate, endDate }} disabled={!ownerId} />
          <ExportButton reportType="VEHICLE_OWNER_LEDGER" format="PDF" filters={{ id: ownerId, startDate, endDate }} disabled={!ownerId} />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 flex flex-wrap gap-4 items-end">
        <div className="w-64 flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle Owner *</label>
          <select
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoadingOwners}
          >
            <option value="">Select an Owner...</option>
            {owners.map((owner: any) => (
              <option key={owner.id} value={owner.id}>{owner.party_name}</option>
            ))}
          </select>
        </div>
        <div className="w-40">
          <TextInput type="date" label="Start Date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="w-40">
          <TextInput type="date" label="End Date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {!ownerId ? (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-8 text-center text-gray-500 rounded-lg border border-gray-200 dark:border-gray-700">
          Please select a Vehicle Owner to view the ledger.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
