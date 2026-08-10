import { prisma } from '../../prisma/client';
import { Prisma } from '@prisma/client';

export class PartiesRepository {
  static async create(data: Prisma.PartyCreateInput) {
    return prisma.party.create({ data });
  }

  static async findById(id: string) {
    return prisma.party.findUnique({ where: { id } });
  }

  static async findByGst(gst_number: string) {
    return prisma.party.findUnique({ where: { gst_number } });
  }

  static async findAll(args: Prisma.PartyFindManyArgs) {
    return prisma.party.findMany(args);
  }

  static async count(where?: Prisma.PartyWhereInput) {
    return prisma.party.count({ where });
  }

  static async update(id: string, data: Prisma.PartyUpdateInput) {
    return prisma.party.update({ where: { id }, data });
  }
}
