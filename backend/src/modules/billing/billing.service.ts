import { BillingRepository } from './billing.repository';
import { FinancialYearsRepository } from '../financial-years/financial-years.repository';
import { PartiesRepository } from '../parties/parties.repository';
import { TripBillingEligibilityService } from './trip-billing-eligibility.service';
import { BusinessError, NotFoundError } from '../../utils/errors';
import { BillStatus, BillingType, SequenceKey, TripStatus, Prisma } from '@prisma/client';
import { buildSearchCondition } from '../../utils/search';
import { prisma } from '../../prisma/client';
import { ActivityLogService } from '../activity-logs/activity-log.service';

export class BillingService {
  static async getEligibleTrips(partyId: string, billingType: BillingType) {
    const party = await PartiesRepository.findById(partyId);
    if (!party) throw new NotFoundError('Party not found');
    if (!party.is_active) throw new BusinessError('Party is inactive');
    if (party.billing_type !== billingType) {
      throw new BusinessError(
        `Party is configured for ${party.billing_type} billing, not ${billingType}`,
      );
    }

    return TripBillingEligibilityService.getEligibleTrips(partyId);
  }

  static async generateBill(
    data: {
      partyId: string;
      billingType: BillingType;
      tripIds: string[];
      billDate: string;
      digitalSignature?: boolean;
    },
    userId: string,
  ) {
    if (data.tripIds.length === 0) {
      throw new BusinessError('At least one trip must be provided');
    }

    if (data.billingType === BillingType.INDIVIDUAL && data.tripIds.length > 1) {
      throw new BusinessError('Individual billing allows only one trip');
    }

    const trips = await TripBillingEligibilityService.validateTripsForBilling(
      data.tripIds,
      data.partyId,
    );

    const activeFy = await FinancialYearsRepository.findActive();
    if (!activeFy) throw new BusinessError('No active Financial Year found');

    const party = await PartiesRepository.findById(data.partyId);
    if (!party || !party.is_active) throw new BusinessError('Party is invalid or inactive');

    const totalAmount = trips.reduce((sum, trip) => sum + Number(trip.freight_rate), 0);

    // Transaction to safely generate the bill
    return prisma.$transaction(async (tx) => {
      // 1. Generate Sequence Number atomically
      const nextNumberObj = await tx.numberSequence.update({
        where: {
          financial_year_id_sequence_key: {
            financial_year_id: activeFy.id,
            sequence_key: SequenceKey.BILL,
          },
        },
        data: { last_number: { increment: 1 } },
      });

      if (!nextNumberObj) {
        throw new BusinessError('Number Sequence for Bills not initialized');
      }

      const maxDigits = 4;
      const formattedNumber = String(nextNumberObj.last_number).padStart(maxDigits, '0');
      const billNumber = `${nextNumberObj.prefix}${formattedNumber}`;

      // 2. Create the Bill
      const bill = await tx.bill.create({
        data: {
          bill_number: billNumber,
          financial_year_id: activeFy.id,
          party_id: party.id,
          bill_type: data.billingType,
          bill_date: new Date(data.billDate),
          digital_signature: data.digitalSignature || false,
          total_amount: totalAmount,
          status: BillStatus.GENERATED,
          party_name_snapshot: party.party_name,
          gst_number_snapshot: party.gst_number,
          billing_address_snapshot: party.address,
          created_by: userId,
        },
      });

      // 3. Create Bill Trips and Update Trip statuses
      for (const trip of trips) {
        await tx.billTrip.create({
          data: {
            bill_id: bill.id,
            trip_id: trip.id,
            linked_by: userId,
          },
        });

        await tx.trip.update({
          where: { id: trip.id },
          data: {
            status: TripStatus.BILLED,
            bill_generated_date: new Date(),
            bill_id: bill.id,
          },
        });
      }

      await ActivityLogService.log(tx, {
        userId,
        module: 'BILLING',
        entityType: 'BILL',
        entityId: bill.id,
        action: 'BILL_GENERATED',
        description: `Bill ${bill.bill_number} generated for Party ${party.party_name}`,
      });

      return bill;
    });
  }

  static async listBills(query: string, skip: number, take: number) {
    const where: Prisma.BillWhereInput = {};
    if (query) {
      Object.assign(where, buildSearchCondition(['bill_number'], query));
    }

    const [data, total] = await Promise.all([
      BillingRepository.findAll({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: { party: true },
      }),
      BillingRepository.count(where),
    ]);

    return { data, total };
  }

  static async getBill(id: string) {
    const bill = await BillingRepository.findById(id);
    if (!bill) throw new NotFoundError('Bill not found');
    return bill;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async cancelBill(id: string, data: any, userId: string) {
    const bill = await BillingRepository.findById(id);
    if (!bill) throw new NotFoundError('Bill not found');

    if (bill.status === BillStatus.CANCELLED) {
      throw new BusinessError('Bill is already cancelled');
    }

    if (bill.status === BillStatus.SUBMITTED) {
      throw new BusinessError('Cannot cancel a submitted bill');
    }

    // Cancellation transaction
    return prisma.$transaction(async (tx) => {
      // Mark as cancelled
      const updatedBill = await tx.bill.update({
        where: { id },
        data: { status: BillStatus.CANCELLED },
      });

      // Return trips to POD_RECEIVED state
      for (const billTrip of bill.bill_trips) {
        await tx.trip.update({
          where: { id: billTrip.trip_id },
          data: {
            status: TripStatus.POD_RECEIVED,
            bill_generated_date: null,
            bill_id: null,
          },
        });
      }

      await ActivityLogService.log(tx, {
        userId,
        module: 'BILLING',
        entityType: 'BILL',
        entityId: bill.id,
        action: 'BILL_CANCELLED',
        description: `Bill ${bill.bill_number} cancelled. Reason: ${data.reason}`,
      });

      return updatedBill;
    });
  }
}
