import React from 'react';
import { Trip } from '../../../features/trips/trips.types';

export const TripFinancialSummary: React.FC<{ trip: Trip }> = ({ trip }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
          <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            ₹{trip.revenue?.toFixed(2) || '0.00'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Expense</p>
          <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            ₹{trip.expense?.toFixed(2) || '0.00'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Calculated Profit</p>
          <p className={`text-xl font-semibold ${trip.profit && trip.profit > 0 ? 'text-green-600' : trip.profit && trip.profit < 0 ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
            ₹{trip.profit?.toFixed(2) || '0.00'}
          </p>
        </div>
        
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Customer Balance</p>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            ₹{trip.customer_balance?.toFixed(2) || '0.00'}
          </p>
        </div>
        
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Owner Balance</p>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            ₹{trip.owner_balance?.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-4">* Values are strictly computed by the authoritative backend engine.</p>
    </div>
  );
};
