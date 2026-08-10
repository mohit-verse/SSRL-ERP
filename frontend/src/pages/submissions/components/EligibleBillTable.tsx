import React from 'react';
import { Bill } from '../../../features/billing/billing.types';

interface EligibleBillTableProps {
  bills: Bill[];
  selectedBillIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export const EligibleBillTable: React.FC<EligibleBillTableProps> = ({ 
  bills, 
  selectedBillIds, 
  onSelectionChange 
}) => {
  if (bills.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        No eligible bills found for this party.
      </div>
    );
  }

  const handleCheckboxChange = (billId: string) => {
    if (selectedBillIds.includes(billId)) {
      onSelectionChange(selectedBillIds.filter(id => id !== billId));
    } else {
      onSelectionChange([...selectedBillIds, billId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedBillIds.length === bills.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(bills.map(b => b.id));
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <tr>
            <th className="px-4 py-3 w-12">
              <input 
                type="checkbox" 
                checked={selectedBillIds.length === bills.length && bills.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            <th className="px-4 py-3 font-semibold">Bill No</th>
            <th className="px-4 py-3 font-semibold">Bill Date</th>
            <th className="px-4 py-3 font-semibold">Party Snapshot</th>
            <th className="px-4 py-3 font-semibold">Bill Type</th>
            <th className="px-4 py-3 font-semibold text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {bills.map(bill => (
            <tr key={bill.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-4 py-3">
                <input 
                  type="checkbox" 
                  checked={selectedBillIds.includes(bill.id)}
                  onChange={() => handleCheckboxChange(bill.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
              <td className="px-4 py-3 font-medium">{bill.bill_number}</td>
              <td className="px-4 py-3">{new Date(bill.bill_date).toLocaleDateString()}</td>
              <td className="px-4 py-3">{bill.party_name_snapshot}</td>
              <td className="px-4 py-3">{bill.bill_type}</td>
              <td className="px-4 py-3 text-right">₹{Number(bill.total_amount).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
