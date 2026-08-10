import React from 'react';
import { TextInput } from '../../../components/form/TextInput';

interface TripFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  vehicleType: string;
  onVehicleTypeChange: (val: string) => void;
}

export const TripFilters: React.FC<TripFiltersProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  vehicleType,
  onVehicleTypeChange
}) => {
  return (
    <div className="flex flex-wrap gap-4 items-end mb-6 bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
      <div className="w-64">
        <TextInput
          placeholder="Search by Trip No, Vehicle, City..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="w-48 flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Status</label>
        <select 
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="CREATED">CREATED</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="POD_RECEIVED">POD RECEIVED</option>
          <option value="BILLED">BILLED</option>
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="PAYMENT_PENDING">PAYMENT PENDING</option>
          <option value="PAID">PAID</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>
      <div className="w-48 flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Vehicle Type</label>
        <select 
          value={vehicleType}
          onChange={(e) => onVehicleTypeChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Vehicles</option>
          <option value="OWN_FLEET">Own Fleet</option>
          <option value="EXTERNAL">External</option>
        </select>
      </div>
    </div>
  );
};
