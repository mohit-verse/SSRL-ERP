import React from 'react';
import { SubmissionBill } from '../../../features/submissions/submissions.types';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { SubmissionStatusBadge } from './SubmissionStatusBadge';
import { BillStatusBadge } from '../../billing/components/BillStatusBadge';

export const SubmissionBillList: React.FC<{ submissionBills: SubmissionBill[] }> = ({ submissionBills }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <tr>
            <th className="px-4 py-3 font-semibold">Bill No</th>
            <th className="px-4 py-3 font-semibold">Bill Date</th>
            <th className="px-4 py-3 font-semibold">Submission Reason</th>
            <th className="px-4 py-3 font-semibold">Current Bill Status</th>
            <th className="px-4 py-3 font-semibold text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {submissionBills.map(sb => (
            <tr key={sb.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-4 py-3 font-medium">
                <Link to={`${ROUTES.PROTECTED.BILLS}/${sb.bill_id}`} className="text-blue-600 hover:underline">
                  {sb.bill?.bill_number}
                </Link>
              </td>
              <td className="px-4 py-3">{sb.bill ? new Date(sb.bill.bill_date).toLocaleDateString() : ''}</td>
              <td className="px-4 py-3">
                <SubmissionStatusBadge status={sb.submission_reason} />
              </td>
              <td className="px-4 py-3">
                {sb.bill ? <BillStatusBadge status={sb.bill.status} /> : 'UNKNOWN'}
              </td>
              <td className="px-4 py-3 text-right font-medium">
                ₹{sb.bill ? Number(sb.bill.total_amount).toFixed(2) : '0.00'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
