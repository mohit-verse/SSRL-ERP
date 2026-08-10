import { PaymentsRepository } from './payments.repository';
import { FinancialYearsRepository } from '../financial-years/financial-years.repository';
import { PartiesRepository } from '../parties/parties.repository';
import { BusinessError, NotFoundError } from '../../utils/errors';
import { PaymentStatus, PaymentType, SequenceKey, TripStatus, Prisma } from '@prisma/client';
import { buildSearchCondition } from '../../utils/search';
import { prisma } from '../../prisma/client';
import { ActivityLogService } from '../activity-logs/activity-log.service';

export class PaymentsService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async recordPayment(data: any, userId: string) {
    const party = await PartiesRepository.findById(data.partyId);
    if (!party || !party.is_active) throw new BusinessError('Party is invalid or inactive');
    if (!party.payment_type)
      throw new BusinessError('Party does not have a configured payment type');

    const amount = Number(data.amount);
    if (amount <= 0) throw new BusinessError('Payment amount must be greater than zero');

    const activeFy = await FinancialYearsRepository.findActive();
    if (!activeFy) throw new BusinessError('No active Financial Year found');

    // Prevent duplicate payments by reference number
    const existing = await prisma.payment.findFirst({
      where: { reference_number: data.referenceNumber, party_id: party.id },
    });
    if (existing) throw new BusinessError('Payment with this reference number already exists');

