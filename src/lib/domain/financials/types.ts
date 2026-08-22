export interface PartyFinancialCalculationInput {
  freight: number;
  unloading_charges: number;
  detention: number;
  additional_charges: number;
  deductions: number;
  tds_amount: number;
}

export interface PartyFinancialCalculationResult {
  gross_receivable: number;
  net_receivable: number;
}

export interface OwnerFinancialCalculationInput {
  freight: number;
  detention: number;
  additional_charges: number;
  unloading_charges: number;
  total_deductions: number;
}

export interface OwnerFinancialCalculationResult {
  net_payable: number;
}
