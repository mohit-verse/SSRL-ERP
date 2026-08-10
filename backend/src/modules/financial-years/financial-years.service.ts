import { FinancialYearsRepository } from './financial-years.repository';
import { executeTransaction } from '../../prisma/client';
import { BusinessError, NotFoundError } from '../../utils/errors';

import { Prisma } from '@prisma/client';

export class FinancialYearsService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async createFinancialYear(data: any) {
    return FinancialYearsRepository.create({
      display_name: data.display_name,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date),
      is_active: false, // Must be explicitly activated
    });
  }

  static async listFinancialYears() {
    return FinancialYearsRepository.findAll();
  }

  static async getFinancialYear(id: string) {
    const fy = await FinancialYearsRepository.findById(id);
    if (!fy) throw new NotFoundError('Financial Year not found');
    return fy;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async updateFinancialYear(id: string, data: any) {
    const fy = await FinancialYearsRepository.findById(id);
    if (!fy) throw new NotFoundError('Financial Year not found');

    const updateData: Prisma.FinancialYearUpdateInput = {};
    if (data.display_name) updateData.display_name = data.display_name;
    if (data.start_date) updateData.start_date = new Date(data.start_date);
    if (data.end_date) updateData.end_date = new Date(data.end_date);

    return FinancialYearsRepository.update(id, updateData);
  }

  static async activateFinancialYear(id: string) {
    const targetFy = await FinancialYearsRepository.findById(id);
    if (!targetFy) throw new NotFoundError('Financial Year not found');

    if (targetFy.is_active) {
      throw new BusinessError('Financial Year is already active');
    }

    await executeTransaction(async (tx) => {
      // Deactivate all current active years (should be only one, but we update all to be safe)
      await tx.financialYear.updateMany({
        where: { is_active: true },
        data: { is_active: false },
      });

      // Activate target
      await tx.financialYear.update({
        where: { id },
        data: { is_active: true },
      });

      // Reset sequence logic is triggered automatically when a new FY is activated
      // as number_sequences are mapped to financial_year_id.
    });
  }
}
