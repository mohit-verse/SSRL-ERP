import React from 'react';
import { Bill } from '../../../features/billing/billing.types';

interface SubmissionSummaryProps {
  selectedBills: Bill[];
}

export const SubmissionSummary: React.FC<SubmissionSummaryProps> = ({ selectedBills }) => {
  const billCount = selectedBills.length;
  // This is a UI preview total, backend will handle authoritative tracking
  const estimatedTotal = selectedBills.reduce((sum, bill) => sum + Number(bill.total_amount), 0);

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 mb-6">
      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 uppercase tracking-wider">Preview Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-blue-700 dark:text-blue-300">Selected Bills</p>
          <p className="font-medium text-blue-900 dark:text-blue-100">{billCount}</p>
        </div>
        <div>
          <p className="text-xs text-blue-700 dark:text-blue-300">Submission Type</p>
          <p className="font-medium text-blue-900 dark:text-blue-100">INITIAL</p>
        </div>
        <div>
          <p className="text-xs text-blue-700 dark:text-blue-300">Estimated Total</p>
          <p className="font-bold text-blue-900 dark:text-blue-100">₹{estimatedTotal.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-blue-700 dark:text-blue-300">Bill Numbers</p>
          <p className="font-medium text-blue-900 dark:text-blue-100 text-xs truncate max-w-full" title={selectedBills.map(b => b.bill_number).join(', ')}>
            {selectedBills.map(b => b.bill_number).join(', ')}
          </p>
        </div>
      </div>
    </div>
  );
};
