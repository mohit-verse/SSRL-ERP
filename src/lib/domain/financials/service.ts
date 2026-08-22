import { 
  PartyFinancialCalculationInput, 
  PartyFinancialCalculationResult, 
  OwnerFinancialCalculationInput, 
  OwnerFinancialCalculationResult 
} from './types';

export class FinancialValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FinancialValidationError';
  }
}

/**
 * Calculates Party Gross and Net Receivables adhering strictly to Architecture v1.2.
 * Invariant: Deductions + TDS <= Gross Receivable
 * Invariant: Non-negative inputs
 */
export function calculatePartyFinancials(input: PartyFinancialCalculationInput): PartyFinancialCalculationResult {
  const { freight, unloading_charges, detention, additional_charges, deductions, tds_amount } = input;

  if (freight < 0 || unloading_charges < 0 || detention < 0 || additional_charges < 0 || deductions < 0 || tds_amount < 0) {
    throw new FinancialValidationError('Financial fields cannot be negative');
  }

  const gross_receivable = freight + unloading_charges + detention + additional_charges;
  const total_reductions = deductions + tds_amount;

  if (total_reductions > gross_receivable) {
    throw new FinancialValidationError(`Party deductions + TDS (₹${total_reductions}) cannot exceed gross receivable (₹${gross_receivable})`);
  }

  const net_receivable = gross_receivable - total_reductions;

  return {
    gross_receivable,
    net_receivable,
  };
}

/**
 * Calculates Vehicle Owner Net Payable adhering strictly to Architecture v1.2.
 * Invariant: total_deductions <= freight
 * Invariant: Non-negative inputs
 */
export function calculateOwnerFinancials(input: OwnerFinancialCalculationInput): OwnerFinancialCalculationResult {
  const { freight, detention, additional_charges, unloading_charges, total_deductions } = input;

  if (freight < 0 || detention < 0 || additional_charges < 0 || unloading_charges < 0 || total_deductions < 0) {
    throw new FinancialValidationError('Financial fields cannot be negative');
  }

  if (total_deductions > freight) {
    throw new FinancialValidationError(`Owner deductions (₹${total_deductions}) cannot exceed gross freight (₹${freight})`);
  }

  const net_payable = (freight - total_deductions) + detention + additional_charges + unloading_charges;

  return {
    net_payable,
  };
}
