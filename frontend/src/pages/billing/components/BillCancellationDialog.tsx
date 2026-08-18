import React, { useRef } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/form/Button';
import { TextInput } from '../../../components/form/TextInput';
import { useCancelBillMutation } from '../../../features/billing/billing.hooks';
import { toast } from 'sonner';

interface BillCancellationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  billId: string;
  billNumber: string;
  partyName: string;
  totalAmount: number;
}

export const BillCancellationDialog: React.FC<BillCancellationDialogProps> = ({
  isOpen, onClose, billId, billNumber, partyName, totalAmount
}) => {
  const [reason, setReason] = React.useState('');
  const idempotencyKeyRef = useRef(crypto.randomUUID());
  const cancelMutation = useCancelBillMutation();

  // Reset state on open
  React.useEffect(() => {
    if (isOpen) {
      setReason('');
      idempotencyKeyRef.current = crypto.randomUUID();
    }
  }, [isOpen]);

  const handleCancel = () => {
    if (reason.length < 5) {
      toast.error('Please provide a valid cancellation reason.');
      return;
    }

    cancelMutation.mutate(
      { 
        id: billId, 
        payload: { reason }, 
        idempotencyKey: idempotencyKeyRef.current 
      },
      {
        onSuccess: () => {
          toast.success('Bill cancelled successfully');
          onClose();
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Failed to cancel bill');
        }
      }
    );
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Cancel Bill">
      <div className="space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded text-sm border border-red-200 dark:border-red-800/50">
          <p className="font-semibold mb-1">Warning: Financial Mutation</p>
          <p>Cancelling this bill will update the bill status to CANCELLED and revert the associated trips' status back to eligible for billing. This action is recorded in the activity logs.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-gray-500">Bill Number</p>
            <p className="font-semibold text-gray-900 dark:text-white">{billNumber}</p>
          </div>
          <div>
            <p className="text-gray-500">Party</p>
            <p className="font-semibold text-gray-900 dark:text-white">{partyName}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500">Total Amount</p>
            <p className="font-semibold text-gray-900 dark:text-white">₹{Number(totalAmount).toFixed(2)}</p>
          </div>
        </div>

        <TextInput 
          label="Cancellation Reason *" 
          value={reason} 
          onChange={(e) => setReason(e.target.value)} 
          placeholder="e.g. Incorrect freight rate entered in trip"
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
