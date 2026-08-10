import { NumberSequencesRepository } from './number-sequences.repository';
import { BusinessError, NotFoundError } from '../../utils/errors';
import { SequenceKey } from '@prisma/client';
import { FinancialYearsRepository } from '../financial-years/financial-years.repository';

export class NumberSequencesModuleService {
  static async getCurrentSequences() {
    const activeFy = await FinancialYearsRepository.findActive();
    if (!activeFy) {
      throw new BusinessError('No active Financial Year found');
    }
    return NumberSequencesRepository.findByFinancialYear(activeFy.id);
  }

  static async previewNextNumber(sequenceKey: SequenceKey) {
    const activeFy = await FinancialYearsRepository.findActive();
    if (!activeFy) {
      throw new BusinessError('No active Financial Year found');
    }

    const sequence = await NumberSequencesRepository.findByKeyAndYear(sequenceKey, activeFy.id);
    if (!sequence) {
      throw new NotFoundError(`Sequence ${sequenceKey} not initialized for active financial year`);
    }

    const nextNumber = sequence.last_number + 1;
    const formattedNumber = String(nextNumber).padStart(4, '0');
    return `${sequence.prefix}${formattedNumber}`;
  }

  static async resetForActiveFinancialYear(prefixes: Record<string, string>) {
    const activeFy = await FinancialYearsRepository.findActive();
    if (!activeFy) {
      throw new BusinessError('No active Financial Year found');
    }

    const keys = Object.values(SequenceKey);
    const results = [];

    for (const key of keys) {
      const prefix = prefixes[key] || key.substring(0, 2).toUpperCase(); // Default prefix
      const result = await NumberSequencesRepository.upsert({
        sequence_key: key,
        prefix,
        last_number: 0,
        financial_year: { connect: { id: activeFy.id } },
      });
      results.push(result);
    }

    return results;
  }
}
