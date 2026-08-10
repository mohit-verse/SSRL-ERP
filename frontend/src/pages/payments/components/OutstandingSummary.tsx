import React from 'react';
import { OutstandingResponse } from '../../../features/payments/payments.types';
import { OutstandingTripList } from './OutstandingTripList';

export const OutstandingSummary: React.FC<{ outstanding: OutstandingResponse }> = ({ outstanding }) => {
  const { totalOutstanding, monthWiseOutstanding, outstandingTrips } = outstanding;

  if (totalOutstanding <= 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 p-6 rounded-lg text-center border border-green-200 dark:border-green-800/50">
        <p className="font-semibold text-lg">No Outstanding Balance</p>
        <p className="text-sm mt-1">This party has settled all their trips and bills.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800/50 flex flex-col items-center justify-center">
        <p className="text-sm text-red-700 dark:text-red-300 font-semibold uppercase tracking-wider mb-1">Total Outstanding</p>
        <p className="text-4xl font-bold text-red-700 dark:text-red-400">₹{totalOutstanding.toFixed(2)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Month-wise Breakdown</h4>
          <div className="space-y-2">
            {Object.entries(monthWiseOutstanding).map(([month, amount]) => (
              <div key={month} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(month).toLocaleDateString(undefined, { month: 'long', year: 'numeric'})}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">₹{Number(amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Outstanding Trips</h4>
          <p className="text-sm text-gray-500 mb-2">The backend will automatically apply FIFO (First-In-First-Out) allocation against these trips when a payment is recorded.</p>
          <div className="max-h-64 overflow-y-auto pr-2">
            <OutstandingTripList trips={outstandingTrips} />
          </div>
        </div>
      </div>
    </div>
  );
};
