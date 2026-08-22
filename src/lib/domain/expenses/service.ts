import { CreateOwnExpenseInput, CreateGeneralExpenseInput } from './types';

export interface IExpenseService {
  recordOwnVehicleExpense(input: CreateOwnExpenseInput, userId: string): Promise<void>;
  recordGeneralExpense(input: CreateGeneralExpenseInput, userId: string): Promise<void>;
  softDeleteGeneralExpense(id: string, userId: string): Promise<void>;
}

export class ExpenseService implements IExpenseService {
  async recordOwnVehicleExpense(_input: CreateOwnExpenseInput, _userId: string): Promise<void> {
    throw new Error('ExpenseService.recordOwnVehicleExpense not implemented in Phase 1 foundation.');
  }

  async recordGeneralExpense(_input: CreateGeneralExpenseInput, _userId: string): Promise<void> {
    throw new Error('ExpenseService.recordGeneralExpense not implemented in Phase 1 foundation.');
  }

  async softDeleteGeneralExpense(_id: string, _userId: string): Promise<void> {
    throw new Error('ExpenseService.softDeleteGeneralExpense not implemented in Phase 1 foundation.');
  }
}
