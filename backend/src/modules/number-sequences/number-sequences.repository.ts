import { prisma } from '../../prisma/client';
import { Prisma, SequenceKey } from '@prisma/client';

export class NumberSequencesRepository {
  static async create(data: Prisma.NumberSequenceCreateInput) {
    return prisma.numberSequence.create({ data });
  }

  static async findByFinancialYear(financial_year_id: string) {
    return prisma.numberSequence.findMany({ where: { financial_year_id } });
  }

  static async findByKeyAndYear(sequence_key: SequenceKey, financial_year_id: string) {
    return prisma.numberSequence.findUnique({
      where: {
        financial_year_id_sequence_key: {
          financial_year_id,
          sequence_key,
        },
      },
    });
  }

  static async upsert(data: Prisma.NumberSequenceCreateInput) {
    return prisma.numberSequence.upsert({
      where: {
        financial_year_id_sequence_key: {
          financial_year_id: data.financial_year.connect!.id!,
          sequence_key: data.sequence_key,
        },
      },
      update: {
        prefix: data.prefix,
        last_number: data.last_number,
      },
      create: data,
    });
  }
}
