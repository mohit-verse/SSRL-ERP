import { prisma } from '../../prisma/client';
import { Prisma } from '@prisma/client';

export class SubmissionsRepository {
  static async createSubmission(data: Prisma.SubmissionCreateInput) {
    return prisma.submission.create({ data });
  }

  static async findById(id: string) {
    return prisma.submission.findUnique({
      where: { id },
      include: {
        submission_bills: {
          include: { bill: true },
        },
        party: true,
      },
    });
  }

  static async findAll(args: Prisma.SubmissionFindManyArgs) {
    return prisma.submission.findMany(args);
  }

  static async count(where?: Prisma.SubmissionWhereInput) {
    return prisma.submission.count({ where });
  }

  static async getBillsByIds(billIds: string[]) {
    return prisma.bill.findMany({
      where: { id: { in: billIds } },
      include: { party: true },
    });
  }
}
