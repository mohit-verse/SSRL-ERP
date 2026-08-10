import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSubmissionQuery } from '../../features/submissions/submissions.hooks';
import { Button } from '../../components/form/Button';
import { SubmissionBillList } from './components/SubmissionBillList';
import { SubmissionReissueDialog } from './components/SubmissionReissueDialog';
import { useAuth } from '../../hooks/useAuth';

export const SubmissionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: response, isLoading } = useSubmissionQuery(id!);
  const [isReissueModalOpen, setIsReissueModalOpen] = useState(false);
  const { hasRole } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!response?.data) return <div>Submission not found.</div>;

  const submission = response.data;
  const hasEditRights = hasRole(['SUPER_ADMIN', 'ADMIN']);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Submission {submission.submission_number}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Created on {new Date(submission.created_at).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex gap-2">
          {hasEditRights && (
            <Button 
              variant="outline" 
              className="text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700" 
              onClick={() => setIsReissueModalOpen(true)}
            >
              Reissue Submission
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Historical Immutability Record</h3>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-3 rounded text-xs border border-yellow-200 dark:border-yellow-800/50 mb-4">
              A historical Submission cannot be modified. If a new delivery occurs, an authorized user must Reissue it. The original submission will always be preserved exactly as created.
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-6 pt-2">
              <div>
                <p className="text-sm text-gray-500">Party</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{submission.party?.party_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Submission Date</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(submission.submission_date).toLocaleDateString()}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Remarks</p>
                <p className="font-medium text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {submission.remarks || 'No remarks provided.'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Linked Bills Included</h3>
            {!submission.submission_bills || submission.submission_bills.length === 0 ? (
              <p className="text-sm text-gray-500">No bills linked.</p>
            ) : (
              <SubmissionBillList submissionBills={submission.submission_bills} />
            )}
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm text-gray-500">Total Bills</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{submission.submission_bills?.length || 0}</p>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Aggregated Total</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  ₹{submission.submission_bills?.reduce((sum, sb) => sum + (sb.bill ? Number(sb.bill.total_amount) : 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SubmissionReissueDialog 
        isOpen={isReissueModalOpen}
        onClose={() => setIsReissueModalOpen(false)}
        submissionId={submission.id}
        submissionNumber={submission.submission_number}
        partyName={submission.party?.party_name || 'Unknown'}
        billCount={submission.submission_bills?.length || 0}
      />
    </div>
  );
};
