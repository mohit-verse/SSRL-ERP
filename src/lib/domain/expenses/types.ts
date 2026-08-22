import { OwnExpenseCategory } from '@/lib/types';

export interface CreateOwnExpenseInput {
  vehicle_id: string;
  driver_id?: string;
  trip_id?: string;
  expense_type: OwnExpenseCategory;
  amount: number;
  expense_date: string;
  reason_or_remark: string;
}

export interface CreateGeneralExpenseInput {
  category: string;
  amount: number;
  expense_date: string;
  reason_or_remark?: string;
}
