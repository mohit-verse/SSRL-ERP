import { prisma } from '../../prisma/client';
import { Prisma } from '@prisma/client';

export class FinancialYearsRepository {
  static async create(data: Prisma.FinancialYearCreateInput) {
    return prisma.financialYear.create({ data });
  }

  static async findById(id: string) {
    return prisma.financialYear.findUnique({ where: { id } });
  }

  static async findAll() {
    return prisma.financialYear.findMany({ orderBy: { start_date: 'desc' } });
  }

  static async update(id: string, data: Prisma.FinancialYearUpdateInput) {
    return prisma.financialYear.update({ where: { id }, data });
  }

  static async findActive() {
    return prisma.financialYear.findFirst({ where: { is_active: true } });
  }
}
