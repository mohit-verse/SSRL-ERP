import React, { useRef, useState } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/form/Button';
import { TextInput } from '../../../components/form/TextInput';
import { useReissueSubmissionMutation } from '../../../features/submissions/submissions.hooks';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants';

interface SubmissionReissueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  submissionNumber: string;
  partyName: string;
  billCount: number;
}

export const SubmissionReissueDialog: React.FC<SubmissionReissueDialogProps> = ({
  isOpen, onClose, submissionId, submissionNumber, partyName, billCount
}) => {
  const navigate = useNavigate();
  const [submissionDate, setSubmissionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const idempotencyKeyRef = useRef(crypto.randomUUID());
  const reissueMutation = useReissueSubmissionMutation();

  React.useEffect(() => {
    if (isOpen) {
      setSubmissionDate(new Date().toISOString().split('T')[0]);
      setRemarks('');
      idempotencyKeyRef.current = crypto.randomUUID();
    }
  }, [isOpen]);

  const handleReissue = () => {
    reissueMutation.mutate(
      { 
        id: submissionId, 
        payload: { submission_date: submissionDate, remarks: remarks || null }, 
        idempotencyKey: idempotencyKeyRef.current 
      },
      {
        onSuccess: (data) => {
          toast.success('Submission reissued successfully');
          onClose();
          navigate(`${ROUTES.PROTECTED.SUBMISSIONS}/${data.data.id}`);
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Failed to reissue submission');
        }
      }
    );
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Reissue Submission">
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-4 rounded text-sm border border-blue-200 dark:border-blue-800/50">
          <p className="font-semibold mb-1">Information</p>
          <p>Reissuing this submission will create a completely new Submission record with a new ID. The original submission <b>{submissionNumber}</b> will remain unchanged in the historical ledger.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-gray-500">Original Submission</p>
            <p className="font-semibold text-gray-900 dark:text-white">{submissionNumber}</p>
          </div>
          <div>
            <p className="text-gray-500">Party</p>
            <p className="font-semibold text-gray-900 dark:text-white">{partyName}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500">Linked Bills Included</p>
            <p className="font-semibold text-gray-900 dark:text-white">{billCount} Bills</p>
          </div>
        </div>

        <TextInput 
          label="New Submission Date *" 
          type="date"
          value={submissionDate} 
          onChange={(e) => setSubmissionDate(e.target.value)} 
        />
        
        <TextInput 
          label="Remarks (Optional)" 
          value={remarks} 
          onChange={(e) => setRemarks(e.target.value)} 
          placeholder="e.g. Returned by customer, re-submitting with corrections"
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button variant="outline" onClick={onClose} disabled={reissueMutation.isPending}>Cancel</Button>
          <Button 
            onClick={handleReissue}
            isLoading={reissueMutation.isPending}
          >
            Confirm Reissue
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
