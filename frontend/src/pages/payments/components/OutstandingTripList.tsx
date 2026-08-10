import React from 'react';
import { Trip } from '../../../features/trips/trips.types';

export const OutstandingTripList: React.FC<{ trips: Trip[] }> = ({ trips }) => {
  if (!trips || trips.length === 0) return null;

  return (
    <div className="overflow-x-auto mt-4 border border-gray-200 dark:border-gray-800 rounded-lg">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <tr>
            <th className="px-4 py-2 font-semibold">Trip No</th>
            <th className="px-4 py-2 font-semibold">Date</th>
            <th className="px-4 py-2 font-semibold">Route</th>
            <th className="px-4 py-2 font-semibold">Status</th>
            <th className="px-4 py-2 font-semibold text-right">Customer Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {trips.map(trip => (
            <tr key={trip.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-4 py-2 font-medium">{trip.trip_number}</td>
              <td className="px-4 py-2">{new Date(trip.loading_date).toLocaleDateString()}</td>
              <td className="px-4 py-2 text-gray-500 text-xs">{trip.from_city} → {trip.to_city}</td>
              <td className="px-4 py-2 text-xs">{trip.status}</td>
              <td className="px-4 py-2 text-right font-semibold text-red-600 dark:text-red-400">
                ₹{Number(trip.customer_balance).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
