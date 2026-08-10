import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePartiesQuery } from '../../../features/parties/parties.hooks';
import { useEligibleTripsQuery, useGenerateBillMutation } from '../../../features/billing/billing.hooks';
import { EligibleTripTable } from './EligibleTripTable';
import { BillSummary } from './BillSummary';
import { Button } from '../../../components/form/Button';
import { TextInput } from '../../../components/form/TextInput';
import { toast } from 'sonner';
import { ROUTES } from '../../../constants';


export const BillingWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [billingType, setBillingType] = useState<'INDIVIDUAL' | 'CONSOLIDATED' | ''>('');
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Stable idempotency key for the current session/attempt
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  // Reset idempotency key when party or billing type changes to allow a fresh intentional generation attempt later
  useEffect(() => {
    idempotencyKeyRef.current = crypto.randomUUID();
    setSelectedTripIds([]);
  }, [selectedPartyId, billingType]);

  const { data: partiesData, isLoading: isLoadingParties } = usePartiesQuery({ limit: 100, is_active: true });
  const parties = partiesData?.data?.data || [];
  const selectedParty = parties.find(p => p.id === selectedPartyId);

  // Derive supported billing types based on selected party
  const partyBillingType = selectedParty?.billing_type;

  const { data: eligibleTripsData, isLoading: isLoadingTrips, refetch: refetchTrips } = useEligibleTripsQuery(
    { party_id: selectedPartyId, billing_type: billingType as any },
    { enabled: !!selectedPartyId && !!billingType }
  );

  const eligibleTrips = eligibleTripsData?.data || [];
  const selectedTrips = eligibleTrips.filter(t => selectedTripIds.includes(t.id));

  const generateMutation = useGenerateBillMutation();

  const handleGenerate = () => {
    if (!selectedPartyId || !billingType || selectedTripIds.length === 0) return;

    if (billingType === 'INDIVIDUAL' && selectedTripIds.length > 1) {
      toast.error('Individual billing requires exactly one trip to be selected.');
      return;
    }

    generateMutation.mutate(
      {
        payload: {
          partyId: selectedPartyId,
          billingType: billingType as 'INDIVIDUAL' | 'CONSOLIDATED',
          tripIds: selectedTripIds,
          billDate,
          digitalSignature: false,
        },
        idempotencyKey: idempotencyKeyRef.current,
      },
      {
        onSuccess: (data) => {
          toast.success('Bill generated successfully');
          navigate(`${ROUTES.PROTECTED.BILLS}/${data.data.id}`);
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Failed to generate bill');
          // If error is related to stale trip (409 Conflict/Eligibility), refresh trips
          if (error.response?.status === 409 || error.response?.status === 400) {
            refetchTrips();
          }
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing Workspace</h1>
        <p className="text-gray-500 dark:text-gray-400">Select a party and generate bills from eligible trips.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800 space-y-4">
        <h2 className="text-lg font-semibold border-b border-gray-100 dark:border-gray-800 pb-2">1. Party Selection</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Party *</label>
            <select
              value={selectedPartyId}
              onChange={(e) => {
                setSelectedPartyId(e.target.value);
                setBillingType('');
              }}
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

          {selectedParty && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Billing Type *</label>
              <select
                value={billingType}
                onChange={(e) => setBillingType(e.target.value as any)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Billing Mode...</option>
                {partyBillingType === 'INDIVIDUAL' && <option value="INDIVIDUAL">Individual</option>}
                {partyBillingType === 'CONSOLIDATED' && (
                  <>
                    <option value="INDIVIDUAL">Individual (Single Trip)</option>
                    <option value="CONSOLIDATED">Consolidated (Multiple Trips)</option>
                  </>
                )}
                {!partyBillingType && (
                   <option value="" disabled>Party missing billing config</option>
                )}
              </select>
            </div>
          )}
        </div>
      </div>

      {selectedPartyId && billingType && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
            <h2 className="text-lg font-semibold">2. Select Eligible Trips</h2>
            <Button variant="outline" size="sm" onClick={() => refetchTrips()} isLoading={isLoadingTrips}>
              Refresh Trips
            </Button>
          </div>
          
          {isLoadingTrips ? (
            <p className="text-sm text-gray-500">Loading eligible trips...</p>
          ) : (
            <EligibleTripTable 
              trips={eligibleTrips} 
              selectedTripIds={selectedTripIds} 
              onSelectionChange={setSelectedTripIds}
              selectionMode={billingType === 'INDIVIDUAL' ? 'SINGLE' : 'MULTIPLE'}
            />
          )}
        </div>
      )}

      {selectedTripIds.length > 0 && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-800 space-y-4">
          <h2 className="text-lg font-semibold border-b border-gray-100 dark:border-gray-800 pb-2">3. Bill Generation</h2>
          
          <BillSummary selectedTrips={selectedTrips} billingType={billingType as any} />
          
          <div className="flex items-end gap-4">
            <div className="w-48">
              <TextInput 
                label="Bill Date *" 
                type="date" 
                value={billDate} 
                onChange={(e) => setBillDate(e.target.value)} 
              />
            </div>
            
            <Button 
              className="mb-1"
              onClick={handleGenerate} 
              isLoading={generateMutation.isPending}
              disabled={selectedTripIds.length === 0 || (billingType === 'INDIVIDUAL' && selectedTripIds.length > 1)}
            >
              Generate {billingType === 'INDIVIDUAL' ? 'Individual' : 'Consolidated'} Bill
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
