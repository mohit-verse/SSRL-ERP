import { VehicleType } from '@prisma/client';

export interface TripFinancialInput {
  vehicleType: VehicleType;
  freightRate: number;
  customerAdvance: number;
  vehicleRate: number;
  ownerAdvance: number;
  currentExpensesTotal: number;
}

export interface TripFinancialOutput {
  customerBalance: number;
  ownerBalance: number | null;
  revenue: number;
  expense: number;
  profit: number;
}

export class TripFinancialService {
  static calculateAll(input: TripFinancialInput): TripFinancialOutput {
    const customerBalance = input.freightRate - input.customerAdvance;
    const revenue = input.freightRate;

    let ownerBalance: number | null = null;
    let expense = 0;

    if (input.vehicleType === VehicleType.EXTERNAL) {
      ownerBalance = input.vehicleRate - input.ownerAdvance;
      expense = input.vehicleRate;
    } else {
      expense = input.currentExpensesTotal;
    }

    const profit = revenue - expense;

    return {
      customerBalance,
      ownerBalance,
      revenue,
      expense,
      profit,
    };
  }
}
