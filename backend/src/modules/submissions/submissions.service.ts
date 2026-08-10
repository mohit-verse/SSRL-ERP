import { SubmissionsRepository } from './submissions.repository';
import { FinancialYearsRepository } from '../financial-years/financial-years.repository';
import { PartiesRepository } from '../parties/parties.repository';
import { BusinessError, NotFoundError } from '../../utils/errors';
import { BillStatus, SequenceKey, SubmissionReason, Prisma } from '@prisma/client';
import { buildSearchCondition } from '../../utils/search';
import { prisma } from '../../prisma/client';
import { ActivityLogService } from '../activity-logs/activity-log.service';

export class SubmissionsService {
  static async getEligibleBills(partyId: string) {
    const party = await PartiesRepository.findById(partyId);
    if (!party) throw new NotFoundError('Party not found');
    if (!party.is_active) throw new BusinessError('Party is inactive');

    return prisma.bill.findMany({
      where: {
        party_id: partyId,
        status: BillStatus.GENERATED,
      },
      include: {
        party: true,
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async createSubmission(data: any, userId: string) {
    const party = await PartiesRepository.findById(data.party_id);
    if (!party || !party.is_active) throw new BusinessError('Party is invalid or inactive');

    const bills = await SubmissionsRepository.getBillsByIds(data.bill_ids);
    if (bills.length !== data.bill_ids.length) {
      throw new BusinessError('One or more selected bills were not found');
    }

    for (const bill of bills) {
      if (bill.party_id !== data.party_id) {
        throw new BusinessError(`Bill ${bill.bill_number} does not belong to the selected Party`);
      }
      if (bill.status !== BillStatus.GENERATED) {
        throw new BusinessError(`Bill ${bill.bill_number} is already submitted or cancelled`);
      }
    }

    const activeFy = await FinancialYearsRepository.findActive();
    if (!activeFy) throw new BusinessError('No active Financial Year found');

    return prisma.$transaction(async (tx) => {
      // 1. Generate Sequence Number atomically
      const nextNumberObj = await tx.numberSequence.update({
        where: {
          financial_year_id_sequence_key: {
            financial_year_id: activeFy.id,
            sequence_key: SequenceKey.SUBMISSION,
          },
        },
        data: { last_number: { increment: 1 } },
      });

      if (!nextNumberObj) {
        throw new BusinessError('Number Sequence for Submissions not initialized');
      }

      const maxDigits = 4;
      const formattedNumber = String(nextNumberObj.last_number).padStart(maxDigits, '0');
      const submissionNumber = `${nextNumberObj.prefix}${formattedNumber}`;

      // 2. Create the Submission
      const submission = await tx.submission.create({
        data: {
          submission_number: submissionNumber,
          financial_year_id: activeFy.id,
          party_id: data.party_id,
          submission_date: new Date(data.submission_date),
          remarks: data.remarks || null,
          created_by: userId,
        },
      });

      // 3. Create SubmissionBills and Update Bills
      for (const bill of bills) {
        await tx.submissionBill.create({
          data: {
            submission_id: submission.id,
            bill_id: bill.id,
            submission_reason: SubmissionReason.INITIAL,
          },
        });

        await tx.bill.update({
          where: { id: bill.id },
          data: { status: BillStatus.SUBMITTED },
        });
      }

      await ActivityLogService.log(tx, {
        userId,
        module: 'SUBMISSIONS',
        entityType: 'SUBMISSION',
        entityId: submission.id,
        action: 'SUBMISSION_CREATED',
        description: `Submission ${submission.submission_number} created with ${bills.length} bills`,
      });

      return submission;
    });
  }

  static async listSubmissions(query: string, skip: number, take: number) {
    const where: Prisma.SubmissionWhereInput = {};
    if (query) {
      Object.assign(where, buildSearchCondition(['submission_number'], query));
    }

    const [data, total] = await Promise.all([
      SubmissionsRepository.findAll({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: { party: true },
      }),
      SubmissionsRepository.count(where),
    ]);

    return { data, total };
  }

  static async getSubmission(id: string) {
    const submission = await SubmissionsRepository.findById(id);
    if (!submission) throw new NotFoundError('Submission not found');
    return submission;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async reissueSubmission(id: string, data: any, userId: string) {
    const oldSubmission = await SubmissionsRepository.findById(id);
    if (!oldSubmission) throw new NotFoundError('Submission not found');

    const activeFy = await FinancialYearsRepository.findActive();
    if (!activeFy) throw new BusinessError('No active Financial Year found');

    return prisma.$transaction(async (tx) => {
      // 1. Generate Sequence Number atomically
      const nextNumberObj = await tx.numberSequence.update({
        where: {
          financial_year_id_sequence_key: {
            financial_year_id: activeFy.id,
            sequence_key: SequenceKey.SUBMISSION,
          },
        },
        data: { last_number: { increment: 1 } },
      });

      if (!nextNumberObj) {
        throw new BusinessError('Number Sequence for Submissions not initialized');
      }

      const maxDigits = 4;
      const formattedNumber = String(nextNumberObj.last_number).padStart(maxDigits, '0');
      const newSubmissionNumber = `${nextNumberObj.prefix}${formattedNumber}`;

      // 2. Create the NEW Submission
      const newSubmission = await tx.submission.create({
        data: {
          submission_number: newSubmissionNumber,
          financial_year_id: activeFy.id,
          party_id: oldSubmission.party_id,
          submission_date: new Date(data.submission_date),
          remarks: data.remarks || null,
          created_by: userId,
        },
      });

      // 3. Create SubmissionBills
      for (const oldSubBill of oldSubmission.submission_bills) {
        await tx.submissionBill.create({
          data: {
            submission_id: newSubmission.id,
            bill_id: oldSubBill.bill_id,
            submission_reason: SubmissionReason.REISSUE,
          },
        });
      }

      await ActivityLogService.log(tx, {
        userId,
        module: 'SUBMISSIONS',
        entityType: 'SUBMISSION',
        entityId: newSubmission.id,
        action: 'SUBMISSION_REISSUED',
        description: `Submission ${oldSubmission.submission_number} reissued as ${newSubmission.submission_number}`,
      });

      return newSubmission;
    });
  }
}
