import React from 'react';
import { PaymentAllocation } from '../../../features/payments/payments.types';

export const PaymentAllocationList: React.FC<{ allocations: PaymentAllocation[] }> = ({ allocations }) => {
  // Respect backend allocation ordering
  const sortedAllocations = [...allocations].sort((a, b) => a.allocation_order - b.allocation_order);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <tr>
            <th className="px-4 py-3 font-semibold w-16">Order</th>
            <th className="px-4 py-3 font-semibold">Allocation Target</th>
            <th className="px-4 py-3 font-semibold">Financial Year</th>
            <th className="px-4 py-3 font-semibold text-right">Allocated Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {sortedAllocations.map(alloc => (
            <tr key={alloc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-4 py-3 font-medium text-gray-500">#{alloc.allocation_order}</td>
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                {alloc.bill_id ? `Bill ID: ${alloc.bill_id}` : ''}
                {alloc.allocation_month ? `Month: ${new Date(alloc.allocation_month).toLocaleDateString(undefined, { month: 'long', year: 'numeric'})}` : ''}
              </td>
              <td className="px-4 py-3 text-gray-500">{alloc.financial_year_id}</td>
              <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                ₹{Number(alloc.allocated_amount).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
