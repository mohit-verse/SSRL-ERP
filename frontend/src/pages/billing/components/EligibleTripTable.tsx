import React from 'react';
import { Trip } from '../../../features/trips/trips.types';

interface EligibleTripTableProps {
  trips: Trip[];
  selectedTripIds: string[];
  onSelectionChange: (ids: string[]) => void;
  selectionMode: 'SINGLE' | 'MULTIPLE';
}

export const EligibleTripTable: React.FC<EligibleTripTableProps> = ({ 
  trips, 
  selectedTripIds, 
  onSelectionChange, 
  selectionMode 
}) => {
  if (trips.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        No eligible trips found for this selection.
      </div>
    );
  }

  const handleCheckboxChange = (tripId: string) => {
    if (selectionMode === 'SINGLE') {
      onSelectionChange([tripId]);
    } else {
      if (selectedTripIds.includes(tripId)) {
        onSelectionChange(selectedTripIds.filter(id => id !== tripId));
      } else {
        onSelectionChange([...selectedTripIds, tripId]);
      }
    }
  };

  const handleSelectAll = () => {
    if (selectionMode === 'SINGLE') return;
    if (selectedTripIds.length === trips.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(trips.map(t => t.id));
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <tr>
            <th className="px-4 py-3 w-12">
              {selectionMode === 'MULTIPLE' && (
                <input 
                  type="checkbox" 
                  checked={selectedTripIds.length === trips.length && trips.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              )}
            </th>
            <th className="px-4 py-3 font-semibold">Trip No</th>
            <th className="px-4 py-3 font-semibold">Route</th>
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Vehicle</th>
            <th className="px-4 py-3 font-semibold text-right">Freight Rate</th>
            <th className="px-4 py-3 font-semibold text-right">Cust. Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {trips.map(trip => (
            <tr key={trip.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-4 py-3">
                <input 
                  type={selectionMode === 'SINGLE' ? "radio" : "checkbox"} 
                  checked={selectedTripIds.includes(trip.id)}
                  onChange={() => handleCheckboxChange(trip.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
              <td className="px-4 py-3 font-medium">{trip.trip_number}</td>
              <td className="px-4 py-3">{trip.from_city} → {trip.to_city}</td>
              <td className="px-4 py-3">{new Date(trip.loading_date).toLocaleDateString()}</td>
              <td className="px-4 py-3">{trip.vehicle_number}</td>
              <td className="px-4 py-3 text-right">₹{trip.freight_rate?.toFixed(2) || '0.00'}</td>
              <td className="px-4 py-3 text-right">₹{trip.customer_balance?.toFixed(2) || '0.00'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
