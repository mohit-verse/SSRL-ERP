import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePartiesQuery } from '../../../features/parties/parties.hooks';
import { useEligibleBillsQuery, useCreateSubmissionMutation } from '../../../features/submissions/submissions.hooks';
import { EligibleBillTable } from './EligibleBillTable';
import { SubmissionSummary } from './SubmissionSummary';
import { Button } from '../../../components/form/Button';
import { TextInput } from '../../../components/form/TextInput';
import { toast } from 'sonner';
import { ROUTES } from '../../../constants';

export const SubmissionWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>([]);
  const [submissionDate, setSubmissionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  
  // Stable idempotency key for the current session/attempt
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  // Reset idempotency key when party changes to allow a fresh intentional attempt later
  useEffect(() => {
    idempotencyKeyRef.current = crypto.randomUUID();
    setSelectedBillIds([]);
  }, [selectedPartyId]);

  const { data: partiesData, isLoading: isLoadingParties } = usePartiesQuery({ limit: 100, is_active: true });
  const parties = partiesData?.data?.data || [];

  const { data: eligibleBillsData, isLoading: isLoadingBills, refetch: refetchBills } = useEligibleBillsQuery(
    selectedPartyId,
    { enabled: !!selectedPartyId }
  );

  const eligibleBills = eligibleBillsData?.data || [];
  const selectedBills = eligibleBills.filter(b => selectedBillIds.includes(b.id));

  const createMutation = useCreateSubmissionMutation();

  const handleCreate = () => {
    if (!selectedPartyId || selectedBillIds.length === 0) return;

    createMutation.mutate(
      {
        payload: {
          party_id: selectedPartyId,
          bill_ids: selectedBillIds,
          submission_date: submissionDate,
          remarks: remarks || null,
        },
        idempotencyKey: idempotencyKeyRef.current,
      },
      {
        onSuccess: (data) => {
          toast.success('Submission created successfully');
          navigate(`${ROUTES.PROTECTED.SUBMISSIONS}/${data.data.id}`);
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Failed to create submission');
          // If error is related to stale bill (409 Conflict/Eligibility), refresh bills
          if (error.response?.status === 409 || error.response?.status === 400) {
            refetchBills();
          }
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Submission Workspace</h1>
        <p className="text-gray-500 dark:text-gray-400">Select a party and group generated bills into a formal submission payload.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800 space-y-4">
        <h2 className="text-lg font-semibold border-b border-gray-100 dark:border-gray-800 pb-2">1. Party Selection</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Party *</label>
            <select
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoadingParties}
            >
              <option value="">Select a Party...</option>
              {parties.map(party => (
                <option key={party.id} value={party.id}>
                  {party.party_name} - {party.gst_number || 'No GST'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedPartyId && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
            <h2 className="text-lg font-semibold">2. Select Eligible Bills</h2>
            <Button variant="outline" size="sm" onClick={() => refetchBills()} isLoading={isLoadingBills}>
              Refresh Bills
            </Button>
          </div>
          
          {isLoadingBills ? (
            <p className="text-sm text-gray-500">Loading eligible bills...</p>
          ) : (
            <EligibleBillTable 
              bills={eligibleBills} 
              selectedBillIds={selectedBillIds} 
              onSelectionChange={setSelectedBillIds}
            />
          )}
        </div>
      )}

      {selectedBillIds.length > 0 && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800 space-y-4">
          <h2 className="text-lg font-semibold border-b border-gray-100 dark:border-gray-800 pb-2">3. Submission Generation</h2>
          
          <SubmissionSummary selectedBills={selectedBills} />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="w-full">
              <TextInput 
                label="Submission Date *" 
                type="date" 
                value={submissionDate} 
                onChange={(e) => setSubmissionDate(e.target.value)} 
              />
            </div>
            
            <div className="md:col-span-2">
              <TextInput 
                label="Remarks" 
                value={remarks} 
                onChange={(e) => setRemarks(e.target.value)} 
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleCreate} 
              isLoading={createMutation.isPending}
              disabled={selectedBillIds.length === 0}
            >
              Create Submission
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
