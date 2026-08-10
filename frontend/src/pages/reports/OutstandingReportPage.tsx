import React from 'react';
import { useOutstandingReportQuery } from '../../features/reports/reports.hooks';
import { DataTable, Column } from '../../components/table/DataTable';
import { ExportButton } from './components/ExportButton';

export const OutstandingReportPage: React.FC = () => {
  const { data, isLoading } = useOutstandingReportQuery();

  const columns: Column<any>[] = [
    { key: 'party_name', header: 'Party Name', cell: (item) => item.party_name },
    { key: 'contact_person', header: 'Contact Person', cell: (item) => item.contact_person || 'N/A' },
    { key: 'outstanding', header: 'Total Outstanding', cell: (item) => <span className="font-semibold text-red-600 dark:text-red-400">₹{Number(item.outstanding).toFixed(2)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Outstanding Report</h1>
          <p className="text-gray-500 dark:text-gray-400">Current outstanding balances across all parties.</p>
        </div>
        <div className="flex gap-2">
          <ExportButton reportType="OUTSTANDING_REPORT" format="EXCEL" />
          <ExportButton reportType="OUTSTANDING_REPORT" format="PDF" />
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
