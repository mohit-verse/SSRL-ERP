import { prisma } from '../../prisma/client';
import { Prisma } from '@prisma/client';

export class PaymentsRepository {
  static async findById(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: {
        payment_allocations: true,
        party: true,
      },
    });
  }

  static async findAll(args: Prisma.PaymentFindManyArgs) {
    return prisma.payment.findMany(args);
  }

  static async count(where?: Prisma.PaymentWhereInput) {
    return prisma.payment.count({ where });
  }

  static async getOutstandingTrips(partyId: string) {
    return prisma.trip.findMany({
      where: {
        party_id: partyId,
        customer_balance: { gt: 0 },
      },
      orderBy: { loading_date: 'asc' },
      include: {
        bill_trips: {
          include: {
            bill: true,
          },
          orderBy: { linked_at: 'desc' },
        },
      },
    });
  }
}
