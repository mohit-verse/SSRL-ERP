import { Bill } from '../billing/billing.types';
import { Party } from '../parties/parties.api';

export interface Submission {
  id: string;
  submission_number: string;
  financial_year_id: string;
  party_id: string;
  submission_date: string;
  remarks?: string | null;
  created_by: string;
  created_at: string;
  
  party?: Party;
  submission_bills?: SubmissionBill[];
}

export interface SubmissionBill {
  id: string;
  submission_id: string;
  bill_id: string;
  submission_reason: 'INITIAL' | 'REISSUE';
  linked_at: string;
  
  bill?: Bill;
}

export interface CreateSubmissionPayload {
  party_id: string;
  bill_ids: string[];
  submission_date: string;
  remarks?: string | null;
}

export interface ReissueSubmissionPayload {
  submission_date: string;
  remarks?: string | null;
}
