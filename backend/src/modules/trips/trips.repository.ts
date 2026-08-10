import { prisma } from '../../prisma/client';
import { Prisma } from '@prisma/client';

export class TripsRepository {
  static async create(data: Prisma.TripCreateInput) {
    return prisma.trip.create({ data });
  }

  static async findById(id: string) {
    return prisma.trip.findUnique({
      where: { id },
      include: {
        expenses: {
          orderBy: { expense_date: 'desc' },
        },
        documents: {
          include: { files: true },
        },
        party: true,
      },
    });
  }

  static async findAll(args: Prisma.TripFindManyArgs) {
    return prisma.trip.findMany(args);
  }

  static async count(where?: Prisma.TripWhereInput) {
    return prisma.trip.count({ where });
  }

  static async update(id: string, data: Prisma.TripUpdateInput) {
    return prisma.trip.update({ where: { id }, data });
  }

  static async createExpense(data: Prisma.TripExpenseCreateInput) {
    return prisma.tripExpense.create({ data });
  }

  static async softDelete(id: string) {
    return prisma.trip.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  static async restore(id: string) {
    return prisma.trip.update({ where: { id }, data: { deleted_at: null } });
  }
}
