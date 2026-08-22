/**
 * Deterministic Normalization & Input Validation Utilities
 */

export function normalizeVehicleNumber(vehicleNo: string): string {
  if (!vehicleNo) return '';
  return vehicleNo.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9+]/g, '');
}

export function isValidGSTIN(gstin: string): boolean {
  if (!gstin) return true; // Optional field
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin.trim().toUpperCase());
}

export function isValidPAN(pan: string): boolean {
  if (!pan) return true; // Optional field
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.trim().toUpperCase());
}

export function isValidEmail(email: string): boolean {
  if (!email) return true; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function maskBankDetails(bankDetails: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!bankDetails) return {};
  const masked: Record<string, unknown> = { ...bankDetails };
  if (typeof masked.account_number === 'string') {
    const acc = masked.account_number;
    masked.account_number = acc.length > 4 ? `••••••••${acc.slice(-4)}` : '••••';
  }
  return masked;
}
