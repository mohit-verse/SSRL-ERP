import { PrismaClient, SequenceKey } from '@prisma/client';
import { BusinessError } from '../utils/errors';

export class NumberSequenceService {
  /**
   * Generates the next sequence number for a given key and financial year.
   * Uses atomic update to prevent race conditions.
   */
  static async generateNextNumber(
    tx: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
    financialYearId: string,
    sequenceKey: SequenceKey,
  ): Promise<string> {
    try {
      const sequence = await tx.numberSequence.update({
        where: {
          financial_year_id_sequence_key: {
            financial_year_id: financialYearId,
            sequence_key: sequenceKey,
          },
        },
        data: {
          last_number: {
            increment: 1,
          },
        },
      });

      // Format: PREFIX + padded number (e.g., TR0001)
      const formattedNumber = String(sequence.last_number).padStart(4, '0');
      return `${sequence.prefix}${formattedNumber}`;
    } catch (error) {
      throw new BusinessError(
        `Failed to generate number sequence for ${sequenceKey}. Ensure it is initialized for the financial year.`,
      );
    }
  }
}