    return prisma.$transaction(async (tx) => {
      // 1. Generate Sequence Number atomically
      const nextNumberObj = await tx.numberSequence.update({
        where: {
          financial_year_id_sequence_key: {
            financial_year_id: activeFy.id,
            sequence_key: SequenceKey.PAYMENT,
          },
        },
        data: { last_number: { increment: 1 } },
      });

      if (!nextNumberObj) throw new BusinessError('Number Sequence for Payments not initialized');

      const maxDigits = 4;
      const formattedNumber = String(nextNumberObj.last_number).padStart(maxDigits, '0');
      const paymentNumber = `${nextNumberObj.prefix}${formattedNumber}`;

      // 2. Create Payment Record
      const payment = await tx.payment.create({
        data: {
          payment_number: paymentNumber,
          party_id: party.id,
          payment_type: party.payment_type as PaymentType,
          amount,
          payment_date: new Date(data.paymentDate),
          reference_number: data.referenceNumber,
          remarks: data.remarks || null,
          created_by: userId,
        },
      });

      // 3. FIFO Allocation
      let remainingAmount = amount;
      let allocationOrder = 1;

      // Fetch outstanding trips (customer_balance > 0)
      const outstandingTrips = await tx.trip.findMany({
        where: { party_id: party.id, customer_balance: { gt: 0 } },
        orderBy: { loading_date: 'asc' },
        include: { bill_trips: { include: { bill: true } } },
      });

      if (party.payment_type === PaymentType.STANDARD) {
        // Group by bill_id
        const billGroups: Record<string, typeof outstandingTrips> = {};
        for (const trip of outstandingTrips) {
          if (!trip.bill_id) continue; // Standard payments only allocate against billed trips
          if (!billGroups[trip.bill_id]) billGroups[trip.bill_id] = [];
          billGroups[trip.bill_id].push(trip);
        }

        // Sort bills by bill_date ascending
        const sortedBillIds = Object.keys(billGroups).sort((a, b) => {
          const billA = billGroups[a][0].bill_trips.find((bt) => bt.bill_id === a)?.bill.bill_date;
          const billB = billGroups[b][0].bill_trips.find((bt) => bt.bill_id === b)?.bill.bill_date;
          if (!billA || !billB) return 0;
          return billA.getTime() - billB.getTime();
        });

        for (const billId of sortedBillIds) {
          if (remainingAmount <= 0) break;
          const tripsInBill = billGroups[billId];
          let billAllocated = 0;

          for (const trip of tripsInBill) {
            if (remainingAmount <= 0) break;
            const tripBalance = Number(trip.customer_balance);
            const allocateToTrip = Math.min(remainingAmount, tripBalance);

            billAllocated += allocateToTrip;
            remainingAmount -= allocateToTrip;

            const newBalance = tripBalance - allocateToTrip;
            await tx.trip.update({
              where: { id: trip.id },
              data: {
                customer_balance: newBalance,
                status: newBalance === 0 ? TripStatus.PAID : undefined,
                payment_completed_date: newBalance === 0 ? new Date(data.paymentDate) : undefined,
              },
            });
          }

          if (billAllocated > 0) {
            await tx.paymentAllocation.create({
              data: {
                payment_id: payment.id,
                bill_id: billId,
                financial_year_id: activeFy.id,
                allocated_amount: billAllocated,
                allocation_order: allocationOrder++,
              },
            });
          }
        }
      } else {
        // BULK allocation (Month-wise)
        const monthGroups: Record<string, typeof outstandingTrips> = {};
        for (const trip of outstandingTrips) {
          const monthKey = new Date(
            trip.loading_date.getFullYear(),
            trip.loading_date.getMonth(),
            1,
          ).toISOString();
          if (!monthGroups[monthKey]) monthGroups[monthKey] = [];
          monthGroups[monthKey].push(trip);
        }

        const sortedMonths = Object.keys(monthGroups).sort(
          (a, b) => new Date(a).getTime() - new Date(b).getTime(),
        );

        for (const monthStr of sortedMonths) {
          if (remainingAmount <= 0) break;
          const tripsInMonth = monthGroups[monthStr];
          let monthAllocated = 0;

          for (const trip of tripsInMonth) {
            if (remainingAmount <= 0) break;
            const tripBalance = Number(trip.customer_balance);
            const allocateToTrip = Math.min(remainingAmount, tripBalance);

            monthAllocated += allocateToTrip;
            remainingAmount -= allocateToTrip;

            const newBalance = tripBalance - allocateToTrip;
            await tx.trip.update({
              where: { id: trip.id },
              data: {
                customer_balance: newBalance,
                status: newBalance === 0 ? TripStatus.PAID : undefined,
                payment_completed_date: newBalance === 0 ? new Date(data.paymentDate) : undefined,
              },
            });
          }

          if (monthAllocated > 0) {
            await tx.paymentAllocation.create({
              data: {
                payment_id: payment.id,
                allocation_month: new Date(monthStr),
                financial_year_id: activeFy.id,
                allocated_amount: monthAllocated,
                allocation_order: allocationOrder++,
              },
            });
          }
        }
      }

      await ActivityLogService.log(tx, {
        userId,
        module: 'PAYMENTS',
        entityType: 'PAYMENT',
        entityId: payment.id,
        action: 'PAYMENT_RECORDED',
        description: `Payment ${payment.payment_number} of ${amount} recorded for Party ${party.party_name}`,
      });

      return payment;
    });
  }

  static async listPayments(query: string, skip: number, take: number) {
    const where: Prisma.PaymentWhereInput = {};
    if (query) {
      Object.assign(where, buildSearchCondition(['payment_number', 'reference_number'], query));
    }

    const [data, total] = await Promise.all([
      PaymentsRepository.findAll({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: { party: true },
      }),
      PaymentsRepository.count(where),
    ]);

    return { data, total };
  }

  static async getPayment(id: string) {
    const payment = await PaymentsRepository.findById(id);
    if (!payment) throw new NotFoundError('Payment not found');
    return payment;
  }

  static async getOutstanding(partyId: string) {
    const trips = await PaymentsRepository.getOutstandingTrips(partyId);

    // Group by month and calculate totals
    let totalOutstanding = 0;
    const monthWise: Record<string, number> = {};

    for (const trip of trips) {
      const bal = Number(trip.customer_balance);
      totalOutstanding += bal;

      const monthKey = `${trip.loading_date.getFullYear()}-${String(trip.loading_date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthWise[monthKey]) monthWise[monthKey] = 0;
      monthWise[monthKey] += bal;
    }

    return {
      totalOutstanding,
      monthWiseOutstanding: monthWise,
      outstandingTrips: trips,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async cancelPayment(id: string, data: any, userId: string) {
    const payment = await PaymentsRepository.findById(id);
    if (!payment) throw new NotFoundError('Payment not found');
    if (payment.status === PaymentStatus.CANCELLED)
      throw new BusinessError('Payment is already cancelled');

    return prisma.$transaction(async (tx) => {
      // 1. Delete allocation records
      await tx.paymentAllocation.deleteMany({
        where: { payment_id: id },
      });

      // 2. Mark payment as cancelled
      const updatedPayment = await tx.payment.update({
        where: { id },
        data: { status: PaymentStatus.CANCELLED },
      });

      // 3. Restore customer outstanding (Reverse FIFO)
      // For each allocation, find the trips that were paid and restore their balance.
      // We process allocations in reverse order to undo the newest ones first.
      const allocations = [...payment.payment_allocations].sort(
        (a, b) => b.allocation_order - a.allocation_order,
      );

      for (const allocation of allocations) {
        let amountToRestore = Number(allocation.allocated_amount);
        if (amountToRestore <= 0) continue;

        // Fetch trips that belong to this allocation (either bill_id or month)
        // We order by loading_date DESC to restore the newest trips first (Reverse FIFO).
        const tripsWhere: Prisma.TripWhereInput = { party_id: payment.party_id };
        if (allocation.bill_id) {
          tripsWhere.bill_id = allocation.bill_id;
        } else if (allocation.allocation_month) {
          const monthStart = allocation.allocation_month;
          const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
          tripsWhere.loading_date = { gte: monthStart, lte: monthEnd };
        }

        const trips = await tx.trip.findMany({
          where: tripsWhere,
          orderBy: { loading_date: 'desc' },
        });

        for (const trip of trips) {
          if (amountToRestore <= 0) break;

          const currentBalance = Number(trip.customer_balance);
          const originalMaxBalance = Number(trip.freight_rate) - Number(trip.customer_advance);

          if (currentBalance < originalMaxBalance) {
            const spaceToRestore = originalMaxBalance - currentBalance;
            const restoreAmount = Math.min(amountToRestore, spaceToRestore);

            amountToRestore -= restoreAmount;
            const newBalance = currentBalance + restoreAmount;

            // Determine status reversion
            // If it was PAID, it goes back to BILLED or SUBMITTED depending on bill_id
            let newStatus = trip.status;
            if (trip.status === TripStatus.PAID) {
              // If bill exists, check if it's submitted or generated
              if (trip.bill_id) {
                const billInfo = await tx.bill.findUnique({ where: { id: trip.bill_id } });
                if (billInfo?.status === 'SUBMITTED') newStatus = TripStatus.SUBMITTED;
                else newStatus = TripStatus.BILLED;
              } else {
                newStatus = TripStatus.DELIVERED; // fallback
              }
            }

            await tx.trip.update({
              where: { id: trip.id },
              data: {
                customer_balance: newBalance,
                status: newStatus,
                payment_completed_date: null,
              },
            });
          }
        }
      }

      await ActivityLogService.log(tx, {
        userId,
        module: 'PAYMENTS',
        entityType: 'PAYMENT',
        entityId: payment.id,
        action: 'PAYMENT_CANCELLED',
        description: `Payment ${payment.payment_number} cancelled. Reason: ${data.remarks || 'None'}`,
      });

      return updatedPayment;
    });
  }
}
