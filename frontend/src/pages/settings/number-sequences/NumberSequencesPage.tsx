import React from 'react';
import { useCurrentSequencesQuery } from '../../../features/number-sequences/number-sequences.hooks';
import { DataTable, Column } from '../../../components/table/DataTable';
import { NumberSequence } from '../../../features/number-sequences/number-sequences.types';

export const NumberSequencesPage: React.FC = () => {
  const { data, isLoading } = useCurrentSequencesQuery();

  const columns: Column<NumberSequence>[] = [
    { key: 'sequence_key', header: 'Entity / Sequence Key', cell: (item) => <span className="font-medium text-gray-900 dark:text-gray-100">{item.sequence_key.replace(/_/g, ' ')}</span> },
    { key: 'financial_year', header: 'Financial Year', cell: (item) => item.financial_year?.display_name || 'Global' },
    { key: 'prefix', header: 'Prefix', cell: (item) => item.prefix || '-' },
    { key: 'current_number', header: 'Current Value', cell: (item) => (
      <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-blue-600 dark:text-blue-400 font-bold">
        {item.current_number}
      </span>
    )},
    { key: 'padding', header: 'Padding', cell: (item) => item.padding },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Number Sequences</h1>
          <p className="text-gray-500 dark:text-gray-400">Read-only view of system generated sequence states for the active financial year.</p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-4 rounded-lg text-sm border border-blue-200 dark:border-blue-800/50 mb-4">
        <strong>Important:</strong> Sequence numbers are strictly managed by the backend engine to ensure contiguous numbering, gapless generation, and concurrency safety. Manual incrementing or decrementing is disabled.
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
      />
    </div>
  );
};
