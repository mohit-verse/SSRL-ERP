import { prisma } from '../../prisma/client';
import { Prisma } from '@prisma/client';

export class BillingRepository {
  static async createBill(data: Prisma.BillCreateInput) {
    return prisma.bill.create({ data });
  }

  static async findById(id: string) {
    return prisma.bill.findUnique({
      where: { id },
      include: {
        bill_trips: {
          include: { trip: true },
        },
        party: true,
      },
    });
  }

  static async findAll(args: Prisma.BillFindManyArgs) {
    return prisma.bill.findMany(args);
  }

  static async count(where?: Prisma.BillWhereInput) {
    return prisma.bill.count({ where });
  }

  static async updateStatus(id: string, status: Prisma.EnumBillStatusFieldUpdateOperationsInput) {
    return prisma.bill.update({ where: { id }, data: { status } });
  }

  static async getTripsByIds(tripIds: string[]) {
    return prisma.trip.findMany({
      where: { id: { in: tripIds } },
      include: { party: true },
    });
  }
}
