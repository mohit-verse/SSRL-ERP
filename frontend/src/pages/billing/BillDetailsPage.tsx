import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBillQuery } from '../../features/billing/billing.hooks';
import { Button } from '../../components/form/Button';
import { BillStatusBadge } from './components/BillStatusBadge';
import { BillCancellationDialog } from './components/BillCancellationDialog';
import { ROUTES } from '../../constants';

export const BillDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: response, isLoading } = useBillQuery(id!);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  if (isLoading) return <div>Loading...</div>;
  if (!response?.data) return <div>Bill not found.</div>;

  const bill = response.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Bill {bill.bill_number}
            <BillStatusBadge status={bill.status} />
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Generated on {new Date(bill.created_at).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex gap-2">
          {bill.status !== 'CANCELLED' && (
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => setIsCancelModalOpen(true)}>
              Cancel Bill
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Party Snapshot Info */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Historical Party Information</h3>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-3 rounded text-xs border border-yellow-200 dark:border-yellow-800/50 mb-4">
              These details represent the Party's information at the exact moment this bill was generated. They are immutable and will not change even if the Party's master profile is updated.
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-sm text-gray-500">Billed Party Name</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{bill.party_name_snapshot}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">GST Number</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{bill.gst_number_snapshot || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Billing Address</p>
                <p className="font-medium text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {bill.billing_address_snapshot || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Linked Trips */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Linked Trips</h3>
            {!bill.trips || bill.trips.length === 0 ? (
              <p className="text-sm text-gray-500">No trips linked.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Trip No</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Route</th>
                      <th className="px-4 py-3 font-semibold">Vehicle</th>
                      <th className="px-4 py-3 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {bill.trips.map(trip => (
                      <tr key={trip.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-medium">
                          <Link to={`${ROUTES.PROTECTED.TRIPS}/${trip.id}`} className="text-blue-600 hover:underline">
                            {trip.trip_number}
                          </Link>
                        </td>
                        <td className="px-4 py-3">{new Date(trip.loading_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{trip.from_city} → {trip.to_city}</td>
                        <td className="px-4 py-3">{trip.vehicle_number}</td>
                        <td className="px-4 py-3 text-right">₹{Number(trip.customer_balance).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Bill Summary */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bill Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm text-gray-500">Bill Date</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(bill.bill_date).toLocaleDateString()}</p>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm text-gray-500">Billing Type</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{bill.bill_type}</p>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm text-gray-500">Digital Signature</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{bill.digital_signature ? 'Applied' : 'None'}</p>
              </div>
              <div className="flex justify-between items-center pt-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Total Amount</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">₹{Number(bill.total_amount).toFixed(2)}</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      <BillCancellationDialog 
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        billId={bill.id}
        billNumber={bill.bill_number}
        partyName={bill.party_name_snapshot}
        totalAmount={Number(bill.total_amount)}
      />
    </div>
  );
};
