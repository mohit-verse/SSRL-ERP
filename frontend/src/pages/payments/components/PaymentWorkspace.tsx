import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePartiesQuery } from '../../../features/parties/parties.hooks';
import { useOutstandingQuery, useCreatePaymentMutation } from '../../../features/payments/payments.hooks';
import { OutstandingSummary } from './OutstandingSummary';
import { Button } from '../../../components/form/Button';
import { TextInput } from '../../../components/form/TextInput';
import { toast } from 'sonner';
import { ROUTES } from '../../../constants';

export const PaymentWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  
  // Form State
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  
  // Stable idempotency key
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  // Reset idempotency key and form when party changes
  useEffect(() => {
    idempotencyKeyRef.current = crypto.randomUUID();
    setAmount('');
    setReferenceNumber('');
    setRemarks('');
  }, [selectedPartyId]);

  const { data: partiesData, isLoading: isLoadingParties } = usePartiesQuery({ limit: 100, is_active: true });
  const parties = partiesData?.data?.data || [];

  const { data: outstandingData, isLoading: isLoadingOutstanding, refetch: refetchOutstanding } = useOutstandingQuery(
    selectedPartyId,
    { enabled: !!selectedPartyId }
  );

  const outstanding = outstandingData?.data;
  const createMutation = useCreatePaymentMutation();

  const handleCreate = () => {
    if (!selectedPartyId) return;
    const numAmount = Number(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid positive payment amount.');
      return;
    }
    
    if (!referenceNumber.trim()) {
      toast.error('Reference number is required.');
      return;
    }

    createMutation.mutate(
      {
        payload: {
          partyId: selectedPartyId,
          amount: numAmount,
          paymentDate,
          referenceNumber: referenceNumber.trim(),
          remarks: remarks.trim() || null,
        },
        idempotencyKey: idempotencyKeyRef.current,
      },
      {
        onSuccess: (data) => {
          toast.success('Payment recorded and allocated successfully');
          navigate(`${ROUTES.PROTECTED.PAYMENTS}/${data.data.id}`);
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Failed to record payment');
          // If conflict (e.g. outstanding changed, or reference dup), refetch
          if (error.response?.status === 409 || error.response?.status === 400) {
            refetchOutstanding();
          }
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Record Payment</h1>
        <p className="text-gray-500 dark:text-gray-400">Record a payment from a Party. The system will automatically allocate the amount based on FIFO rules.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800 space-y-4">
        <h2 className="text-lg font-semibold border-b border-gray-100 dark:border-gray-800 pb-2">1. Select Party</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Party *</label>
            <select
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoadingParties}
            >
              <option value="">Select an active Party...</option>
              {parties.map(party => (
                <option key={party.id} value={party.id}>
                  {party.party_name} - {party.payment_type || 'No Payment Type'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedPartyId && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
            <h2 className="text-lg font-semibold">2. Outstanding Analysis</h2>
            <Button variant="outline" size="sm" onClick={() => refetchOutstanding()} isLoading={isLoadingOutstanding}>
              Refresh Outstanding
            </Button>
          </div>
          
          {isLoadingOutstanding ? (
            <p className="text-sm text-gray-500">Loading outstanding financial data...</p>
          ) : outstanding ? (
            <OutstandingSummary outstanding={outstanding} />
          ) : (
            <p className="text-sm text-gray-500">No outstanding data available.</p>
          )}
        </div>
      )}

      {selectedPartyId && outstanding && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800 space-y-4">
          <h2 className="text-lg font-semibold border-b border-gray-100 dark:border-gray-800 pb-2">3. Payment Details</h2>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-4 rounded text-sm border border-blue-200 dark:border-blue-800/50">
            <p className="font-semibold mb-1">Information: Automatic Allocation</p>
            <p>You only need to provide the received amount. The backend financial engine will automatically distribute this amount against the oldest outstanding trips/bills (FIFO).</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput 
              label="Payment Amount (₹) *" 
              type="number"
              min="0.01"
              step="0.01"
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="e.g. 50000"
            />
            
            <TextInput 
              label="Payment Date *" 
              type="date" 
              value={paymentDate} 
              onChange={(e) => setPaymentDate(e.target.value)} 
            />

            <TextInput 
              label="Reference / UTR / Cheque Number *" 
              value={referenceNumber} 
              onChange={(e) => setReferenceNumber(e.target.value)} 
              placeholder="e.g. HDFC-12345678"
            />

            <TextInput 
              label="Remarks (Optional)" 
              value={remarks} 
              onChange={(e) => setRemarks(e.target.value)} 
            />
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleCreate} 
              isLoading={createMutation.isPending}
              disabled={!amount || !referenceNumber || outstanding.totalOutstanding <= 0}
            >
              Record Payment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
