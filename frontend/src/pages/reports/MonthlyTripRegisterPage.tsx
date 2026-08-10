import React, { useState } from 'react';
import { useMonthlyTripRegisterQuery } from '../../features/reports/reports.hooks';
import { DataTable, Column } from '../../components/table/DataTable';
import { TextInput } from '../../components/form/TextInput';
import { ExportButton } from './components/ExportButton';

export const MonthlyTripRegisterPage: React.FC = () => {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());

  const { data, isLoading } = useMonthlyTripRegisterQuery({ 
    year: Number(year), 
    month: Number(month) 
  }, { 
    enabled: year.length === 4 && parseInt(month) >= 1 && parseInt(month) <= 12 
  });

  const columns: Column<any>[] = [
    { key: 'trip_number', header: 'Trip No', cell: (item) => item.trip_number },
    { key: 'loading_date', header: 'Loading Date', cell: (item) => new Date(item.loading_date).toLocaleDateString() },
    { key: 'party_name', header: 'Party', cell: (item) => item.party?.party_name },
    { key: 'vehicle_number', header: 'Vehicle', cell: (item) => item.vehicle_number },
    { key: 'route', header: 'Route', cell: (item) => `${item.from_city} to ${item.to_city}` },
    { key: 'freight', header: 'Freight', cell: (item) => `₹${Number(item.freight_rate).toFixed(2)}` },
    { key: 'status', header: 'Status', cell: (item) => item.status },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Monthly Trip Register</h1>
          <p className="text-gray-500 dark:text-gray-400">Detailed breakdown of all trips executed in a specific month.</p>
        </div>
        <div className="flex gap-2">
          <ExportButton reportType="MONTHLY_TRIPS" format="EXCEL" filters={{ year, month }} />
          <ExportButton reportType="MONTHLY_TRIPS" format="PDF" filters={{ year, month }} />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 flex flex-wrap gap-4 items-end">
        <div className="w-32">
          <TextInput label="Year" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
        <div className="w-32">
          <TextInput label="Month (1-12)" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
      />
    </div>
  );
};
