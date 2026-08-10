import React, { useRef, useState } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/form/Button';
import { TextInput } from '../../../components/form/TextInput';
import { useCancelPaymentMutation } from '../../../features/payments/payments.hooks';
import { toast } from 'sonner';

interface PaymentCancellationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: string;
  paymentNumber: string;
  partyName: string;
  amount: number;
}

export const PaymentCancellationDialog: React.FC<PaymentCancellationDialogProps> = ({
  isOpen, onClose, paymentId, paymentNumber, partyName, amount
}) => {
  const [remarks, setRemarks] = useState('');
  const idempotencyKeyRef = useRef(crypto.randomUUID());
  const cancelMutation = useCancelPaymentMutation();

  React.useEffect(() => {
    if (isOpen) {
      setRemarks('');
      idempotencyKeyRef.current = crypto.randomUUID();
    }
  }, [isOpen]);

  const handleCancel = () => {
    if (remarks.length < 5) {
      toast.error('Please provide a valid cancellation reason.');
      return;
    }

    cancelMutation.mutate(
      { 
        id: paymentId, 
        payload: { remarks }, 
        idempotencyKey: idempotencyKeyRef.current 
      },
      {
        onSuccess: () => {
          toast.success('Payment cancelled successfully');
          onClose();
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Failed to cancel payment');
        }
      }
    );
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Cancel Payment">
      <div className="space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded text-sm border border-red-200 dark:border-red-800/50">
          <p className="font-semibold mb-1">Warning: Financial Reversal</p>
          <p>Cancelling this payment will trigger a reverse-FIFO operation. The allocated amounts will be wiped, and the respective customer balances on underlying Trips will be restored. This action is permanently recorded in the ledger.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-gray-500">Payment Number</p>
            <p className="font-semibold text-gray-900 dark:text-white">{paymentNumber}</p>
          </div>
          <div>
            <p className="text-gray-500">Party</p>
            <p className="font-semibold text-gray-900 dark:text-white">{partyName}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500">Total Amount</p>
            <p className="font-semibold text-gray-900 dark:text-white">₹{amount.toFixed(2)}</p>
          </div>
        </div>
        
        <TextInput 
          label="Cancellation Remarks *" 
          value={remarks} 
          onChange={(e) => setRemarks(e.target.value)} 
          placeholder="e.g. Bank rejected cheque, correcting amount"
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button variant="outline" onClick={onClose} disabled={cancelMutation.isPending}>Close</Button>
          <Button 
            className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700" 
            onClick={handleCancel}
            isLoading={cancelMutation.isPending}
          >
            Confirm Cancellation
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
