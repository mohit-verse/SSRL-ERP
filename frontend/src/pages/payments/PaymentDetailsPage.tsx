import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePaymentQuery } from '../../features/payments/payments.hooks';
import { Button } from '../../components/form/Button';
import { PaymentAllocationList } from './components/PaymentAllocationList';
import { PaymentCancellationDialog } from './components/PaymentCancellationDialog';
import { PaymentStatusBadge } from './components/PaymentStatusBadge';
import { useAuth } from '../../hooks/useAuth';

export const PaymentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: response, isLoading } = usePaymentQuery(id!);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const { hasRole } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!response?.data) return <div>Payment not found.</div>;

  const payment = response.data;
  const hasCancelRights = hasRole(['SUPER_ADMIN', 'ADMIN']);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Payment {payment.payment_number}
            <PaymentStatusBadge status={payment.status} />
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Recorded on {new Date(payment.created_at).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex gap-2">
          {hasCancelRights && payment.status !== 'CANCELLED' && (
            <Button 
              variant="outline" 
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" 
              onClick={() => setIsCancelModalOpen(true)}
            >
              Cancel Payment
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Summary</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-sm text-gray-500">Party</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{payment.party?.party_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Date</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(payment.payment_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Type</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{payment.payment_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Reference / UTR No.</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{payment.reference_number}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Remarks</p>
                <p className="font-medium text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {payment.remarks || 'None'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Allocation Ledger (FIFO)</h3>
            </div>
            
            {payment.status === 'CANCELLED' && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-3 rounded text-xs border border-red-200 dark:border-red-800/50 mb-4">
                This payment was cancelled. The allocations shown here have been reversed and the respective balances have been restored to the customer.
              </div>
            )}

            {!payment.payment_allocations || payment.payment_allocations.length === 0 ? (
              <p className="text-sm text-gray-500">No allocations exist for this payment. It may have been unallocated or reversed.</p>
            ) : (
              <PaymentAllocationList allocations={payment.payment_allocations} />
            )}
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Amount</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm text-gray-500">Total Allocations</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{payment.payment_allocations?.length || 0}</p>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Received Amount</p>
                <p className={`text-2xl font-bold ${payment.status === 'CANCELLED' ? 'text-gray-400 line-through' : 'text-green-600 dark:text-green-400'}`}>
                  ₹{Number(payment.amount).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PaymentCancellationDialog 
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        paymentId={payment.id}
        paymentNumber={payment.payment_number}
        partyName={payment.party?.party_name || 'Unknown'}
        amount={Number(payment.amount)}
      />
    </div>
  );
};
