import React from 'react';
import { usePendingPodReportQuery } from '../../features/reports/reports.hooks';
import { DataTable, Column } from '../../components/table/DataTable';
import { ExportButton } from './components/ExportButton';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';

export const PendingPodReportPage: React.FC = () => {
  const { data, isLoading } = usePendingPodReportQuery();

  const columns: Column<any>[] = [
    { key: 'trip_number', header: 'Trip No', cell: (item) => (
      <Link to={`${ROUTES.PROTECTED.TRIPS}/${item.id}`} className="text-blue-600 hover:underline font-medium">
        {item.trip_number}
      </Link>
    )},
    { key: 'loading_date', header: 'Loading Date', cell: (item) => new Date(item.loading_date).toLocaleDateString() },
    { key: 'party_name', header: 'Party', cell: (item) => item.party?.party_name },
    { key: 'vehicle_number', header: 'Vehicle', cell: (item) => item.vehicle_number },
    { key: 'route', header: 'Route', cell: (item) => `${item.from_city} to ${item.to_city}` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pending POD Report</h1>
          <p className="text-gray-500 dark:text-gray-400">List of all trips lacking complete proof of delivery documentation.</p>
        </div>
        <div className="flex gap-2">
          <ExportButton reportType="PENDING_POD" format="EXCEL" />
          <ExportButton reportType="PENDING_POD" format="PDF" />
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
